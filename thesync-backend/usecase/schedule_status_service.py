from __future__ import annotations

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
from repository.notification_repository import (
    NotificationRepository,
    get_notification_repository,
)
from repository.schedule_repository import ScheduleRepository, get_schedule_repository
from usecase.calendar_service import (
    CalendarService,
    CalendarServiceError,
    GoogleCalendarScheduleService,
)
from usecase.schedules import (
    ScheduleConflictError,
    ScheduleForbiddenError,
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
    """Business logic for adviser-driven schedule status transitions."""

    def __init__(
        self,
        schedule_repository: ScheduleRepository | None = None,
        notification_repository: NotificationRepository | None = None,
        audit_repository: AuditRepository | None = None,
        calendar_service: CalendarService | None = None,
    ) -> None:
        self._schedule_repository = schedule_repository or get_schedule_repository()
        self._notification_repository = notification_repository or get_notification_repository()
        self._audit_repository = audit_repository or get_audit_repository()
        self._calendar_service = calendar_service or GoogleCalendarScheduleService(
            self._schedule_repository
        )

    def _get_required_status_id(self, status_name: str) -> int:
        status_id = self._schedule_repository.get_status_id_by_name(status_name)
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
        schedule = self._schedule_repository.get_by_id(schedule_id)
        if schedule is None:
            raise ScheduleNotFoundError("Schedule was not found.")

        if schedule.adviser_id != current_user.id:
            raise ScheduleForbiddenError("Only the assigned adviser can update this schedule.")

        return schedule

    def _create_audit_log(
        self,
        *,
        schedule: Schedule,
        changed_by: UUID,
        previous_status_id: int | None,
        new_status_id: int,
        remarks: str | None = None,
    ) -> None:
        self._audit_repository.create(
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
        self._notification_repository.create(
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

        updated_schedule = self._schedule_repository.update_status(
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
            return self._calendar_service.sync(updated_schedule)
        except CalendarServiceError:
            return updated_schedule

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

        updated_schedule = self._schedule_repository.update_status(
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
        return updated_schedule

    def reschedule(
        self,
        current_user: AuthenticatedUser,
        schedule_id: UUID,
        payload: ScheduleRescheduleRequest,
    ) -> Schedule:
        schedule = self._get_schedule_for_adviser(
            current_user=current_user,
            schedule_id=schedule_id,
        )
        rejected_status_id = self._get_required_status_id(REJECTED_STATUS_NAME)
        completed_status_id = self._get_required_status_id(COMPLETED_STATUS_NAME)
        cancelled_status_id = self._get_required_status_id(CANCELLED_STATUS_NAME)
        approved_status_id = self._get_required_status_id(APPROVED_STATUS_NAME)
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

        has_conflict = self._schedule_repository.adviser_has_schedule_conflict(
            adviser_id=schedule.adviser_id,
            scheduled_at=normalized_new_time,
            excluded_schedule_id=schedule.id,
            status_ids=[approved_status_id, rescheduled_status_id],
        )
        if has_conflict:
            raise ScheduleConflictError("The adviser is already booked at the requested time.")

        updated_schedule = self._schedule_repository.update_status(
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
                f"Schedule moved from {_format_datetime(schedule.scheduled_at)} "
                f"to {_format_datetime(normalized_new_time)}."
            ),
        )
        self._create_notification(
            user_id=updated_schedule.student_id,
            schedule_id=updated_schedule.id,
            message=(
                f'Your schedule for "{updated_schedule.topic}" was moved to '
                f"{_format_datetime(updated_schedule.scheduled_at)}."
            ),
        )
        return updated_schedule
