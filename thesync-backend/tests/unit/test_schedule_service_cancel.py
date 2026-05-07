from __future__ import annotations

import unittest
from datetime import UTC, datetime
from typing import Literal
from uuid import UUID, uuid4

from model.auth import AuthenticatedUser
from model.schedule import Schedule
from model.user import User
from usecase.schedule_service import DefaultScheduleService
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
    topic: str = "CMSC 200A Proposal Defense",
) -> Schedule:
    return Schedule(
        id=uuid4(),
        student_id=student_id,
        adviser_id=adviser_id,
        type_id=1,
        status_id=status_id,
        topic=topic,
        requested_at=datetime(2026, 5, 6, 10, 0, tzinfo=UTC),
        scheduled_at=datetime(2026, 5, 10, 10, 30, tzinfo=UTC),
        created_at=datetime(2026, 5, 6, 10, 0, tzinfo=UTC),
    )


def _build_plain_user(
    *,
    user_id: UUID,
    role_name: str,
    full_name: str,
    email: str,
) -> User:
    return User(
        id=user_id,
        role_id=1,
        role_name=role_name,
        full_name=full_name,
        email=email,
        created_at=datetime(2026, 5, 6, 10, 0, tzinfo=UTC),
    )


class _FakeScheduleRepository:
    def __init__(self, schedules: list[Schedule]) -> None:
        self.schedules = {schedule.id: schedule for schedule in schedules}
        self.status_ids = {
            "pending": 1,
            "approved": 2,
            "rescheduled": 3,
            "cancelled": 4,
            "completed": 5,
        }
        self.type_names = {
            1: "consultation",
        }
        self.updated_statuses: list[tuple[UUID, int]] = []

    def get_by_id(self, schedule_id: UUID) -> Schedule | None:
        return self.schedules.get(schedule_id)

    def get_status_id_by_name(self, status_name: str) -> int | None:
        return self.status_ids.get(status_name)

    def get_type_name_by_id(self, type_id: int) -> str | None:
        return self.type_names.get(type_id)

    def update_status(
        self,
        schedule_id: UUID,
        status_id: int,
        scheduled_at: datetime | None = None,
    ) -> Schedule:
        schedule = self.schedules[schedule_id]
        updated = schedule.model_copy(update={"status_id": status_id})
        self.schedules[schedule_id] = updated
        self.updated_statuses.append((schedule_id, status_id))
        return updated


class _FakeNotificationRepository:
    def __init__(self) -> None:
        self.created_notifications: list[dict[str, object]] = []

    def create(self, user_id: UUID, schedule_id: UUID | None, message: str) -> None:
        self.created_notifications.append(
            {
                "user_id": user_id,
                "schedule_id": schedule_id,
                "message": message,
            }
        )


class _FakeAuditRepository:
    def __init__(self) -> None:
        self.created_logs: list[dict[str, object]] = []

    def create(
        self,
        *,
        schedule_id: UUID,
        changed_by: UUID,
        previous_status_id: int | None,
        new_status_id: int,
        remarks: str | None = None,
    ) -> None:
        self.created_logs.append(
            {
                "schedule_id": schedule_id,
                "changed_by": changed_by,
                "previous_status_id": previous_status_id,
                "new_status_id": new_status_id,
                "remarks": remarks,
            }
        )


class _FakeUserRepository:
    def __init__(self, users: list[User]) -> None:
        self.users = {user.id: user for user in users}

    def get_by_id(self, user_id: UUID | str) -> User | None:
        try:
            normalized_user_id = UUID(str(user_id))
        except ValueError:
            return None
        return self.users.get(normalized_user_id)


class _FakeEmailService:
    def send_schedule_cancelled(self, **kwargs) -> None:
        del kwargs


