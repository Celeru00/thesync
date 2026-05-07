from __future__ import annotations

from datetime import UTC, datetime
from typing import Final
from uuid import UUID

from model.auth import AuthenticatedUser
from model.schedule import (
    Schedule,
    ScheduleCreateRequest,
    ScheduleListFilters,
    ScheduleListResponse,
)
from model.user import User
from repository.audit_repository import AuditRepository, get_audit_repository
from repository.availability_repository import (
    AvailabilityRepository,
    get_availability_repository,
)
from repository.notification_repository import (
    NotificationRepository,
    get_notification_repository,
)
from repository.panelist_repository import PanelistRepository, get_panelist_repository
from repository.schedule_repository import (
    ScheduleRepository,
    ScheduleRepositoryNotFoundError,
    get_schedule_repository,
)
from repository.supabase_client import SupabaseClientConfigurationError
from repository.user_repository import UserRepository, get_user_repository
from usecase.email_service import EmailService, SendGridEmailService
from usecase.schedule_slot_guard import ScheduleSlotGuard
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
        availability_repository: AvailabilityRepository | None = None,
        panelist_repository: PanelistRepository | None = None,
        user_repository: UserRepository | None = None,
        notification_repository: NotificationRepository | None = None,
        audit_repository: AuditRepository | None = None,
        email_service: EmailService | None = None,
    ) -> None:
        self._schedule_repository = schedule_repository
        self._availability_repository = availability_repository
        self._panelist_repository = panelist_repository
        self._user_repository = user_repository
        self._notification_repository = notification_repository
        self._audit_repository = audit_repository
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
    def user_repository(self) -> UserRepository:
        if self._user_repository is None:
            try:
                self._user_repository = get_user_repository()
            except SupabaseClientConfigurationError as exc:
                raise ScheduleServiceUnavailableError(str(exc)) from exc

        return self._user_repository

    @property
    def availability_repository(self) -> AvailabilityRepository:
        if self._availability_repository is None:
            try:
                self._availability_repository = get_availability_repository()
            except SupabaseClientConfigurationError as exc:
                raise ScheduleServiceUnavailableError(str(exc)) from exc

        return self._availability_repository

    @property
    def panelist_repository(self) -> PanelistRepository:
        if self._panelist_repository is None:
            try:
                self._panelist_repository = get_panelist_repository()
            except SupabaseClientConfigurationError as exc:
                raise ScheduleServiceUnavailableError(str(exc)) from exc

        return self._panelist_repository

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

    @property
    def email_service(self) -> EmailService:
        if self._email_service is None:
            self._email_service = SendGridEmailService()

        return self._email_service

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
            raise ScheduleNotFoundError("Adviser was not found.")

        return adviser

    def _get_user_or_raise(self, user_id: UUID, *, label: str) -> User:
        user = self.user_repository.get_by_id(user_id)
        if user is None:
            raise ScheduleServiceUnavailableError(
                f"{label} could not be resolved for email delivery."
            )

        return user

    def _ensure_schedule_type_exists(self, type_id: int) -> str:
        schedule_type_name = self.schedule_repository.get_type_name_by_id(type_id)
        if schedule_type_name is None:
            raise ScheduleValidationError("Selected schedule type is invalid.")

        return schedule_type_name

    def _resolve_lookup_filter_id(
        self,
        *,
        raw_value: str | None,
        filter_name: str,
        lookup_id_resolver,
        lookup_name_resolver,
    ) -> int | None:
        if raw_value is None:
            return None

        normalized_value = raw_value.strip().lower()
        if normalized_value.isdigit():
            resolved_id = int(normalized_value)
            if resolved_id <= 0 or lookup_name_resolver(resolved_id) is None:
                raise ScheduleValidationError(f"Selected {filter_name} filter is invalid.")
            return resolved_id

        resolved_id = lookup_id_resolver(normalized_value)
        if resolved_id is None:
            raise ScheduleValidationError(f"Selected {filter_name} filter is invalid.")

        return resolved_id

    def _resolve_list_filters(self, filters: ScheduleListFilters) -> ScheduleListFilters:
        resolved_status_id = self._resolve_lookup_filter_id(
            raw_value=filters.status_name,
            filter_name="status",
            lookup_id_resolver=self.schedule_repository.get_status_id_by_name,
            lookup_name_resolver=self.schedule_repository.get_status_name_by_id,
        )
        resolved_type_id = self._resolve_lookup_filter_id(
            raw_value=filters.type_name,
            filter_name="type",
            lookup_id_resolver=self.schedule_repository.get_type_id_by_name,
            lookup_name_resolver=self.schedule_repository.get_type_name_by_id,
        )
        return filters.model_copy(
            update={
                "status_id": resolved_status_id,
                "type_id": resolved_type_id,
            }
        )

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

        if current_user.app_role == ADVISER_ROLE_NAME:
            if schedule.adviser_id == current_user.id:
                return schedule

            if self.panelist_repository.get(schedule.id, current_user.id) is not None:
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

    @property
    def slot_guard(self) -> ScheduleSlotGuard:
        return ScheduleSlotGuard(self.schedule_repository, self.availability_repository)

    def create_schedule(
        self,
        current_user: AuthenticatedUser,
        payload: ScheduleCreateRequest,
    ) -> Schedule:
        self._require_student(current_user)
        adviser = self._get_adviser_or_raise(payload.adviser_id)
        schedule_type_name = self._ensure_schedule_type_exists(payload.type_id)
        normalized_scheduled_at = _normalize_datetime(payload.scheduled_at)

        self.slot_guard.ensure_slot_available(
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
        self.email_service.send_schedule_submitted(
            adviser_email=str(adviser.email),
            adviser_name=adviser.full_name,
            student_name=current_user.full_name,
            schedule_type=schedule_type_name,
            topic=schedule.topic,
            scheduled_at=payload.scheduled_at,
        )
        return schedule

    def list_schedules(
        self,
        current_user: AuthenticatedUser,
        filters: ScheduleListFilters,
    ) -> ScheduleListResponse:
        resolved_filters = self._resolve_list_filters(filters)

        if current_user.app_role == STUDENT_ROLE_NAME:
            page = self.schedule_repository.list_by_student(current_user.id, resolved_filters)
        elif current_user.app_role == ADVISER_ROLE_NAME:
            panelist_schedule_ids = self.panelist_repository.list_schedule_ids_by_panelist(
                current_user.id
            )
            page = self.schedule_repository.list_by_adviser_or_panelist(
                current_user.id,
                panelist_schedule_ids,
                resolved_filters,
            )
        elif current_user.app_role == ADMIN_ROLE_NAME:
            page = self.schedule_repository.list_all(resolved_filters)
        else:
            raise ScheduleForbiddenError("You do not have permission to list schedules.")

        return ScheduleListResponse(
            items=page.items,
            total=page.total,
            page=page.page,
            limit=page.page_size,
        )

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
        schedule = self._get_schedule_or_raise(schedule_id)
        pending_status_id = self._get_required_status_id(PENDING_STATUS_NAME)
        approved_status_id = self._get_required_status_id(APPROVED_STATUS_NAME)
        rescheduled_status_id = self._get_required_status_id(RESCHEDULED_STATUS_NAME)
        cancelled_status_id = self._get_required_status_id(CANCELLED_STATUS_NAME)

        if schedule.status_id == cancelled_status_id:
            raise ScheduleConflictError("Schedule is already cancelled.")

        actor_label: str
        audit_remarks: str
        if current_user.app_role == STUDENT_ROLE_NAME:
            if schedule.student_id != current_user.id:
                raise ScheduleForbiddenError("Only the owning student can cancel this schedule.")

            if schedule.status_id != pending_status_id:
                raise ScheduleConflictError("Only pending schedules can be cancelled by students.")

            actor_label = "student"
            audit_remarks = "Schedule cancelled by student."
        elif current_user.app_role == ADVISER_ROLE_NAME:
            if schedule.adviser_id != current_user.id:
                raise ScheduleForbiddenError("Only the assigned adviser can cancel this schedule.")

            if schedule.status_id not in {approved_status_id, rescheduled_status_id}:
                raise ScheduleConflictError(
                    "Only approved or rescheduled schedules can be cancelled by advisers."
                )

            actor_label = "adviser"
            audit_remarks = "Schedule cancelled by adviser."
        else:
            raise ScheduleForbiddenError("Only students or assigned advisers can cancel schedules.")

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
            remarks=audit_remarks,
        )
        schedule_type_name = self.schedule_repository.get_type_name_by_id(updated_schedule.type_id)
        if actor_label == "student":
            adviser = self._get_user_or_raise(updated_schedule.adviser_id, label="Adviser")
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
            self.email_service.send_schedule_cancelled(
                recipient_email=str(adviser.email),
                recipient_name=adviser.full_name,
                cancelled_by_student=True,
                student_name=current_user.full_name,
                adviser_name=adviser.full_name,
                topic=updated_schedule.topic,
                schedule_type=schedule_type_name,
                requested_at=updated_schedule.scheduled_at,
                cancelled_by_name=current_user.full_name,
            )
        else:
            student = self._get_user_or_raise(updated_schedule.student_id, label="Student")
            self._create_notification(
                user_id=updated_schedule.student_id,
                schedule_id=updated_schedule.id,
                message=(
                    f'Your approved schedule for "{updated_schedule.topic}" was cancelled by '
                    f"{current_user.full_name}."
                ),
            )
            self._create_notification(
                user_id=updated_schedule.adviser_id,
                schedule_id=updated_schedule.id,
                message=f'You cancelled the approved schedule for "{updated_schedule.topic}".',
            )
            self.email_service.send_schedule_cancelled(
                recipient_email=str(student.email),
                recipient_name=student.full_name,
                cancelled_by_student=False,
                student_name=student.full_name,
                adviser_name=current_user.full_name,
                topic=updated_schedule.topic,
                schedule_type=schedule_type_name,
                requested_at=updated_schedule.scheduled_at,
                cancelled_by_name=current_user.full_name,
            )
        return updated_schedule
