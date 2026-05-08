from __future__ import annotations

import unittest
from datetime import date, datetime, time
from uuid import UUID, uuid4

from model.availability import AvailabilityRule
from repository.availability_repository import (
    SCHEDULE_TIMEZONE,
    AvailabilityRepository,
)


def _build_rule(
    *,
    adviser_id: UUID,
    day_of_week: int,
    start_time_value: time,
    end_time_value: time,
    is_blocked: bool = False,
) -> AvailabilityRule:
    return AvailabilityRule(
        id=uuid4(),
        adviser_id=adviser_id,
        day_of_week=day_of_week,
        start_time=start_time_value,
        end_time=end_time_value,
        is_blocked=is_blocked,
    )


def _local_interval(
    day_value: date,
    *,
    start_time_value: time,
    end_time_value: time,
) -> tuple[datetime, datetime]:
    return (
        datetime.combine(day_value, start_time_value, tzinfo=SCHEDULE_TIMEZONE),
        datetime.combine(day_value, end_time_value, tzinfo=SCHEDULE_TIMEZONE),
    )


def _local_slot_starts(slots) -> list[str]:
    return [slot.slot_start.astimezone(SCHEDULE_TIMEZONE).strftime("%H:%M") for slot in slots]


class _TestAvailabilityRepository(AvailabilityRepository):
    def __init__(
        self,
        *,
        rules: list[AvailabilityRule] | None = None,
        busy_schedule_intervals: list[tuple[datetime, datetime]] | None = None,
        google_calendar_intervals: list[tuple[datetime, datetime]] | None = None,
    ) -> None:
        self._rules = rules or []
        self._busy_schedule_intervals = busy_schedule_intervals or []
        self._google_calendar_intervals = google_calendar_intervals or []

    def list_by_adviser(self, adviser_id: UUID | str) -> list[AvailabilityRule]:
        return [rule for rule in self._rules if str(rule.adviser_id) == str(adviser_id)]

    def _list_busy_schedule_intervals(
        self,
        *,
        adviser_id: UUID | str,
        day_value: date,
        excluded_schedule_id: UUID | str | None = None,
    ) -> list[tuple[datetime, datetime]]:
        del adviser_id, day_value, excluded_schedule_id
        return list(self._busy_schedule_intervals)

    def _list_google_calendar_intervals(
        self,
        *,
        adviser_id: UUID | str,
        day_value: date,
    ) -> list[tuple[datetime, datetime]]:
        del adviser_id, day_value
        return list(self._google_calendar_intervals)


class AvailabilityRepositoryTests(unittest.TestCase):
    def test_get_free_slots_falls_back_to_default_weekday_windows(self) -> None:
        adviser_id = uuid4()
        monday = date(2026, 5, 11)
        repository = _TestAvailabilityRepository()

        slots = repository.get_free_slots(adviser_id, monday)

        self.assertEqual(len(slots), 17)
        self.assertEqual(_local_slot_starts(slots)[0], "08:00")
        self.assertEqual(_local_slot_starts(slots)[-1], "17:00")
        self.assertTrue(all(slot.source_rule_id is None for slot in slots))

    def test_get_free_slots_fallback_respects_google_calendar_conflicts(self) -> None:
        adviser_id = uuid4()
        monday = date(2026, 5, 11)
        repository = _TestAvailabilityRepository(
            google_calendar_intervals=[
                _local_interval(
                    monday,
                    start_time_value=time(9, 0),
                    end_time_value=time(10, 30),
                )
            ]
        )

        slots = repository.get_free_slots(adviser_id, monday)
        slot_starts = _local_slot_starts(slots)

        self.assertEqual(len(slots), 13)
        self.assertIn("08:00", slot_starts)
        self.assertIn("10:30", slot_starts)
        self.assertNotIn("08:30", slot_starts)
        self.assertNotIn("09:00", slot_starts)
        self.assertNotIn("09:30", slot_starts)
        self.assertNotIn("10:00", slot_starts)

    def test_get_free_slots_fallback_respects_blocked_rules(self) -> None:
        adviser_id = uuid4()
        monday = date(2026, 5, 11)
        repository = _TestAvailabilityRepository(
            rules=[
                _build_rule(
                    adviser_id=adviser_id,
                    day_of_week=0,
                    start_time_value=time(14, 0),
                    end_time_value=time(16, 0),
                    is_blocked=True,
                )
            ]
        )

        slots = repository.get_free_slots(adviser_id, monday)
        slot_starts = _local_slot_starts(slots)

        self.assertEqual(len(slots), 12)
        self.assertIn("13:00", slot_starts)
        self.assertIn("16:00", slot_starts)
        self.assertNotIn("13:30", slot_starts)
        self.assertNotIn("14:00", slot_starts)
        self.assertNotIn("14:30", slot_starts)
        self.assertNotIn("15:00", slot_starts)
        self.assertNotIn("15:30", slot_starts)


if __name__ == "__main__":
    unittest.main()
