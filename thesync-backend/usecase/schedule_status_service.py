from __future__ import annotations

import sys
from datetime import UTC, datetime
from typing import Final
from uuid import UUID

from model.auth import AuthenticatedUser
from model.schedule import (
    Schedule,
    ScheduleApproveRequest,
    ScheduleRejectRequest,
    ScheduleRescheduleRequest,
)
from repository.audit_repository import AuditRepository, get_audit_repository
from repository.availability_repository import (
    AvailabilityRepository,
    get_availability_repository,
)
from repository.notification_repository import (
    NotificationRepository,
    get_notification_repository,
)
from repository.schedule_repository import ScheduleRepository, get_schedule_repository
from repository.supabase_client import SupabaseClientConfigurationError
from repository.user_repository import UserRepository, get_user_repository
from usecase.calendar_service import (
    CalendarService,
    CalendarServiceError,
    GoogleCalendarScheduleService,
)
from usecase.email_service import EmailService, SendGridEmailService
from usecase.schedule_slot_guard import ScheduleSlotGuard
from usecase.schedules import (
    ScheduleConflictError,
    ScheduleForbiddenError,
    ScheduleIntegrationError,
    ScheduleNotFoundError,
    ScheduleServiceUnavailableError,
    ScheduleStatusService,
    ScheduleValidationError,
)

PENDING_STATUS_NAME: Final[str] = "pending"
APPROVED_STATUS_NAME: Final[str] = "approved"
REJECTED_STATUS_NAME: Final[str] = "rejected"
RESCHEDULED_STATUS_NAME: Final[str] = "rescheduled"
COMPLETED_STATUS_NAME: Final[str] = "completed"
CANCELLED_STATUS_NAME: Final[str] = "cancelled"


def _format_datetime(value: datetime | None) -> str:
    return value.isoformat() if value is not None else "unscheduled"


