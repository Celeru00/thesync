from __future__ import annotations

import unittest
from datetime import UTC, date, datetime, time
from uuid import UUID, uuid4

from model.availability import AvailabilityRule, AvailabilitySlot
from usecase.schedule_slot_guard import (
    SLOT_BLOCKED_REASON,
    SLOT_UNAVAILABLE_REASON,
    ScheduleSlotGuard,
)
from usecase.schedules import ScheduleConflictError


class _FakeAvailabilityRepository:
    def __init__(
        self,
        *,
        rules: list[AvailabilityRule],
        free_slots: list[AvailabilitySlot],
    ) -> None:
        self._rules = rules
        self._free_slots = free_slots

    def list_by_adviser(self, adviser_id: UUID | str) -> list[AvailabilityRule]:
        adviser_id_as_str = str(adviser_id)
        return [rule for rule in self._rules if str(rule.adviser_id) == adviser_id_as_str]

    def get_free_slots(
        self,
        adviser_id: UUID | str,
        day: date | datetime | None = None,
        *,
        excluded_schedule_id: UUID | str | None = None,
    ) -> list[AvailabilitySlot]:
        del excluded_schedule_id
        adviser_id_as_str = str(adviser_id)
        if day is None:
            return [slot for slot in self._free_slots if str(slot.adviser_id) == adviser_id_as_str]

        target_day = day if isinstance(day, date) and not isinstance(day, datetime) else day.date()
        return [
            slot
            for slot in self._free_slots
            if str(slot.adviser_id) == adviser_id_as_str
            and slot.slot_start.astimezone(UTC).date() == target_day
        ]


class _UnusedScheduleRepository:
    pass


def _build_rule(
    *,
    adviser_id: UUID,
    day_of_week: int,
    start_time_value: time,
    end_time_value: time,
    is_blocked: bool,
) -> AvailabilityRule:
    return AvailabilityRule(
        id=uuid4(),
        adviser_id=adviser_id,
        day_of_week=day_of_week,
        start_time=start_time_value,
        end_time=end_time_value,
        is_blocked=is_blocked,
    )


def _build_free_slot(
    *,
    adviser_id: UUID,
    slot_start: datetime,
    slot_end: datetime,
) -> AvailabilitySlot:
    return AvailabilitySlot(
        id=f"{uuid4()}:{slot_start.isoformat()}",
        adviser_id=adviser_id,
        slot_start=slot_start,
        slot_end=slot_end,
        is_blocked=False,
        source_rule_id=uuid4(),
    )


class ScheduleSlotGuardTests(unittest.TestCase):
    def test_generated_bookable_slot_allows_booking(self) -> None:
        adviser_id = uuid4()
        requested_at = datetime(2026, 5, 11, 1, 0, tzinfo=UTC)
        guard = ScheduleSlotGuard(
            _UnusedScheduleRepository(),
            _FakeAvailabilityRepository(
                rules=[
                    _build_rule(
                        adviser_id=adviser_id,
                        day_of_week=0,
                        start_time_value=time(9, 0),
                        end_time_value=time(10, 0),
                        is_blocked=False,
                    )
                ],
                free_slots=[
                    _build_free_slot(
                        adviser_id=adviser_id,
                        slot_start=requested_at,
                        slot_end=datetime(2026, 5, 11, 2, 0, tzinfo=UTC),
                    )
                ],
            ),
        )

        guard.ensure_slot_available(adviser_id=adviser_id, scheduled_at=requested_at)

    def test_requested_time_that_no_longer_fits_window_is_unavailable(self) -> None:
        adviser_id = uuid4()
        requested_at = datetime(2026, 5, 11, 1, 30, tzinfo=UTC)
        guard = ScheduleSlotGuard(
            _UnusedScheduleRepository(),
            _FakeAvailabilityRepository(
                rules=[
                    _build_rule(
                        adviser_id=adviser_id,
                        day_of_week=0,
                        start_time_value=time(9, 0),
                        end_time_value=time(10, 0),
                        is_blocked=False,
                    )
                ],
                free_slots=[],
            ),
        )

        with self.assertRaises(ScheduleConflictError) as context:
            guard.ensure_slot_available(adviser_id=adviser_id, scheduled_at=requested_at)

        self.assertEqual(context.exception.conflict_reason, SLOT_UNAVAILABLE_REASON)

    def test_busy_free_slot_gap_raises_slot_unavailable(self) -> None:
        adviser_id = uuid4()
        requested_at = datetime(2026, 5, 11, 1, 0, tzinfo=UTC)
        guard = ScheduleSlotGuard(
            _UnusedScheduleRepository(),
            _FakeAvailabilityRepository(
                rules=[
                    _build_rule(
                        adviser_id=adviser_id,
                        day_of_week=0,
                        start_time_value=time(9, 0),
                        end_time_value=time(10, 0),
                        is_blocked=False,
                    )
                ],
                free_slots=[],
            ),
        )

        with self.assertRaises(ScheduleConflictError) as context:
            guard.ensure_slot_available(adviser_id=adviser_id, scheduled_at=requested_at)

        self.assertEqual(context.exception.conflict_reason, SLOT_UNAVAILABLE_REASON)

    def test_blocked_rule_raises_slot_blocked(self) -> None:
        adviser_id = uuid4()
        requested_at = datetime(2026, 5, 11, 1, 0, tzinfo=UTC)
        guard = ScheduleSlotGuard(
            _UnusedScheduleRepository(),
            _FakeAvailabilityRepository(
                rules=[
                    _build_rule(
                        adviser_id=adviser_id,
                        day_of_week=0,
                        start_time_value=time(9, 0),
                        end_time_value=time(10, 0),
                        is_blocked=True,
                    )
                ],
                free_slots=[],
            ),
        )

        with self.assertRaises(ScheduleConflictError) as context:
            guard.ensure_slot_available(adviser_id=adviser_id, scheduled_at=requested_at)

        self.assertEqual(context.exception.conflict_reason, SLOT_BLOCKED_REASON)
