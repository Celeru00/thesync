from __future__ import annotations

import unittest
from datetime import UTC, datetime
from typing import Literal
from uuid import UUID, uuid4

from model.auth import AuthenticatedUser
from model.schedule import Schedule, ScheduleRescheduleRequest
from usecase.schedule_status_service import DefaultScheduleStatusService
from usecase.schedules import ScheduleConflictError, ScheduleForbiddenError


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
    scheduled_at: datetime | None = None,
) -> Schedule:
    return Schedule(
        id=uuid4(),
        student_id=student_id,
        adviser_id=adviser_id,
        type_id=1,
        status_id=status_id,
        topic="CMSC 200A Proposal Defense",
        requested_at=datetime(2026, 5, 6, 10, 0, tzinfo=UTC),
        scheduled_at=scheduled_at or datetime(2026, 5, 10, 10, 30, tzinfo=UTC),
        created_at=datetime(2026, 5, 6, 10, 0, tzinfo=UTC),
    )


class _FakeScheduleRepository:
    def __init__(self, schedule: Schedule) -> None:
        self.schedule = schedule
        self.status_ids = {
            "approved": 2,
            "rejected": 3,
            "completed": 4,
            "cancelled": 5,
            "rescheduled": 6,
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

    def adviser_has_schedule_conflict(
        self,
        *,
        adviser_id: UUID | str,
        scheduled_at: datetime,
        excluded_schedule_id: UUID | str | None = None,
        status_ids: list[int] | None = None,
    ) -> bool:
        del adviser_id, scheduled_at, excluded_schedule_id, status_ids
        return False


class _FakeAvailabilityRepository:
    def list_by_adviser(self, adviser_id: UUID | str) -> list[object]:
        return []


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


class ScheduleStatusRescheduleTests(unittest.TestCase):
    def test_student_can_reschedule_approved_schedule(self) -> None:
        student = _build_user(role_name="student")
        adviser = _build_user(role_name="adviser")
        schedule = _build_schedule(
            student_id=student.id,
            adviser_id=adviser.id,
            status_id=2,
        )
        schedule_repository = _FakeScheduleRepository(schedule)
        notification_repository = _FakeNotificationRepository()
        audit_repository = _FakeAuditRepository()
        service = DefaultScheduleStatusService(
            schedule_repository=schedule_repository,
            availability_repository=_FakeAvailabilityRepository(),
            notification_repository=notification_repository,
            audit_repository=audit_repository,
        )
        new_time = datetime(2026, 5, 12, 14, 0, tzinfo=UTC)

        updated_schedule = service.reschedule(
            student,
            schedule.id,
            payload=ScheduleRescheduleRequest(scheduled_at=new_time, remarks=None),
        )

        self.assertEqual(updated_schedule.status_id, 6)
        self.assertEqual(updated_schedule.scheduled_at, new_time)
        self.assertEqual(
            schedule_repository.updated_statuses,
            [(schedule.id, 6, new_time)],
        )
        self.assertEqual(len(audit_repository.created), 1)
        self.assertIn(
            "student requested reschedule",
            str(audit_repository.created[0]["remarks"]).lower(),
        )
        adviser_notifications = [
            notification
            for notification in notification_repository.created
            if notification["user_id"] == adviser.id
        ]
        self.assertEqual(len(adviser_notifications), 1)
        self.assertIn("requested to move", str(adviser_notifications[0]["message"]).lower())

    def test_student_cannot_reschedule_non_approved_schedule(self) -> None:
        student = _build_user(role_name="student")
        adviser = _build_user(role_name="adviser")
        schedule = _build_schedule(
            student_id=student.id,
            adviser_id=adviser.id,
            status_id=6,
        )
        service = DefaultScheduleStatusService(
            schedule_repository=_FakeScheduleRepository(schedule),
            availability_repository=_FakeAvailabilityRepository(),
            notification_repository=_FakeNotificationRepository(),
            audit_repository=_FakeAuditRepository(),
        )
        new_time = datetime(2026, 5, 12, 14, 0, tzinfo=UTC)

        with self.assertRaises(ScheduleConflictError):
            service.reschedule(
                student,
                schedule.id,
                payload=ScheduleRescheduleRequest(scheduled_at=new_time, remarks=None),
            )

    def test_non_owner_student_cannot_reschedule_schedule(self) -> None:
        owner = _build_user(role_name="student")
        other_student = _build_user(role_name="student")
        adviser = _build_user(role_name="adviser")
        schedule = _build_schedule(
            student_id=owner.id,
            adviser_id=adviser.id,
            status_id=2,
        )
        service = DefaultScheduleStatusService(
            schedule_repository=_FakeScheduleRepository(schedule),
            availability_repository=_FakeAvailabilityRepository(),
            notification_repository=_FakeNotificationRepository(),
            audit_repository=_FakeAuditRepository(),
        )
        new_time = datetime(2026, 5, 12, 14, 0, tzinfo=UTC)

        with self.assertRaises(ScheduleForbiddenError):
            service.reschedule(
                other_student,
                schedule.id,
                payload=ScheduleRescheduleRequest(scheduled_at=new_time, remarks=None),
            )


if __name__ == "__main__":
    unittest.main()
