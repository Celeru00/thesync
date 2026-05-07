from __future__ import annotations

import unittest
from datetime import UTC, datetime
from typing import Literal
from uuid import UUID, uuid4

from model.auth import AuthenticatedUser
from model.availability import AvailabilitySlot
from model.base import PaginatedResult
from model.schedule import (
    Schedule,
    ScheduleApproveRequest,
    ScheduleCreateRequest,
    ScheduleListItem,
    ScheduleRejectRequest,
    ScheduleRescheduleRequest,
)
from model.user import User
from usecase.schedule_service import DefaultScheduleService
from usecase.schedule_status_service import DefaultScheduleStatusService


def _build_user(
    *,
    role_name: Literal["student", "adviser", "admin"],
    user_id: UUID | None = None,
    full_name: str | None = None,
    email: str | None = None,
) -> AuthenticatedUser:
    resolved_full_name = full_name or f"{role_name.title()} User"
    return AuthenticatedUser(
        id=user_id or uuid4(),
        role_id=1,
        role_name=role_name,
        full_name=resolved_full_name,
        email=email or f"{role_name}@example.com",
        created_at=datetime(2026, 5, 6, 10, 0, tzinfo=UTC),
        app_role=role_name,
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


def _build_schedule(
    *,
    student_id: UUID,
    adviser_id: UUID,
    status_id: int = 1,
    scheduled_at: datetime | None = None,
    meet_link: str | None = None,
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
        meet_link=meet_link,
        created_at=datetime(2026, 5, 6, 10, 0, tzinfo=UTC),
    )


def _build_schedule_list_item(schedule: Schedule) -> ScheduleListItem:
    return ScheduleListItem(
        **schedule.model_dump(),
        student_full_name="Student User",
        adviser_full_name="Adviser User",
        type_name="defense",
        status_name="approved",
    )


class _FakeEmailService:
    def __init__(self) -> None:
        self.submitted_calls: list[dict[str, object]] = []
        self.approved_calls: list[dict[str, object]] = []
        self.rejected_calls: list[dict[str, object]] = []
        self.rescheduled_calls: list[dict[str, object]] = []
        self.cancelled_calls: list[dict[str, object]] = []

    def send_schedule_submitted(self, **kwargs) -> None:
        self.submitted_calls.append(kwargs)

    def send_schedule_approved(self, **kwargs) -> None:
        self.approved_calls.append(kwargs)

    def send_schedule_rejected(self, **kwargs) -> None:
        self.rejected_calls.append(kwargs)

    def send_schedule_rescheduled(self, **kwargs) -> None:
        self.rescheduled_calls.append(kwargs)

    def send_schedule_cancelled(self, **kwargs) -> None:
        self.cancelled_calls.append(kwargs)


class _FakeUserRepository:
    def __init__(self, users: list[User]) -> None:
        self.users = {user.id: user for user in users}

    def get_by_id(self, user_id: UUID | str) -> User | None:
        try:
            normalized_user_id = UUID(str(user_id))
        except ValueError:
            return None
        return self.users.get(normalized_user_id)


class _FakeAvailabilityRepository:
    def __init__(self, slots: list[AvailabilitySlot]) -> None:
        self._slots = slots

    def list_by_adviser(self, adviser_id: UUID | str) -> list[AvailabilitySlot]:
        adviser_id_as_str = str(adviser_id)
        return [slot for slot in self._slots if str(slot.adviser_id) == adviser_id_as_str]


class _CreateScheduleRepository:
    def __init__(self, created_schedule: Schedule) -> None:
        self.created_schedule = created_schedule

    def get_status_id_by_name(self, status_name: str) -> int | None:
        if status_name == "approved":
            return 2
        return None

    def list_by_adviser(
        self,
        adviser_id: UUID | str,
        filters,
    ) -> PaginatedResult[ScheduleListItem]:
        return PaginatedResult[ScheduleListItem](
            items=[],
            total=0,
            page=filters.page,
            page_size=filters.limit,
        )

    def adviser_has_schedule_conflict(self, **kwargs) -> bool:
        return False

    def get_type_name_by_id(self, type_id: int) -> str | None:
        if type_id == 1:
            return "defense"
        return None

    def create(
        self,
        student_id: UUID,
        adviser_id: UUID,
        type_id: int,
        topic: str,
        scheduled_at: datetime | None,
    ) -> Schedule:
        return self.created_schedule.model_copy(
            update={
                "student_id": student_id,
                "adviser_id": adviser_id,
                "type_id": type_id,
                "topic": topic,
                "scheduled_at": scheduled_at,
            }
        )


class _StatusScheduleRepository:
    def __init__(self, schedule: Schedule) -> None:
        self.schedule = schedule
        self.status_ids = {
            "pending": 1,
            "approved": 2,
            "rejected": 3,
            "rescheduled": 4,
            "completed": 5,
            "cancelled": 6,
        }

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
        self.schedule = self.schedule.model_copy(
            update={
                "status_id": status_id,
                "scheduled_at": scheduled_at or self.schedule.scheduled_at,
            }
        )
        return self.schedule

    def adviser_has_schedule_conflict(self, **kwargs) -> bool:
        return False

    def get_type_name_by_id(self, type_id: int) -> str | None:
        if type_id == 1:
            return "defense"
        return None


class _FakeNotificationRepository:
    def create(self, **kwargs) -> None:
        return None


class _FakeAuditRepository:
    def create(self, **kwargs) -> None:
        return None


class _FakeCalendarService:
    def __init__(self, meet_link: str) -> None:
        self.meet_link = meet_link

    def sync(self, schedule: Schedule) -> Schedule:
        return schedule.model_copy(update={"meet_link": self.meet_link})


class ScheduleEmailNotificationTests(unittest.TestCase):
    def test_create_schedule_sends_submitted_email_to_adviser(self) -> None:
        student = _build_user(role_name="student", full_name="Student User")
        adviser_id = uuid4()
        adviser = _build_plain_user(
            user_id=adviser_id,
            role_name="adviser",
            full_name="Adviser User",
            email="adviser@example.com",
        )
        created_schedule = _build_schedule(
            student_id=student.id,
            adviser_id=adviser_id,
        )
        availability_slot = AvailabilitySlot(
            id=uuid4(),
            adviser_id=adviser_id,
            slot_start=datetime(2026, 5, 10, 10, 0, tzinfo=UTC),
            slot_end=datetime(2026, 5, 10, 11, 0, tzinfo=UTC),
            is_blocked=False,
        )
        email_service = _FakeEmailService()
        service = DefaultScheduleService(
            schedule_repository=_CreateScheduleRepository(created_schedule),
            availability_repository=_FakeAvailabilityRepository([availability_slot]),
            user_repository=_FakeUserRepository([adviser]),
            notification_repository=_FakeNotificationRepository(),
            audit_repository=_FakeAuditRepository(),
            email_service=email_service,
        )

        service.create_schedule(
            student,
            ScheduleCreateRequest(
                adviser_id=adviser_id,
                type_id=1,
                topic="CMSC 200A Proposal Defense",
                scheduled_at=datetime(2026, 5, 10, 10, 30, tzinfo=UTC),
            ),
        )

        self.assertEqual(len(email_service.submitted_calls), 1)
        self.assertEqual(email_service.submitted_calls[0]["adviser_email"], "adviser@example.com")
        self.assertEqual(email_service.submitted_calls[0]["student_name"], "Student User")
        self.assertEqual(email_service.submitted_calls[0]["schedule_type"], "defense")

    def test_approve_schedule_sends_student_email_with_meet_link(self) -> None:
        student_id = uuid4()
        adviser = _build_user(role_name="adviser", full_name="Adviser User")
        schedule = _build_schedule(student_id=student_id, adviser_id=adviser.id, status_id=1)
        student = _build_plain_user(
            user_id=student_id,
            role_name="student",
            full_name="Student User",
            email="student@example.com",
        )
        email_service = _FakeEmailService()
        service = DefaultScheduleStatusService(
            schedule_repository=_StatusScheduleRepository(schedule),
            availability_repository=_FakeAvailabilityRepository([]),
            notification_repository=_FakeNotificationRepository(),
            audit_repository=_FakeAuditRepository(),
            calendar_service=_FakeCalendarService("https://meet.google.com/abc-defg-hij"),
            user_repository=_FakeUserRepository([student]),
            email_service=email_service,
        )

        service.approve_schedule(adviser, schedule.id, payload=ScheduleApproveRequest())

        self.assertEqual(len(email_service.approved_calls), 1)
        self.assertEqual(email_service.approved_calls[0]["student_email"], "student@example.com")
        self.assertEqual(
            email_service.approved_calls[0]["meet_link"],
            "https://meet.google.com/abc-defg-hij",
        )

    def test_reject_and_reschedule_send_expected_emails(self) -> None:
        student_id = uuid4()
        adviser = _build_user(role_name="adviser", full_name="Adviser User")
        student = _build_plain_user(
            user_id=student_id,
            role_name="student",
            full_name="Student User",
            email="student@example.com",
        )
        email_service = _FakeEmailService()

        reject_schedule = _build_schedule(student_id=student_id, adviser_id=adviser.id, status_id=1)
        reject_service = DefaultScheduleStatusService(
            schedule_repository=_StatusScheduleRepository(reject_schedule),
            availability_repository=_FakeAvailabilityRepository([]),
            notification_repository=_FakeNotificationRepository(),
            audit_repository=_FakeAuditRepository(),
            user_repository=_FakeUserRepository([student]),
            email_service=email_service,
        )

        reject_service.reject_schedule(
            adviser,
            reject_schedule.id,
            payload=ScheduleRejectRequest(remarks="Needs a clearer scope."),
        )

        self.assertEqual(len(email_service.rejected_calls), 1)
        self.assertEqual(
            email_service.rejected_calls[0]["remarks"],
            "Needs a clearer scope.",
        )

        student_reschedule_schedule = _build_schedule(
            student_id=student_id,
            adviser_id=adviser.id,
            status_id=2,
        )
        student_reschedule_service = DefaultScheduleStatusService(
            schedule_repository=_StatusScheduleRepository(student_reschedule_schedule),
            availability_repository=_FakeAvailabilityRepository([]),
            notification_repository=_FakeNotificationRepository(),
            audit_repository=_FakeAuditRepository(),
            user_repository=_FakeUserRepository(
                [
                    _build_plain_user(
                        user_id=adviser.id,
                        role_name="adviser",
                        full_name="Adviser User",
                        email="adviser@example.com",
                    )
                ]
            ),
            email_service=email_service,
        )
        student_actor = _build_user(
            role_name="student",
            user_id=student_id,
            full_name="Student User",
            email="student@example.com",
        )
        student_requested_time = datetime(2026, 5, 11, 9, 0, tzinfo=UTC)

        student_reschedule_service.reschedule(
            student_actor,
            student_reschedule_schedule.id,
            payload=ScheduleRescheduleRequest(
                scheduled_at=student_requested_time,
                remarks=None,
            ),
        )

        self.assertEqual(len(email_service.rescheduled_calls), 1)
        self.assertEqual(
            email_service.rescheduled_calls[0]["recipient_email"],
            "adviser@example.com",
        )
        self.assertEqual(email_service.rescheduled_calls[0]["rescheduled_by_student"], True)

        reschedule_schedule = _build_schedule(
            student_id=student_id, adviser_id=adviser.id, status_id=1
        )
        reschedule_service = DefaultScheduleStatusService(
            schedule_repository=_StatusScheduleRepository(reschedule_schedule),
            availability_repository=_FakeAvailabilityRepository([]),
            notification_repository=_FakeNotificationRepository(),
            audit_repository=_FakeAuditRepository(),
            user_repository=_FakeUserRepository([student]),
            email_service=email_service,
        )
        new_time = datetime(2026, 5, 12, 14, 0, tzinfo=UTC)

        reschedule_service.reschedule(
            adviser,
            reschedule_schedule.id,
            payload=ScheduleRescheduleRequest(scheduled_at=new_time, remarks=None),
        )

        self.assertEqual(len(email_service.rescheduled_calls), 2)
        self.assertEqual(email_service.rescheduled_calls[1]["scheduled_at"], new_time)
        self.assertEqual(
            email_service.rescheduled_calls[1]["recipient_email"],
            "student@example.com",
        )
        self.assertEqual(email_service.rescheduled_calls[1]["rescheduled_by_student"], False)

    def test_student_cancel_sends_cancelled_email_to_adviser(self) -> None:
        student = _build_user(role_name="student", full_name="Student User")
        adviser_id = uuid4()
        adviser = _build_plain_user(
            user_id=adviser_id,
            role_name="adviser",
            full_name="Adviser User",
            email="adviser@example.com",
        )
        schedule = _build_schedule(student_id=student.id, adviser_id=adviser_id, status_id=1)
        email_service = _FakeEmailService()
        service = DefaultScheduleService(
            schedule_repository=_StatusScheduleRepository(schedule),
            user_repository=_FakeUserRepository([adviser]),
            notification_repository=_FakeNotificationRepository(),
            audit_repository=_FakeAuditRepository(),
            email_service=email_service,
        )

        service.cancel_schedule(student, schedule.id)

        self.assertEqual(len(email_service.cancelled_calls), 1)
        self.assertEqual(email_service.cancelled_calls[0]["recipient_email"], "adviser@example.com")
        self.assertEqual(email_service.cancelled_calls[0]["cancelled_by_student"], True)
        self.assertEqual(email_service.cancelled_calls[0]["cancelled_by_name"], "Student User")

    def test_adviser_cancel_sends_cancelled_email_to_student(self) -> None:
        student_id = uuid4()
        adviser = _build_user(role_name="adviser", full_name="Adviser User")
        student = _build_plain_user(
            user_id=student_id,
            role_name="student",
            full_name="Student User",
            email="student@example.com",
        )
        schedule = _build_schedule(student_id=student_id, adviser_id=adviser.id, status_id=2)
        email_service = _FakeEmailService()
        service = DefaultScheduleService(
            schedule_repository=_StatusScheduleRepository(schedule),
            user_repository=_FakeUserRepository([student]),
            notification_repository=_FakeNotificationRepository(),
            audit_repository=_FakeAuditRepository(),
            email_service=email_service,
        )

        service.cancel_schedule(adviser, schedule.id)

        self.assertEqual(len(email_service.cancelled_calls), 1)
        self.assertEqual(email_service.cancelled_calls[0]["recipient_email"], "student@example.com")
        self.assertEqual(email_service.cancelled_calls[0]["cancelled_by_student"], False)
        self.assertEqual(email_service.cancelled_calls[0]["cancelled_by_name"], "Adviser User")


if __name__ == "__main__":
    unittest.main()
