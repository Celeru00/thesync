from __future__ import annotations

from datetime import UTC, datetime, timedelta
from typing import Final
from uuid import UUID
from zoneinfo import ZoneInfo

from repository.availability_repository import (
    AvailabilityRepository,
    AvailabilityRepositoryCalendarError,
    AvailabilityRepositoryUnavailableError,
)
from repository.schedule_repository import ScheduleRepository
from usecase.schedules import (
    ScheduleConflictError,
    ScheduleServiceUnavailableError,
)

SLOT_UNAVAILABLE_REASON: Final[str] = "slot_unavailable"
SLOT_BLOCKED_REASON: Final[str] = "slot_blocked"
DEFAULT_SCHEDULE_DURATION: Final[timedelta] = timedelta(hours=1)
SCHEDULE_TIMEZONE: Final[ZoneInfo] = ZoneInfo("Asia/Manila")


def _normalize_datetime(value: datetime) -> datetime:
    if value.tzinfo is None:
        return value.replace(tzinfo=UTC)

    return value.astimezone(UTC)


def _interval_contains(
    interval_start: datetime,
    interval_end: datetime,
    requested_start: datetime,
    requested_end: datetime,
) -> bool:
    return interval_start <= requested_start and requested_end <= interval_end


def _times_overlap(
    start_a: datetime,
    end_a: datetime,
    start_b: datetime,
    end_b: datetime,
) -> bool:
    return start_a < end_b and end_a > start_b


class ScheduleSlotGuard:
    """Shared service-layer guard for adviser slot availability checks."""

    def __init__(
        self,
        schedule_repository: ScheduleRepository,
        availability_repository: AvailabilityRepository,
    ) -> None:
        self._schedule_repository = schedule_repository
        self._availability_repository = availability_repository

    def ensure_slot_available(
        self,
        *,
        adviser_id: UUID,
        scheduled_at: datetime,
        excluded_schedule_id: UUID | None = None,
    ) -> None:
        normalized_scheduled_at = _normalize_datetime(scheduled_at)
        requested_end = normalized_scheduled_at + DEFAULT_SCHEDULE_DURATION
        requested_local_start = normalized_scheduled_at.astimezone(SCHEDULE_TIMEZONE)
        requested_local_end = requested_local_start + DEFAULT_SCHEDULE_DURATION

        try:
            free_slots = self._availability_repository.get_free_slots(
                adviser_id,
                requested_local_start.date(),
                excluded_schedule_id=excluded_schedule_id,
            )
        except (
            AvailabilityRepositoryCalendarError,
            AvailabilityRepositoryUnavailableError,
        ) as exc:
            raise ScheduleServiceUnavailableError(str(exc)) from exc

        for slot in free_slots:
            slot_start = _normalize_datetime(slot.slot_start)
            slot_end = _normalize_datetime(slot.slot_end)
            if _interval_contains(slot_start, slot_end, normalized_scheduled_at, requested_end):
                return

        try:
            matching_rules = [
                slot
                for slot in self._availability_repository.list_by_adviser(adviser_id)
                if slot.day_of_week == requested_local_start.weekday()
            ]
        except AvailabilityRepositoryUnavailableError as exc:
            raise ScheduleServiceUnavailableError(str(exc)) from exc

        for rule in matching_rules:
            rule_start = datetime.combine(
                requested_local_start.date(),
                rule.start_time,
                tzinfo=SCHEDULE_TIMEZONE,
            )
            rule_end = datetime.combine(
                requested_local_start.date(),
                rule.end_time,
                tzinfo=SCHEDULE_TIMEZONE,
            )

            if not _times_overlap(rule_start, rule_end, requested_local_start, requested_local_end):
                continue

            if rule.is_blocked and _interval_contains(
                rule_start,
                rule_end,
                requested_local_start,
                requested_local_end,
            ):
                raise ScheduleConflictError(
                    "The requested slot is blocked.",
                    reason=SLOT_BLOCKED_REASON,
                )

        raise ScheduleConflictError(
            "The requested slot is already unavailable.",
            reason=SLOT_UNAVAILABLE_REASON,
        )