class DefaultScheduleStatusService(ScheduleStatusService):
    """Business logic for schedule status transitions."""

    def __init__(
        self,
        schedule_repository: ScheduleRepository | None = None,
        availability_repository: AvailabilityRepository | None = None,
        notification_repository: NotificationRepository | None = None,
        audit_repository: AuditRepository | None = None,
        calendar_service: CalendarService | None = None,
        user_repository: UserRepository | None = None,
        email_service: EmailService | None = None,
    ) -> None:
        self._schedule_repository = schedule_repository
        self._availability_repository = availability_repository
        self._notification_repository = notification_repository
        self._audit_repository = audit_repository
        self._calendar_service = calendar_service
        self._user_repository = user_repository
        self._email_service = email_service

    @property
    def schedule_repository(self) -> ScheduleRepository:
        if self._schedule_repository is None:
            try:
                self._schedule_repository = get_schedule_repository()
            except SupabaseClientConfigurationError as exc:
                raise ScheduleServiceUnavailableError(str(exc)) from exc

        return self._schedule_repository

    @property
    def notification_repository(self) -> NotificationRepository:
        if self._notification_repository is None:
            try:
                self._notification_repository = get_notification_repository()
            except SupabaseClientConfigurationError as exc:
                raise ScheduleServiceUnavailableError(str(exc)) from exc

        return self._notification_repository

    @property
    def availability_repository(self) -> AvailabilityRepository:
        if self._availability_repository is None:
            try:
                self._availability_repository = get_availability_repository()
            except SupabaseClientConfigurationError as exc:
                raise ScheduleServiceUnavailableError(str(exc)) from exc

        return self._availability_repository

    @property
    def audit_repository(self) -> AuditRepository:
        if self._audit_repository is None:
            try:
                self._audit_repository = get_audit_repository()
            except SupabaseClientConfigurationError as exc:
                raise ScheduleServiceUnavailableError(str(exc)) from exc

        return self._audit_repository

    @property
    def email_service(self) -> EmailService:
        if self._email_service is None:
            self._email_service = SendGridEmailService()

        return self._email_service

    def _load_recipient_email_context(
        self,
        user_id: UUID,
    ) -> tuple[str | None, str | None]:
        try:
            if self._user_repository is None:
                self._user_repository = get_user_repository()
            user = self._user_repository.get_by_id(user_id)
        except (SupabaseClientConfigurationError, Exception) as exc:  # pragma: no cover - log only
            print(
                f"[email-service] recipient_lookup_failed user_id={user_id!s} reason={str(exc)!r}",
                flush=True,
                file=sys.stderr,
            )
            return None, None

        if user is None:
            return None, None

        return str(user.email), user.full_name

    @property
    def calendar_service(self) -> CalendarService:
        if self._calendar_service is None:
            self._calendar_service = GoogleCalendarScheduleService(self.schedule_repository)

        return self._calendar_service

    @property
    def slot_guard(self) -> ScheduleSlotGuard:
        return ScheduleSlotGuard(self.schedule_repository, self.availability_repository)

    def _get_required_status_id(self, status_name: str) -> int:
        status_id = self.schedule_repository.get_status_id_by_name(status_name)
        if status_id is None:
            raise ScheduleServiceUnavailableError(
                f'Required schedule status "{status_name}" is missing.'
            )
        return status_id

    def _get_schedule_for_adviser(
        self,
        *,
        current_user: AuthenticatedUser,
        schedule_id: UUID,
    ) -> Schedule:
        schedule = self.schedule_repository.get_by_id(schedule_id)
        if schedule is None:
            raise ScheduleNotFoundError("Schedule was not found.")

        if schedule.adviser_id != current_user.id:
            raise ScheduleForbiddenError("Only the assigned adviser can update this schedule.")

        return schedule

    def _get_schedule_for_reschedule(
        self,
        *,
        current_user: AuthenticatedUser,
        schedule_id: UUID,
    ) -> Schedule:
        schedule = self.schedule_repository.get_by_id(schedule_id)
        if schedule is None:
            raise ScheduleNotFoundError("Schedule was not found.")

        if current_user.app_role == "adviser" and schedule.adviser_id == current_user.id:
            return schedule

        if current_user.app_role == "student" and schedule.student_id == current_user.id:
            return schedule

        raise ScheduleForbiddenError(
            "Only the owning student or assigned adviser can reschedule this schedule."
        )

    def _create_audit_log(
        self,
        *,
        schedule: Schedule,
        changed_by: UUID,
        previous_status_id: int | None,
        new_status_id: int,
        remarks: str | None = None,
    ) -> None:
        self.audit_repository.create(
            schedule_id=schedule.id,
            changed_by=changed_by,
            previous_status_id=previous_status_id,
            new_status_id=new_status_id,
            remarks=remarks,
        )

    def _create_notification(
        self,
        *,
        user_id: UUID,
        schedule_id: UUID,
        message: str,
    ) -> None:
        self.notification_repository.create(
            user_id=user_id,
            schedule_id=schedule_id,
            message=message,
        )

    def approve_schedule(
        self,
        current_user: AuthenticatedUser,
        schedule_id: UUID,
        payload: ScheduleApproveRequest,
    ) -> Schedule:
        schedule = self._get_schedule_for_adviser(
            current_user=current_user,
            schedule_id=schedule_id,
        )
        pending_status_id = self._get_required_status_id(PENDING_STATUS_NAME)
        approved_status_id = self._get_required_status_id(APPROVED_STATUS_NAME)
        rescheduled_status_id = self._get_required_status_id(RESCHEDULED_STATUS_NAME)

        if schedule.status_id == approved_status_id:
            raise ScheduleConflictError("Schedule is already approved.")

        if schedule.status_id not in {pending_status_id, rescheduled_status_id}:
            raise ScheduleConflictError("Only pending or rescheduled schedules can be approved.")

        effective_scheduled_at = payload.scheduled_at or schedule.scheduled_at
        if effective_scheduled_at is None:
            raise ScheduleValidationError(
                "A scheduled time is required before approving a schedule."
            )

        self.slot_guard.ensure_slot_available(
            adviser_id=schedule.adviser_id,
            scheduled_at=effective_scheduled_at,
            excluded_schedule_id=schedule.id,
        )

        updated_schedule = self.schedule_repository.update_status(
            schedule.id,
            approved_status_id,
            effective_scheduled_at,
        )
        self._create_audit_log(
            schedule=schedule,
            changed_by=current_user.id,
            previous_status_id=schedule.status_id,
            new_status_id=approved_status_id,
            remarks="Schedule approved by adviser.",
        )
        self._create_notification(
            user_id=updated_schedule.student_id,
            schedule_id=updated_schedule.id,
            message=(
                f'Your schedule for "{updated_schedule.topic}" was approved for '
                f"{_format_datetime(updated_schedule.scheduled_at)}."
            ),
        )
        self._create_notification(
            user_id=updated_schedule.adviser_id,
            schedule_id=updated_schedule.id,
            message=(
                f'You approved the schedule for "{updated_schedule.topic}" on '
                f"{_format_datetime(updated_schedule.scheduled_at)}."
            ),
        )

        try:
            synced_schedule = self.calendar_service.sync(updated_schedule)
        except CalendarServiceError as exc:
            raise ScheduleIntegrationError(str(exc)) from exc

        student_email, student_name = self._load_recipient_email_context(synced_schedule.student_id)
        self.email_service.send_schedule_approved(
            student_email=student_email,
            student_name=student_name,
            adviser_name=current_user.full_name,
            topic=synced_schedule.topic,
            scheduled_at=synced_schedule.scheduled_at,
            meet_link=synced_schedule.meet_link,
        )
        return synced_schedule

    def reject_schedule(
        self,
        current_user: AuthenticatedUser,
        schedule_id: UUID,
        payload: ScheduleRejectRequest,
    ) -> Schedule:
        schedule = self._get_schedule_for_adviser(
            current_user=current_user,
            schedule_id=schedule_id,
        )
        rejected_status_id = self._get_required_status_id(REJECTED_STATUS_NAME)
        completed_status_id = self._get_required_status_id(COMPLETED_STATUS_NAME)

        if schedule.status_id == rejected_status_id:
            raise ScheduleConflictError("Schedule is already rejected.")

        if schedule.status_id == completed_status_id:
            raise ScheduleConflictError("Completed schedules cannot be rejected.")

        updated_schedule = self.schedule_repository.update_status(
            schedule.id,
            rejected_status_id,
        )
        self._create_audit_log(
            schedule=schedule,
            changed_by=current_user.id,
            previous_status_id=schedule.status_id,
            new_status_id=rejected_status_id,
            remarks=payload.remarks,
        )
        message = f'Your schedule for "{updated_schedule.topic}" was rejected.'
        if payload.remarks:
            message = f"{message} Remarks: {payload.remarks}"
        self._create_notification(
            user_id=updated_schedule.student_id,
            schedule_id=updated_schedule.id,
            message=message,
        )
        student_email, student_name = self._load_recipient_email_context(
            updated_schedule.student_id
        )
        self.email_service.send_schedule_rejected(
            student_email=student_email,
            student_name=student_name,
            adviser_name=current_user.full_name,
            topic=updated_schedule.topic,
            remarks=payload.remarks,
        )
        return updated_schedule

    def reschedule(
        self,
        current_user: AuthenticatedUser,
        schedule_id: UUID,
        payload: ScheduleRescheduleRequest,
    ) -> Schedule:
        schedule = self._get_schedule_for_reschedule(
            current_user=current_user,
            schedule_id=schedule_id,
        )
        approved_status_id = self._get_required_status_id(APPROVED_STATUS_NAME)
        rejected_status_id = self._get_required_status_id(REJECTED_STATUS_NAME)
        completed_status_id = self._get_required_status_id(COMPLETED_STATUS_NAME)
        cancelled_status_id = self._get_required_status_id(CANCELLED_STATUS_NAME)
        rescheduled_status_id = self._get_required_status_id(RESCHEDULED_STATUS_NAME)

        normalized_new_time = (
            payload.scheduled_at.astimezone(UTC)
            if payload.scheduled_at.tzinfo
            else payload.scheduled_at.replace(tzinfo=UTC)
        )

        if normalized_new_time <= datetime.now(UTC):
            raise ScheduleValidationError("Rescheduled time must be in the future.")

        if schedule.status_id in {rejected_status_id, completed_status_id, cancelled_status_id}:
            raise ScheduleConflictError(
                "Rejected, completed, or cancelled schedules cannot be rescheduled."
            )

        if current_user.app_role == "student" and schedule.status_id != approved_status_id:
            raise ScheduleConflictError("Only approved schedules can be rescheduled by students.")

        self.slot_guard.ensure_slot_available(
            adviser_id=schedule.adviser_id,
            scheduled_at=normalized_new_time,
            excluded_schedule_id=schedule.id,
        )

        updated_schedule = self.schedule_repository.update_status(
            schedule.id,
            rescheduled_status_id,
            normalized_new_time,
        )
        self._create_audit_log(
            schedule=schedule,
            changed_by=current_user.id,
            previous_status_id=schedule.status_id,
            new_status_id=rescheduled_status_id,
            remarks=(
                (
                    "Student requested reschedule "
                    if current_user.app_role == "student"
                    else "Schedule moved "
                )
                + f"from {_format_datetime(schedule.scheduled_at)} "
                + f"to {_format_datetime(normalized_new_time)}."
            ),
        )
        if current_user.app_role == "student":
            self._create_notification(
                user_id=updated_schedule.student_id,
                schedule_id=updated_schedule.id,
                message=(
                    f'You requested to move "{updated_schedule.topic}" to '
                    f"{_format_datetime(updated_schedule.scheduled_at)}."
                ),
            )
            self._create_notification(
                user_id=updated_schedule.adviser_id,
                schedule_id=updated_schedule.id,
                message=(
                    f'{current_user.full_name} requested to move "{updated_schedule.topic}" to '
                    f"{_format_datetime(updated_schedule.scheduled_at)}."
                ),
            )
            adviser_email, adviser_name = self._load_recipient_email_context(
                updated_schedule.adviser_id
            )
            self.email_service.send_schedule_rescheduled(
                recipient_email=adviser_email,
                recipient_name=adviser_name,
                rescheduled_by_student=True,
                student_name=current_user.full_name,
                adviser_name=adviser_name,
                topic=updated_schedule.topic,
                scheduled_at=updated_schedule.scheduled_at,
                rescheduled_by_name=current_user.full_name,
            )
        else:
            self._create_notification(
                user_id=updated_schedule.student_id,
                schedule_id=updated_schedule.id,
                message=(
                    f'Your schedule for "{updated_schedule.topic}" was moved to '
                    f"{_format_datetime(updated_schedule.scheduled_at)}."
                ),
            )
            student_email, student_name = self._load_recipient_email_context(
                updated_schedule.student_id
            )
            self.email_service.send_schedule_rescheduled(
                recipient_email=student_email,
                recipient_name=student_name,
                rescheduled_by_student=False,
                student_name=student_name,
                adviser_name=current_user.full_name,
                topic=updated_schedule.topic,
                scheduled_at=updated_schedule.scheduled_at,
                rescheduled_by_name=current_user.full_name,
            )
        return updated_schedule