class ScheduleServiceCancelTests(unittest.TestCase):
    def test_owning_student_can_cancel_pending_schedule_and_notify_adviser(self) -> None:
        student = _build_user(role_name="student")
        adviser = _build_user(role_name="adviser")
        adviser_record = _build_plain_user(
            user_id=adviser.id,
            role_name="adviser",
            full_name=adviser.full_name,
            email=adviser.email,
        )
        schedule = _build_schedule(
            student_id=student.id,
            adviser_id=adviser.id,
            status_id=1,
        )
        schedule_repository = _FakeScheduleRepository([schedule])
        notification_repository = _FakeNotificationRepository()
        audit_repository = _FakeAuditRepository()
        service = DefaultScheduleService(
            schedule_repository=schedule_repository,
            user_repository=_FakeUserRepository([adviser_record]),
            notification_repository=notification_repository,
            audit_repository=audit_repository,
            email_service=_FakeEmailService(),
        )

        cancelled_schedule = service.cancel_schedule(student, schedule.id)

        self.assertEqual(cancelled_schedule.status_id, 4)
        self.assertEqual(schedule_repository.updated_statuses, [(schedule.id, 4)])
        self.assertEqual(len(audit_repository.created_logs), 1)
        self.assertEqual(audit_repository.created_logs[0]["new_status_id"], 4)
        self.assertEqual(audit_repository.created_logs[0]["previous_status_id"], 1)
        adviser_notifications = [
            notification
            for notification in notification_repository.created_notifications
            if notification["user_id"] == adviser.id
        ]
        self.assertEqual(len(adviser_notifications), 1)
        self.assertIn("cancelled", str(adviser_notifications[0]["message"]).lower())

    def test_assigned_adviser_can_cancel_approved_schedule(self) -> None:
        student = _build_user(role_name="student")
        adviser = _build_user(role_name="adviser")
        student_record = _build_plain_user(
            user_id=student.id,
            role_name="student",
            full_name=student.full_name,
            email=student.email,
        )
        schedule = _build_schedule(
            student_id=student.id,
            adviser_id=adviser.id,
            status_id=2,
        )
        schedule_repository = _FakeScheduleRepository([schedule])
        notification_repository = _FakeNotificationRepository()
        audit_repository = _FakeAuditRepository()
        service = DefaultScheduleService(
            schedule_repository=schedule_repository,
            user_repository=_FakeUserRepository([student_record]),
            notification_repository=notification_repository,
            audit_repository=audit_repository,
            email_service=_FakeEmailService(),
        )

        cancelled_schedule = service.cancel_schedule(adviser, schedule.id)

        self.assertEqual(cancelled_schedule.status_id, 4)
        self.assertEqual(schedule_repository.updated_statuses, [(schedule.id, 4)])
        self.assertEqual(len(audit_repository.created_logs), 1)
        self.assertEqual(
            audit_repository.created_logs[0]["remarks"],
            "Schedule cancelled by adviser.",
        )
        student_notifications = [
            notification
            for notification in notification_repository.created_notifications
            if notification["user_id"] == student.id
        ]
        self.assertEqual(len(student_notifications), 1)
        self.assertIn("cancelled by", str(student_notifications[0]["message"]).lower())

    def test_adviser_cannot_cancel_non_approved_schedule(self) -> None:
        student = _build_user(role_name="student")
        adviser = _build_user(role_name="adviser")
        schedule = _build_schedule(
            student_id=student.id,
            adviser_id=adviser.id,
            status_id=1,
        )
        schedule_repository = _FakeScheduleRepository([schedule])
        notification_repository = _FakeNotificationRepository()
        audit_repository = _FakeAuditRepository()
        service = DefaultScheduleService(
            schedule_repository=schedule_repository,
            notification_repository=notification_repository,
            audit_repository=audit_repository,
        )

        with self.assertRaises(ScheduleConflictError):
            service.cancel_schedule(adviser, schedule.id)

        self.assertEqual(schedule_repository.updated_statuses, [])
        self.assertEqual(notification_repository.created_notifications, [])
        self.assertEqual(audit_repository.created_logs, [])

    def test_assigned_adviser_can_cancel_rescheduled_schedule(self) -> None:
        student = _build_user(role_name="student")
        adviser = _build_user(role_name="adviser")
        student_record = _build_plain_user(
            user_id=student.id,
            role_name="student",
            full_name=student.full_name,
            email=student.email,
        )
        schedule = _build_schedule(
            student_id=student.id,
            adviser_id=adviser.id,
            status_id=3,
        )
        schedule_repository = _FakeScheduleRepository([schedule])
        notification_repository = _FakeNotificationRepository()
        audit_repository = _FakeAuditRepository()
        service = DefaultScheduleService(
            schedule_repository=schedule_repository,
            user_repository=_FakeUserRepository([student_record]),
            notification_repository=notification_repository,
            audit_repository=audit_repository,
            email_service=_FakeEmailService(),
        )

        cancelled_schedule = service.cancel_schedule(adviser, schedule.id)

        self.assertEqual(cancelled_schedule.status_id, 4)
        self.assertEqual(schedule_repository.updated_statuses, [(schedule.id, 4)])
        self.assertEqual(len(audit_repository.created_logs), 1)
        student_notifications = [
            notification
            for notification in notification_repository.created_notifications
            if notification["user_id"] == student.id
        ]
        self.assertEqual(len(student_notifications), 1)
        self.assertIn("cancelled by", str(student_notifications[0]["message"]).lower())

    def test_non_owning_student_cannot_cancel_schedule(self) -> None:
        owner = _build_user(role_name="student")
        other_student = _build_user(role_name="student")
        adviser = _build_user(role_name="adviser")
        schedule = _build_schedule(
            student_id=owner.id,
            adviser_id=adviser.id,
            status_id=1,
        )
        schedule_repository = _FakeScheduleRepository([schedule])
        notification_repository = _FakeNotificationRepository()
        audit_repository = _FakeAuditRepository()
        service = DefaultScheduleService(
            schedule_repository=schedule_repository,
            notification_repository=notification_repository,
            audit_repository=audit_repository,
        )

        with self.assertRaises(ScheduleForbiddenError):
            service.cancel_schedule(other_student, schedule.id)

        self.assertEqual(schedule_repository.updated_statuses, [])
        self.assertEqual(notification_repository.created_notifications, [])
        self.assertEqual(audit_repository.created_logs, [])

    def test_non_pending_schedule_cannot_be_cancelled(self) -> None:
        student = _build_user(role_name="student")
        adviser = _build_user(role_name="adviser")
        schedule = _build_schedule(
            student_id=student.id,
            adviser_id=adviser.id,
            status_id=2,
        )
        schedule_repository = _FakeScheduleRepository([schedule])
        notification_repository = _FakeNotificationRepository()
        audit_repository = _FakeAuditRepository()
        service = DefaultScheduleService(
            schedule_repository=schedule_repository,
            notification_repository=notification_repository,
            audit_repository=audit_repository,
        )

        with self.assertRaises(ScheduleConflictError):
            service.cancel_schedule(student, schedule.id)

        self.assertEqual(schedule_repository.updated_statuses, [])
        self.assertEqual(notification_repository.created_notifications, [])
        self.assertEqual(audit_repository.created_logs, [])


if __name__ == "__main__":
    unittest.main()
