from __future__ import annotations

from dataclasses import dataclass
from datetime import UTC, date, datetime, time, timedelta
from typing import Any, NoReturn
from uuid import UUID, uuid4
from zoneinfo import ZoneInfo

from postgrest.exceptions import APIError
from sqlalchemy import select

from model.availability import AvailabilityRule, AvailabilitySlot
from repository.database import SessionLocal
from repository.google_calendar import (
    CalendarSyncConfigurationError,
    GoogleCalendarApiError,
    GoogleCalendarClient,
)
from repository.orm import GoogleCalendarConnectionRecord
from repository.supabase_client import get_supabase_admin_client

AVAILABILITY_SELECT = "id, adviser_id, day_of_week, start_time, end_time, is_blocked"
DEFAULT_SCHEDULE_DURATION = timedelta(hours=1)
BOOKING_INCREMENT = timedelta(minutes=30)
SCHEDULE_TIMEZONE = ZoneInfo("Asia/Manila")
DEFAULT_WEEKDAY_OPEN_WINDOWS = (
    (time(8, 0), time(12, 30)),
    (time(13, 0), time(18, 0)),
)


class AvailabilityRepositoryNotFoundError(LookupError):
    """Raised when the requested availability rule does not exist."""


class AvailabilityRepositoryCalendarError(RuntimeError):
    """Raised when Google Calendar conflicts cannot be evaluated safely."""


class AvailabilityRepositoryUnavailableError(RuntimeError):
    """Raised when availability storage cannot be used safely."""


@dataclass(frozen=True, slots=True)
class _BookableWindowSource:
    slot_id_prefix: str
    source_rule_id: UUID | None
    window_start: datetime
    window_end: datetime


def _first_row(data: Any) -> dict[str, Any] | None:
    if isinstance(data, dict):
        return data

    if isinstance(data, list):
        for row in data:
            if isinstance(row, dict):
                return row

    return None


def _rows(data: Any) -> list[dict[str, Any]]:
    if isinstance(data, dict):
        return [data]

    if isinstance(data, list):
        return [row for row in data if isinstance(row, dict)]

    return []


def _raise_unavailable_from_api_error(exc: APIError) -> NoReturn:
    error_text = " ".join(
        str(part)
        for part in (
            getattr(exc, "message", None),
            getattr(exc, "details", None),
            getattr(exc, "hint", None),
            str(exc),
        )
        if part
    )
    normalized_error_text = error_text.lower()

    if getattr(exc, "code", None) == "42703" and any(
        column_name in normalized_error_text
        for column_name in (
            "availability_slots.day_of_week",
            "availability_slots.start_time",
            "availability_slots.end_time",
        )
    ):
        raise AvailabilityRepositoryUnavailableError(
            "Availability database schema is out of date. "
            "Run `uv run alembic upgrade head` in `thesync-backend` and restart the backend."
        ) from exc

    raise AvailabilityRepositoryUnavailableError(
        "Availability storage is currently unavailable. Please try again."
    ) from exc


def _parse_datetime(value: str | None) -> datetime | None:
    if not value:
        return None

    normalized = value.replace("Z", "+00:00")
    parsed = datetime.fromisoformat(normalized)

    if parsed.tzinfo is None:
        return parsed.replace(tzinfo=UTC)

    return parsed.astimezone(UTC)


def _normalize_requested_day(value: date | datetime | None) -> date | None:
    if value is None:
        return None

    if isinstance(value, datetime):
        current = value.astimezone(SCHEDULE_TIMEZONE) if value.tzinfo else value
        return current.date()

    return value


def _to_availability_rule(row: dict[str, Any]) -> AvailabilityRule:
    return AvailabilityRule.model_validate(
        {
            "id": row.get("id"),
            "adviser_id": row.get("adviser_id"),
            "day_of_week": row.get("day_of_week"),
            "start_time": row.get("start_time"),
            "end_time": row.get("end_time"),
            "is_blocked": row.get("is_blocked"),
        }
    )


def _local_day_bounds(day_value: date) -> tuple[datetime, datetime]:
    local_day_start = datetime.combine(day_value, time.min, tzinfo=SCHEDULE_TIMEZONE)
    local_day_end = local_day_start + timedelta(days=1)
    return local_day_start, local_day_end


