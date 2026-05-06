from __future__ import annotations

from datetime import UTC, datetime
from typing import Final
from uuid import UUID

from model.auth import AuthenticatedUser
from model.base import PaginatedResult
from model.schedule import Schedule, ScheduleCreateRequest, ScheduleListFilters
from model.user import User
from repository.audit_repository import AuditRepository, get_audit_repository
from repository.notification_repository import (
    NotificationRepository,
    get_notification_repository,
)
from repository.schedule_repository import (
    ScheduleRepository,
    ScheduleRepositoryNotFoundError,
    get_schedule_repository,
)
from repository.supabase_client import SupabaseClientConfigurationError
from repository.user_repository import UserRepository, get_user_repository
from usecase.schedules import (
    ScheduleConflictError,
    ScheduleForbiddenError,
    ScheduleNotFoundError,
    ScheduleService,
    ScheduleServiceUnavailableError,
    ScheduleValidationError,
)

STUDENT_ROLE_NAME: Final[str] = "student"
ADVISER_ROLE_NAME: Final[str] = "adviser"
ADMIN_ROLE_NAME: Final[str] = "admin"
PENDING_STATUS_NAME: Final[str] = "pending"
APPROVED_STATUS_NAME: Final[str] = "approved"
RESCHEDULED_STATUS_NAME: Final[str] = "rescheduled"
CANCELLED_STATUS_NAME: Final[str] = "cancelled"


def _format_datetime(value: datetime | None) -> str:
    return value.isoformat() if value is not None else "without a confirmed time"


def _normalize_datetime(value: datetime | None) -> datetime | None:
    if value is None:
        return None

    if value.tzinfo is None:
        return value.replace(tzinfo=UTC)

    return value.astimezone(UTC)


