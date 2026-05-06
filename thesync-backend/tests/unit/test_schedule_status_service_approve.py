from __future__ import annotations

import unittest
from datetime import UTC, datetime
from typing import Literal
from uuid import UUID, uuid4

from model.auth import AuthenticatedUser
from model.schedule import Schedule, ScheduleApproveRequest
from usecase.calendar_service import CalendarServiceError
from usecase.schedule_status_service import DefaultScheduleStatusService
from usecase.schedules import ScheduleIntegrationError


def _build_user(*, role_name: Literal["student", "adviser", "admin"]) -> AuthenticatedUser:
    return AuthenticatedUser(
        id=uuid4(),
        role_id=1,
        role_name=role_name,
        full_name=f"{role_name.title()} User",
        email=f"{role_name}@example.com",
        created_at=datetime(2026, 5, 6, 10, 0, tzinfo=UTC),
        app_role=role_name,
    )


def _build_schedule(
    *,
    student_id: UUID,
    adviser_id: UUID,
    status_id: int,
) -> Schedule:
    return Schedule(
        id=uuid4(),
        student_id=student_id,
        adviser_id=adviser_id,
        type_id=1,
        status_id=status_id,
        topic="CMSC 200A Proposal Defense",
        requested_at=datetime(2026, 5, 6, 10, 0, tzinfo=UTC),
        scheduled_at=datetime(2026, 5, 10, 10, 30, tzinfo=UTC),
        created_at=datetime(2026, 5, 6, 10, 0, tzinfo=UTC),
    )


class _FakeScheduleRepository:
    def __init__(self, schedule: Schedule) -> None:
        self.schedule = schedule
        self.status_ids = {
            "pending": 1,
            "approved": 2,
            "rescheduled": 3,
        }
        self.updated_statuses: list[tuple[UUID, int, datetime | None]] = []

    def get_by_id(self, schedule_id: UUID) -> Schedule | None:
        if schedule_id != self.schedule.id:
            return None
        return self.schedule

    def get_status_id_by_name(self, status_name: str) -> int | None:
        return self.status_ids.get(status_name)

    def update_status(
        self,
        schedule_id: UUID,
        status_id: int,
        scheduled_at: datetime | None = None,
    ) -> Schedule:
        self.updated_statuses.append((schedule_id, status_id, scheduled_at))
        self.schedule = self.schedule.model_copy(
            update={
                "status_id": status_id,
                "scheduled_at": scheduled_at or self.schedule.scheduled_at,
            }
        )
        return self.schedule


class _FakeNotificationRepository:
    def __init__(self) -> None:
        self.created: list[dict[str, object]] = []

    def create(self, user_id: UUID, schedule_id: UUID, message: str) -> None:
        self.created.append(
            {
                "user_id": user_id,
                "schedule_id": schedule_id,
                "message": message,
            }
        )


class _FakeAuditRepository:
    def __init__(self) -> None:
        self.created: list[dict[str, object]] = []

    def create(
        self,
        *,
        schedule_id: UUID,
        changed_by: UUID,
        previous_status_id: int | None,
        new_status_id: int,
        remarks: str | None = None,
    ) -> None:
        self.created.append(
            {
                "schedule_id": schedule_id,
                "changed_by": changed_by,
                "previous_status_id": previous_status_id,
                "new_status_id": new_status_id,
                "remarks": remarks,
            }
        )


class _FailingCalendarService:
    def sync(self, schedule: Schedule) -> Schedule:
        raise CalendarServiceError("Google Calendar API returned 500 for events")


class ScheduleStatusApproveTests(unittest.TestCase):
    def test_approve_raises_integration_error_when_calendar_sync_fails(self) -> None:
        student = _build_user(role_name="student")
        adviser = _build_user(role_name="adviser")
        schedule = _build_schedule(
            student_id=student.id,
            adviser_id=adviser.id,
            status_id=1,
        )
        schedule_repository = _FakeScheduleRepository(schedule)
        notification_repository = _FakeNotificationRepository()
        audit_repository = _FakeAuditRepository()
        service = DefaultScheduleStatusService(
            schedule_repository=schedule_repository,
            notification_repository=notification_repository,
            audit_repository=audit_repository,
            calendar_service=_FailingCalendarService(),
        )

        with self.assertRaises(ScheduleIntegrationError):
            service.approve_schedule(adviser, schedule.id, ScheduleApproveRequest())

        self.assertEqual(
            schedule_repository.updated_statuses,
            [(schedule.id, 2, schedule.scheduled_at)],
        )
        self.assertEqual(len(audit_repository.created), 1)
        self.assertEqual(audit_repository.created[0]["new_status_id"], 2)
        self.assertEqual(len(notification_repository.created), 2)


if __name__ == "__main__":
    unittest.main()