def _utc_day_bounds(day_value: date) -> tuple[datetime, datetime]:
    local_day_start, local_day_end = _local_day_bounds(day_value)
    return local_day_start.astimezone(UTC), local_day_end.astimezone(UTC)


def _build_rule_interval(
    *,
    day_value: date,
    start_time: time,
    end_time: time,
) -> tuple[datetime, datetime]:
    return (
        datetime.combine(day_value, start_time, tzinfo=SCHEDULE_TIMEZONE),
        datetime.combine(day_value, end_time, tzinfo=SCHEDULE_TIMEZONE),
    )


def _intervals_overlap(
    start_a: datetime,
    end_a: datetime,
    start_b: datetime,
    end_b: datetime,
) -> bool:
    return start_a < end_b and end_a > start_b


def _subtract_interval(
    windows: list[tuple[datetime, datetime]],
    blocked_start: datetime,
    blocked_end: datetime,
) -> list[tuple[datetime, datetime]]:
    next_windows: list[tuple[datetime, datetime]] = []

    for window_start, window_end in windows:
        if not _intervals_overlap(window_start, window_end, blocked_start, blocked_end):
            next_windows.append((window_start, window_end))
            continue

        if blocked_start > window_start:
            next_windows.append((window_start, min(blocked_start, window_end)))

        if blocked_end < window_end:
            next_windows.append((max(blocked_end, window_start), window_end))

    return [(start, end) for start, end in next_windows if end > start]


def _subtract_intervals(
    windows: list[tuple[datetime, datetime]],
    blocked_windows: list[tuple[datetime, datetime]],
) -> list[tuple[datetime, datetime]]:
    remaining = list(windows)

    for blocked_start, blocked_end in sorted(blocked_windows, key=lambda item: item[0]):
        remaining = _subtract_interval(remaining, blocked_start, blocked_end)
        if not remaining:
            break

    return remaining


def _round_up_to_increment(value: datetime) -> datetime:
    day_start = value.replace(hour=0, minute=0, second=0, microsecond=0)
    elapsed_seconds = int((value - day_start).total_seconds())
    increment_seconds = int(BOOKING_INCREMENT.total_seconds())
    remainder = elapsed_seconds % increment_seconds

    if remainder == 0 and value.second == 0 and value.microsecond == 0:
        return value.replace(second=0, microsecond=0)

    aligned_seconds = (
        elapsed_seconds if remainder == 0 else elapsed_seconds + (increment_seconds - remainder)
    )
    return day_start + timedelta(seconds=aligned_seconds)


def _build_bookable_slots(
    *,
    adviser_id: UUID | str,
    slot_id_prefix: str,
    source_rule_id: UUID | None,
    free_windows: list[tuple[datetime, datetime]],
) -> list[AvailabilitySlot]:
    slots: list[AvailabilitySlot] = []

    for window_start, window_end in free_windows:
        current_start = _round_up_to_increment(window_start)

        while current_start + DEFAULT_SCHEDULE_DURATION <= window_end:
            current_end = current_start + DEFAULT_SCHEDULE_DURATION
            slot_start_utc = current_start.astimezone(UTC)
            slot_end_utc = current_end.astimezone(UTC)
            slot_id = f"{slot_id_prefix}:{slot_start_utc.isoformat()}"
            slots.append(
                AvailabilitySlot.model_validate(
                    {
                        "id": slot_id,
                        "adviser_id": adviser_id,
                        "slot_start": slot_start_utc,
                        "slot_end": slot_end_utc,
                        "is_blocked": False,
                        "source_rule_id": source_rule_id,
                    }
                )
            )
            current_start += BOOKING_INCREMENT

    return slots


def _build_default_window_sources(day_value: date) -> list[_BookableWindowSource]:
    return [
        _BookableWindowSource(
            slot_id_prefix=f"default-{day_value.isoformat()}-{index}",
            source_rule_id=None,
            window_start=datetime.combine(day_value, start_time, tzinfo=SCHEDULE_TIMEZONE),
            window_end=datetime.combine(day_value, end_time, tzinfo=SCHEDULE_TIMEZONE),
        )
        for index, (start_time, end_time) in enumerate(DEFAULT_WEEKDAY_OPEN_WINDOWS)
    ]


