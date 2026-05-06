from __future__ import annotations

from datetime import UTC, datetime
from typing import Final
from uuid import UUID

from model.schedule import ScheduleListFilters
from repository.availability_repository import AvailabilityRepository
from repository.schedule_repository import ScheduleRepository
from usecase.schedules import (
    ScheduleConflictError,
    ScheduleServiceUnavailableError,
)

APPROVED_STATUS_NAME: Final[str] = "approved"
SLOT_UNAVAILABLE_REASON: Final[str] = "slot_unavailable"
SLOT_BLOCKED_REASON: Final[str] = "slot_blocked"


def _normalize_datetime(value: datetime) -> datetime:
    if value.tzinfo is None:
        return value.replace(tzinfo=UTC)

    return value.astimezone(UTC)


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
        approved_status_id = self._schedule_repository.get_status_id_by_name(APPROVED_STATUS_NAME)
        if approved_status_id is None:
            raise ScheduleServiceUnavailableError(
                f'Required schedule status "{APPROVED_STATUS_NAME}" is missing.'
            )

        matching_unblocked_ranges: list[tuple[datetime, datetime]] = []
        for slot in self._availability_repository.list_by_adviser(adviser_id):
            slot_start = _normalize_datetime(slot.slot_start)
            slot_end = _normalize_datetime(slot.slot_end)
            if not slot_start <= normalized_scheduled_at < slot_end:
                continue

            if slot.is_blocked:
                raise ScheduleConflictError(
                    "The requested slot is blocked.",
                    reason=SLOT_BLOCKED_REASON,
                )

            matching_unblocked_ranges.append((slot_start, slot_end))

        for slot_start, slot_end in matching_unblocked_ranges:
            schedules_page = self._schedule_repository.list_by_adviser(
                adviser_id,
                ScheduleListFilters(
                    status_id=approved_status_id,
                    from_date=slot_start,
                    to_date=slot_end,
                    page=1,
                    limit=1000,
                ),
            )
            for schedule in schedules_page.items:
                if excluded_schedule_id is not None and schedule.id == excluded_schedule_id:
                    continue

                if schedule.scheduled_at is None:
                    continue

                existing_scheduled_at = _normalize_datetime(schedule.scheduled_at)
                if slot_start <= existing_scheduled_at < slot_end:
                    raise ScheduleConflictError(
                        "The requested slot is already unavailable.",
                        reason=SLOT_UNAVAILABLE_REASON,
                    )

        if matching_unblocked_ranges:
            return

        has_exact_conflict = self._schedule_repository.adviser_has_schedule_conflict(
            adviser_id=adviser_id,
            scheduled_at=normalized_scheduled_at,
            excluded_schedule_id=excluded_schedule_id,
            status_ids=[approved_status_id],
        )
        if has_exact_conflict:
            raise ScheduleConflictError(
                "The requested slot is already unavailable.",
                reason=SLOT_UNAVAILABLE_REASON,
            )
