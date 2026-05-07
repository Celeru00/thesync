from __future__ import annotations

import unittest
from datetime import UTC, datetime
from uuid import UUID, uuid4

from model.availability import AvailabilitySlot
from model.base import PaginatedResult
from model.schedule import Schedule, ScheduleListFilters
from usecase.schedule_slot_guard import (
    SLOT_BLOCKED_REASON,
    SLOT_UNAVAILABLE_REASON,
    ScheduleSlotGuard,
)
from usecase.schedules import ScheduleConflictError


class _FakeAvailabilityRepository:
    def __init__(self, slots: list[AvailabilitySlot]) -> None:
        self._slots = slots

    def list_by_adviser(self, adviser_id: UUID | str) -> list[AvailabilitySlot]:
        adviser_id_as_str = str(adviser_id)
        return [slot for slot in self._slots if str(slot.adviser_id) == adviser_id_as_str]


class _FakeScheduleRepository:
    def __init__(self, schedules: list[Schedule], *, approved_status_id: int = 2) -> None:
        self._schedules = schedules
        self._approved_status_id = approved_status_id

    def get_status_id_by_name(self, status_name: str) -> int | None:
        if status_name == "approved":
            return self._approved_status_id

        return None

    def list_by_adviser(
        self,
        adviser_id: UUID | str,
        filters: ScheduleListFilters,
    ) -> PaginatedResult[Schedule]:
        adviser_id_as_str = str(adviser_id)
        items: list[Schedule] = []
        for schedule in self._schedules:
            if str(schedule.adviser_id) != adviser_id_as_str:
                continue
            if filters.status_id is not None and schedule.status_id != filters.status_id:
                continue
            if schedule.scheduled_at is None:
                continue
            if filters.from_date is not None and schedule.scheduled_at < filters.from_date:
                continue
            if filters.to_date is not None and schedule.scheduled_at > filters.to_date:
                continue
            items.append(schedule)

        return PaginatedResult[Schedule](
            items=items,
            total=len(items),
            page=filters.page,
            page_size=filters.limit,
        )

    def adviser_has_schedule_conflict(
        self,
        *,
        adviser_id: UUID | str,
        scheduled_at: datetime,
        excluded_schedule_id: UUID | str | None = None,
        status_ids: list[int] | None = None,
    ) -> bool:
        adviser_id_as_str = str(adviser_id)
        excluded_schedule_id_as_str = str(excluded_schedule_id) if excluded_schedule_id else None
        allowed_status_ids = set(status_ids or [])
        for schedule in self._schedules:
            if str(schedule.adviser_id) != adviser_id_as_str:
                continue
            if (
                excluded_schedule_id_as_str is not None
                and str(schedule.id) == excluded_schedule_id_as_str
            ):
                continue
            if schedule.scheduled_at != scheduled_at:
                continue
            if allowed_status_ids and schedule.status_id not in allowed_status_ids:
                continue
            return True

        return False


def _build_slot(
    *,
    adviser_id: UUID,
    slot_start: datetime,
    slot_end: datetime,
    is_blocked: bool,
) -> AvailabilitySlot:
    return AvailabilitySlot(
        id=uuid4(),
        adviser_id=adviser_id,
        slot_start=slot_start,
        slot_end=slot_end,
        is_blocked=is_blocked,
    )


def _build_schedule(
    *,
    adviser_id: UUID,
    scheduled_at: datetime,
    status_id: int = 2,
) -> Schedule:
    return Schedule(
        id=uuid4(),
        student_id=uuid4(),
        adviser_id=adviser_id,
        type_id=1,
        status_id=status_id,
        topic="Sample Topic",
        requested_at=datetime(2026, 5, 6, 9, 0, tzinfo=UTC),
        scheduled_at=scheduled_at,
        created_at=datetime(2026, 5, 6, 9, 0, tzinfo=UTC),
    )


class ScheduleSlotGuardTests(unittest.TestCase):
    def test_free_slot_with_back_to_back_approved_schedule_is_allowed(self) -> None:
        adviser_id = uuid4()
        requested_at = datetime(2026, 5, 7, 9, 30, tzinfo=UTC)
        slots = [
            _build_slot(
                adviser_id=adviser_id,
                slot_start=datetime(2026, 5, 7, 9, 0, tzinfo=UTC),
                slot_end=datetime(2026, 5, 7, 10, 0, tzinfo=UTC),
                is_blocked=False,
            )
        ]
        schedules = [
            _build_schedule(
                adviser_id=adviser_id,
                scheduled_at=datetime(2026, 5, 7, 10, 0, tzinfo=UTC),
            )
        ]
        guard = ScheduleSlotGuard(
            _FakeScheduleRepository(schedules),
            _FakeAvailabilityRepository(slots),
        )

        guard.ensure_slot_available(adviser_id=adviser_id, scheduled_at=requested_at)

    def test_conflicting_approved_schedule_raises_slot_unavailable(self) -> None:
        adviser_id = uuid4()
        requested_at = datetime(2026, 5, 7, 9, 30, tzinfo=UTC)
        slots = [
            _build_slot(
                adviser_id=adviser_id,
                slot_start=datetime(2026, 5, 7, 9, 0, tzinfo=UTC),
                slot_end=datetime(2026, 5, 7, 10, 0, tzinfo=UTC),
                is_blocked=False,
            )
        ]
        schedules = [
            _build_schedule(
                adviser_id=adviser_id,
                scheduled_at=datetime(2026, 5, 7, 9, 45, tzinfo=UTC),
            )
        ]
        guard = ScheduleSlotGuard(
            _FakeScheduleRepository(schedules),
            _FakeAvailabilityRepository(slots),
        )

        with self.assertRaises(ScheduleConflictError) as context:
            guard.ensure_slot_available(adviser_id=adviser_id, scheduled_at=requested_at)

        self.assertEqual(context.exception.conflict_reason, SLOT_UNAVAILABLE_REASON)

    def test_blocked_slot_raises_slot_blocked(self) -> None:
        adviser_id = uuid4()
        requested_at = datetime(2026, 5, 7, 9, 30, tzinfo=UTC)
        slots = [
            _build_slot(
                adviser_id=adviser_id,
                slot_start=datetime(2026, 5, 7, 9, 0, tzinfo=UTC),
                slot_end=datetime(2026, 5, 7, 10, 0, tzinfo=UTC),
                is_blocked=True,
            )
        ]
        guard = ScheduleSlotGuard(
            _FakeScheduleRepository([]),
            _FakeAvailabilityRepository(slots),
        )

        with self.assertRaises(ScheduleConflictError) as context:
            guard.ensure_slot_available(adviser_id=adviser_id, scheduled_at=requested_at)

        self.assertEqual(context.exception.conflict_reason, SLOT_BLOCKED_REASON)