class AvailabilityRepository:
    """Supabase-backed repository for recurring adviser availability rules."""

    def __init__(self, client: Any | None = None) -> None:
        self._client = client or get_supabase_admin_client()

    def _execute(self, request: Any) -> Any:
        try:
            return request.execute()
        except APIError as exc:
            _raise_unavailable_from_api_error(exc)

    def _get_by_id(self, slot_id: UUID | str) -> AvailabilityRule | None:
        response = self._execute(
            self._client.table("availability_slots")
            .select(AVAILABILITY_SELECT)
            .eq("id", str(slot_id))
        )
        row = _first_row(response.data)

        if row is None:
            return None

        return _to_availability_rule(row)

    def get_by_id(self, slot_id: UUID | str) -> AvailabilityRule | None:
        return self._get_by_id(slot_id)

    def _get_schedule_status_id(self, status_name: str) -> int | None:
        response = self._execute(
            self._client.table("schedule_statuses")
            .select("id")
            .eq("name", status_name.strip().lower())
        )
        row = _first_row(response.data)

        if row is None:
            return None

        try:
            return int(row["id"])
        except (KeyError, TypeError, ValueError):
            return None

    def _list_busy_schedule_intervals(
        self,
        *,
        adviser_id: UUID | str,
        day_value: date,
        excluded_schedule_id: UUID | str | None = None,
    ) -> list[tuple[datetime, datetime]]:
        approved_status_id = self._get_schedule_status_id("approved")
        if approved_status_id is None:
            return []

        day_start_utc, day_end_utc = _utc_day_bounds(day_value)
        schedule_query = (
            self._client.table("schedules")
            .select("id, scheduled_at")
            .eq("adviser_id", str(adviser_id))
            .eq("status_id", approved_status_id)
            .not_.is_("scheduled_at", "null")
            .gte("scheduled_at", (day_start_utc - DEFAULT_SCHEDULE_DURATION).isoformat())
            .lt("scheduled_at", day_end_utc.isoformat())
        )

        if excluded_schedule_id is not None:
            schedule_query = schedule_query.neq("id", str(excluded_schedule_id))

        schedule_response = self._execute(schedule_query)
        intervals: list[tuple[datetime, datetime]] = []

        for row in _rows(schedule_response.data):
            scheduled_at = _parse_datetime(row.get("scheduled_at"))
            if scheduled_at is None:
                continue

            local_start = scheduled_at.astimezone(SCHEDULE_TIMEZONE)
            local_end = local_start + DEFAULT_SCHEDULE_DURATION
            intervals.append((local_start, local_end))

        return intervals

    def _load_calendar_connection(
        self,
        adviser_id: UUID | str,
    ) -> GoogleCalendarConnectionRecord | None:
        try:
            normalized_adviser_id = UUID(str(adviser_id))
        except ValueError:
            return None

        with SessionLocal() as session:
            record = session.execute(
                select(GoogleCalendarConnectionRecord).where(
                    GoogleCalendarConnectionRecord.user_id == normalized_adviser_id
                )
            ).scalar_one_or_none()
            if record is not None:
                session.expunge(record)
            return record

    def _list_google_calendar_intervals(
        self,
        *,
        adviser_id: UUID | str,
        day_value: date,
    ) -> list[tuple[datetime, datetime]]:
        connection = self._load_calendar_connection(adviser_id)
        if connection is None:
            return []

        day_start_utc, day_end_utc = _utc_day_bounds(day_value)
        client = GoogleCalendarClient(connection)

        try:
            events = client.list_events(time_min=day_start_utc, time_max=day_end_utc)
        except CalendarSyncConfigurationError as exc:
            raise AvailabilityRepositoryCalendarError(
                "Google Calendar integration is not configured on the server."
            ) from exc
        except GoogleCalendarApiError as exc:
            raise AvailabilityRepositoryCalendarError(
                "We couldn't verify the adviser's Google Calendar right now. Please try again."
            ) from exc

        intervals: list[tuple[datetime, datetime]] = []
        for event in events:
            if event.status == "cancelled" or event.starts_at is None or event.ends_at is None:
                continue

            intervals.append(
                (
                    event.starts_at.astimezone(SCHEDULE_TIMEZONE),
                    event.ends_at.astimezone(SCHEDULE_TIMEZONE),
                )
            )

        return intervals

    def create(
        self,
        adviser_id: UUID,
        *,
        day_of_week: int,
        start_time: time,
        end_time: time,
        is_blocked: bool = False,
    ) -> AvailabilityRule:
        slot_id = uuid4()
        payload = {
            "id": str(slot_id),
            "adviser_id": str(adviser_id),
            "day_of_week": day_of_week,
            "start_time": start_time.isoformat(),
            "end_time": end_time.isoformat(),
            "is_blocked": is_blocked,
        }
        response = self._execute(self._client.table("availability_slots").insert(payload))
        row = _first_row(response.data)

        if row is not None:
            return _to_availability_rule(row)

        slot = self._get_by_id(slot_id)
        if slot is None:
            raise AvailabilityRepositoryNotFoundError(
                "Created availability rule could not be reloaded."
            )

        return slot

    def list_by_adviser(self, adviser_id: UUID | str) -> list[AvailabilityRule]:
        response = self._execute(
            self._client.table("availability_slots")
            .select(AVAILABILITY_SELECT)
            .eq("adviser_id", str(adviser_id))
            .order("day_of_week")
            .order("start_time")
        )

        return [_to_availability_rule(row) for row in _rows(response.data)]

    def get_free_slots(
        self,
        adviser_id: UUID | str,
        day: date | datetime | None = None,
        *,
        excluded_schedule_id: UUID | str | None = None,
    ) -> list[AvailabilitySlot]:
        day_value = _normalize_requested_day(day)
        if day_value is None:
            return []
        if day_value.weekday() > 4:
            return []

        day_rules = [
            rule
            for rule in self.list_by_adviser(adviser_id)
            if rule.day_of_week == day_value.weekday()
        ]
        available_rules = [rule for rule in day_rules if not rule.is_blocked]

        blocked_windows = [
            _build_rule_interval(
                day_value=day_value,
                start_time=rule.start_time,
                end_time=rule.end_time,
            )
            for rule in day_rules
            if rule.is_blocked
        ]
        blocked_windows.extend(
            self._list_busy_schedule_intervals(
                adviser_id=adviser_id,
                day_value=day_value,
                excluded_schedule_id=excluded_schedule_id,
            )
        )
        blocked_windows.extend(
            self._list_google_calendar_intervals(
                adviser_id=adviser_id,
                day_value=day_value,
            )
        )

        available_window_sources = (
            [
                _BookableWindowSource(
                    slot_id_prefix=str(rule.id),
                    source_rule_id=rule.id,
                    window_start=datetime.combine(
                        day_value,
                        rule.start_time,
                        tzinfo=SCHEDULE_TIMEZONE,
                    ),
                    window_end=datetime.combine(
                        day_value,
                        rule.end_time,
                        tzinfo=SCHEDULE_TIMEZONE,
                    ),
                )
                for rule in available_rules
            ]
            if available_rules
            else _build_default_window_sources(day_value)
        )

        free_slots: list[AvailabilitySlot] = []
        for source in available_window_sources:
            rule_window = (source.window_start, source.window_end)
            relevant_blockers = [
                interval
                for interval in blocked_windows
                if _intervals_overlap(rule_window[0], rule_window[1], interval[0], interval[1])
            ]
            free_windows = _subtract_intervals([rule_window], relevant_blockers)
            free_slots.extend(
                _build_bookable_slots(
                    adviser_id=adviser_id,
                    slot_id_prefix=source.slot_id_prefix,
                    source_rule_id=source.source_rule_id,
                    free_windows=free_windows,
                )
            )

        return sorted(free_slots, key=lambda slot: slot.slot_start)

    def update_blocked(self, slot_id: UUID | str, is_blocked: bool) -> AvailabilityRule:
        if self._get_by_id(slot_id) is None:
            raise AvailabilityRepositoryNotFoundError("Availability rule was not found.")

        response = self._execute(
            self._client.table("availability_slots")
            .update({"is_blocked": is_blocked})
            .eq("id", str(slot_id))
        )
        row = _first_row(response.data)

        if row is not None:
            return _to_availability_rule(row)

        slot = self._get_by_id(slot_id)
        if slot is None:
            raise AvailabilityRepositoryNotFoundError("Availability rule was not found.")

        return slot

    def delete(self, slot_id: UUID | str) -> None:
        if self._get_by_id(slot_id) is None:
            raise AvailabilityRepositoryNotFoundError("Availability rule was not found.")

        self._execute(self._client.table("availability_slots").delete().eq("id", str(slot_id)))


def get_availability_repository() -> AvailabilityRepository:
    return AvailabilityRepository()