class DefaultScheduleService(ScheduleService):
    """Business logic for creating, listing, reading, and cancelling schedules."""

    def __init__(
        self,
        schedule_repository: ScheduleRepository | None = None,
        user_repository: UserRepository | None = None,
        notification_repository: NotificationRepository | None = None,
        audit_repository: AuditRepository | None = None,
    ) -> None:
        self._schedule_repository = schedule_repository
        self._user_repository = user_repository
        self._notification_repository = notification_repository
        self._audit_repository = audit_repository

    @property
    def schedule_repository(self) -> ScheduleRepository:
        if self._schedule_repository is None:
            try:
                self._schedule_repository = get_schedule_repository()
            except SupabaseClientConfigurationError as exc:
                raise ScheduleServiceUnavailableError(str(exc)) from exc

        return self._schedule_repository

    @property
    def user_repository(self) -> UserRepository:
        if self._user_repository is None:
            try:
                self._user_repository = get_user_repository()
            except SupabaseClientConfigurationError as exc:
                raise ScheduleServiceUnavailableError(str(exc)) from exc

        return self._user_repository

    @property
    def notification_repository(self) -> NotificationRepository:
        if self._notification_repository is None:
            try:
                self._notification_repository = get_notification_repository()
            except SupabaseClientConfigurationError as exc:
                raise ScheduleServiceUnavailableError(str(exc)) from exc

        return self._notification_repository

    @property
    def audit_repository(self) -> AuditRepository:
        if self._audit_repository is None:
            try:
                self._audit_repository = get_audit_repository()
            except SupabaseClientConfigurationError as exc:
                raise ScheduleServiceUnavailableError(str(exc)) from exc

        return self._audit_repository

    def _require_student(self, current_user: AuthenticatedUser) -> None:
        if current_user.app_role != STUDENT_ROLE_NAME:
            raise ScheduleForbiddenError("Only students can perform this schedule action.")

    def _get_required_status_id(self, status_name: str) -> int:
        status_id = self.schedule_repository.get_status_id_by_name(status_name)
        if status_id is None:
            raise ScheduleServiceUnavailableError(
                f'Required schedule status "{status_name}" is missing.'
            )
        return status_id

    def _get_adviser_or_raise(self, adviser_id: UUID) -> User:
        adviser = self.user_repository.get_by_id(adviser_id)
        if adviser is None:
            raise ScheduleNotFoundError("Adviser was not found.")

        if adviser.role_name is None or adviser.role_name.lower() != ADVISER_ROLE_NAME:
            raise ScheduleValidationError("Selected user is not an adviser.")

        return adviser

    def _get_schedule_or_raise(self, schedule_id: UUID) -> Schedule:
        schedule = self.schedule_repository.get_by_id(schedule_id)
        if schedule is None:
            raise ScheduleNotFoundError("Schedule was not found.")

        return schedule

    def _get_accessible_schedule(
        self,
        *,
        schedule_id: UUID,
        current_user: AuthenticatedUser,
    ) -> Schedule:
        schedule = self._get_schedule_or_raise(schedule_id)

        if current_user.app_role == ADMIN_ROLE_NAME:
            return schedule

        if current_user.app_role == STUDENT_ROLE_NAME and schedule.student_id == current_user.id:
            return schedule

        if current_user.app_role == ADVISER_ROLE_NAME and schedule.adviser_id == current_user.id:
            return schedule

        raise ScheduleForbiddenError("You do not have access to this schedule.")

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

    def _create_audit_log(
        self,
        *,
        schedule_id: UUID,
        changed_by: UUID,
        previous_status_id: int | None,
        new_status_id: int,
        remarks: str | None,
    ) -> None:
        self.audit_repository.create(
            schedule_id=schedule_id,
            changed_by=changed_by,
            previous_status_id=previous_status_id,
            new_status_id=new_status_id,
            remarks=remarks,
        )

    def _raise_if_adviser_double_booked(
        self,
        *,
        adviser_id: UUID,
        scheduled_at: datetime | None,
    ) -> None:
        normalized_scheduled_at = _normalize_datetime(scheduled_at)
        if normalized_scheduled_at is None:
            return

        approved_status_id = self._get_required_status_id(APPROVED_STATUS_NAME)
        rescheduled_status_id = self._get_required_status_id(RESCHEDULED_STATUS_NAME)
        has_conflict = self.schedule_repository.adviser_has_schedule_conflict(
            adviser_id=adviser_id,
            scheduled_at=normalized_scheduled_at,
            status_ids=[approved_status_id, rescheduled_status_id],
        )
        if has_conflict:
            raise ScheduleConflictError("The adviser is already booked at the requested time.")

    def create_schedule(
        self,
        current_user: AuthenticatedUser,
        payload: ScheduleCreateRequest,
    ) -> Schedule:
        self._require_student(current_user)
        adviser = self._get_adviser_or_raise(payload.adviser_id)
        normalized_scheduled_at = _normalize_datetime(payload.scheduled_at)

        self._raise_if_adviser_double_booked(
            adviser_id=adviser.id,
            scheduled_at=normalized_scheduled_at,
        )

        try:
            schedule = self.schedule_repository.create(
                student_id=current_user.id,
                adviser_id=adviser.id,
                type_id=payload.type_id,
                topic=payload.topic,
                scheduled_at=normalized_scheduled_at,
            )
        except ScheduleRepositoryNotFoundError as exc:
            raise ScheduleServiceUnavailableError(str(exc)) from exc

        self._create_notification(
            user_id=schedule.student_id,
            schedule_id=schedule.id,
            message=(
                f'Your schedule request for "{schedule.topic}" was submitted '
                f"{_format_datetime(schedule.scheduled_at)}."
            ),
        )
        self._create_notification(
            user_id=schedule.adviser_id,
            schedule_id=schedule.id,
            message=(
                f'{current_user.full_name} requested a schedule for "{schedule.topic}" '
                f"{_format_datetime(schedule.scheduled_at)}."
            ),
        )
        return schedule

    def list_schedules(
        self,
        current_user: AuthenticatedUser,
        filters: ScheduleListFilters,
    ) -> PaginatedResult[Schedule]:
        if current_user.app_role == STUDENT_ROLE_NAME:
            return self.schedule_repository.list_by_student(current_user.id, filters)

        if current_user.app_role == ADVISER_ROLE_NAME:
            return self.schedule_repository.list_by_adviser(current_user.id, filters)

        if current_user.app_role == ADMIN_ROLE_NAME:
            return self.schedule_repository.list_all(filters)

        raise ScheduleForbiddenError("You do not have permission to list schedules.")

    def get_schedule(
        self,
        current_user: AuthenticatedUser,
        schedule_id: UUID,
    ) -> Schedule:
        return self._get_accessible_schedule(
            schedule_id=schedule_id,
            current_user=current_user,
        )

    def cancel_schedule(
        self,
        current_user: AuthenticatedUser,
        schedule_id: UUID,
    ) -> Schedule:
        self._require_student(current_user)
        schedule = self._get_schedule_or_raise(schedule_id)

        if schedule.student_id != current_user.id:
            raise ScheduleForbiddenError("Only the owning student can cancel this schedule.")

        pending_status_id = self._get_required_status_id(PENDING_STATUS_NAME)
        cancelled_status_id = self._get_required_status_id(CANCELLED_STATUS_NAME)

        if schedule.status_id == cancelled_status_id:
            raise ScheduleConflictError("Schedule is already cancelled.")

        if schedule.status_id != pending_status_id:
            raise ScheduleConflictError("Only pending schedules can be cancelled.")

        try:
            updated_schedule = self.schedule_repository.update_status(
                schedule.id,
                cancelled_status_id,
            )
        except ScheduleRepositoryNotFoundError as exc:
            raise ScheduleNotFoundError(str(exc)) from exc

        self._create_audit_log(
            schedule_id=updated_schedule.id,
            changed_by=current_user.id,
            previous_status_id=schedule.status_id,
            new_status_id=cancelled_status_id,
            remarks="Schedule cancelled by student.",
        )
        self._create_notification(
            user_id=updated_schedule.student_id,
            schedule_id=updated_schedule.id,
            message=f'You cancelled your schedule request for "{updated_schedule.topic}".',
        )
        self._create_notification(
            user_id=updated_schedule.adviser_id,
            schedule_id=updated_schedule.id,
            message=(
                f"{current_user.full_name} cancelled the schedule request for "
                f'"{updated_schedule.topic}".'
            ),
        )
        return updated_schedule
