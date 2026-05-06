from __future__ import annotations

from datetime import UTC, date, datetime, time, timedelta
from typing import Any
from uuid import UUID, uuid4

from model.availability import AvailabilitySlot
from repository.supabase_client import get_supabase_admin_client

AVAILABILITY_SELECT = "id, adviser_id, slot_start, slot_end, is_blocked"
DEFAULT_SCHEDULE_DURATION = timedelta(hours=1)


class AvailabilityRepositoryNotFoundError(LookupError):
    """Raised when the requested availability slot does not exist."""


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


def _normalize_day_bounds(value: date | datetime | None) -> tuple[datetime, datetime] | None:
    if value is None:
        return None

    if isinstance(value, datetime):
        current = value.astimezone(UTC) if value.tzinfo else value.replace(tzinfo=UTC)
        day_value = current.date()
    else:
        day_value = value

    return (
        datetime.combine(day_value, time.min, tzinfo=UTC),
        datetime.combine(day_value, time.max, tzinfo=UTC),
    )


def _parse_datetime(value: str | None) -> datetime | None:
    if not value:
        return None

    normalized = value.replace("Z", "+00:00")
    parsed = datetime.fromisoformat(normalized)

    if parsed.tzinfo is None:
        return parsed.replace(tzinfo=UTC)

    return parsed.astimezone(UTC)


def _to_availability_slot(row: dict[str, Any]) -> AvailabilitySlot:
    return AvailabilitySlot.model_validate(
        {
            "id": row.get("id"),
            "adviser_id": row.get("adviser_id"),
            "slot_start": row.get("slot_start"),
            "slot_end": row.get("slot_end"),
            "is_blocked": row.get("is_blocked"),
        }
    )


class AvailabilityRepository:
    """Supabase-backed repository for raw availability slot queries."""

    def __init__(self, client: Any | None = None) -> None:
        self._client = client or get_supabase_admin_client()

    def _get_by_id(self, slot_id: UUID | str) -> AvailabilitySlot | None:
        response = (
            self._client.table("availability_slots")
            .select(AVAILABILITY_SELECT)
            .eq("id", str(slot_id))
            .execute()
        )
        row = _first_row(response.data)

        if row is None:
            return None

        return _to_availability_slot(row)

    def get_by_id(self, slot_id: UUID | str) -> AvailabilitySlot | None:
        return self._get_by_id(slot_id)

    def _get_schedule_status_id(self, status_name: str) -> int | None:
        response = (
            self._client.table("schedule_statuses")
            .select("id")
            .eq("name", status_name.strip().lower())
            .execute()
        )
        row = _first_row(response.data)

        if row is None:
            return None

        try:
            return int(row["id"])
        except (KeyError, TypeError, ValueError):
            return None

    def create(
        self,
        adviser_id: UUID,
        slot_start: datetime,
        slot_end: datetime,
    ) -> AvailabilitySlot:
        slot_id = uuid4()
        payload = {
            "id": str(slot_id),
            "adviser_id": str(adviser_id),
            "slot_start": slot_start.isoformat(),
            "slot_end": slot_end.isoformat(),
        }
        response = self._client.table("availability_slots").insert(payload).execute()
        row = _first_row(response.data)

        if row is not None:
            return _to_availability_slot(row)

        slot = self._get_by_id(slot_id)
        if slot is None:
            raise AvailabilityRepositoryNotFoundError(
                "Created availability slot could not be reloaded."
            )

        return slot

    def list_by_adviser(self, adviser_id: UUID | str) -> list[AvailabilitySlot]:
        response = (
            self._client.table("availability_slots")
            .select(AVAILABILITY_SELECT)
            .eq("adviser_id", str(adviser_id))
            .order("slot_start")
            .execute()
        )

        return [_to_availability_slot(row) for row in _rows(response.data)]

    def get_free_slots(
        self,
        adviser_id: UUID | str,
        day: date | datetime | None = None,
    ) -> list[AvailabilitySlot]:
        approved_status_id = self._get_schedule_status_id("approved")
        availability_query = (
            self._client.table("availability_slots")
            .select(AVAILABILITY_SELECT)
            .eq("adviser_id", str(adviser_id))
            .eq("is_blocked", False)
            .order("slot_start")
        )

        day_bounds = _normalize_day_bounds(day)
        if day_bounds is not None:
            day_start, day_end = day_bounds
            availability_query = availability_query.lt("slot_start", day_end.isoformat()).gt(
                "slot_end", day_start.isoformat()
            )

        availability_response = availability_query.execute()
        slots = [_to_availability_slot(row) for row in _rows(availability_response.data)]

        if not slots or approved_status_id is None:
            return slots

        schedule_query = (
            self._client.table("schedules")
            .select("scheduled_at")
            .eq("adviser_id", str(adviser_id))
            .eq("status_id", approved_status_id)
            .not_.is_("scheduled_at", "null")
        )

        if day_bounds is not None:
            day_start, day_end = day_bounds
            schedule_query = schedule_query.gte(
                "scheduled_at",
                (day_start - DEFAULT_SCHEDULE_DURATION).isoformat(),
            ).lte(
                "scheduled_at",
                day_end.isoformat(),
            )

        schedule_response = schedule_query.execute()
        approved_schedule_times = [
            scheduled_at
            for row in _rows(schedule_response.data)
            if (scheduled_at := _parse_datetime(row.get("scheduled_at"))) is not None
        ]

        free_slots: list[AvailabilitySlot] = []
        for slot in slots:
            has_overlap = any(
                scheduled_at < slot.slot_end
                and scheduled_at + DEFAULT_SCHEDULE_DURATION > slot.slot_start
                for scheduled_at in approved_schedule_times
            )
            if not has_overlap:
                free_slots.append(slot)

        return free_slots

    def update_blocked(self, slot_id: UUID | str, is_blocked: bool) -> AvailabilitySlot:
        if self._get_by_id(slot_id) is None:
            raise AvailabilityRepositoryNotFoundError("Availability slot was not found.")

        response = (
            self._client.table("availability_slots")
            .update({"is_blocked": is_blocked})
            .eq("id", str(slot_id))
            .execute()
        )
        row = _first_row(response.data)

        if row is not None:
            return _to_availability_slot(row)

        slot = self._get_by_id(slot_id)
        if slot is None:
            raise AvailabilityRepositoryNotFoundError("Availability slot was not found.")

        return slot

    def delete(self, slot_id: UUID | str) -> None:
        if self._get_by_id(slot_id) is None:
            raise AvailabilityRepositoryNotFoundError("Availability slot was not found.")

        self._client.table("availability_slots").delete().eq("id", str(slot_id)).execute()


def get_availability_repository() -> AvailabilityRepository:
    return AvailabilityRepository()
