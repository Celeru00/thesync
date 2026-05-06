from __future__ import annotations

from typing import Final
from uuid import UUID

from model.auth import AuthenticatedUser
from model.panelist import (
    InviteStatusEnum,
    PanelistAssignment,
    PanelistAssignmentCreateRequest,
    PanelistAssignmentResponse,
    PanelistInviteResponseRequest,
)
from model.schedule import Schedule
from model.user import User
from repository.notification_repository import (
    NotificationRepository,
    get_notification_repository,
)
from repository.panelist_repository import (
    PanelistRepository,
    PanelistRepositoryNotFoundError,
    get_panelist_repository,
)
from repository.schedule_repository import ScheduleRepository, get_schedule_repository
from repository.supabase_client import SupabaseClientConfigurationError
from repository.user_repository import UserRepository, get_user_repository
from usecase.panelists import (
    PanelistConflictError,
    PanelistForbiddenError,
    PanelistNotFoundError,
    PanelistService,
    PanelistServiceUnavailableError,
    PanelistValidationError,
)

ADVISER_ROLE_NAME: Final[str] = "adviser"
ADMIN_ROLE_NAME: Final[str] = "admin"
DEFENSE_TYPE_NAME: Final[str] = "defense"


def _normalize_invite_status_name(status_name: str | None) -> InviteStatusEnum:
    normalized_status_name = (status_name or "").strip().lower()
    if normalized_status_name == "pending":
        return InviteStatusEnum.invited

    try:
        return InviteStatusEnum(normalized_status_name)
    except ValueError as exc:
        raise PanelistServiceUnavailableError(
            f'Unsupported invite status "{status_name}" is configured.'
        ) from exc


class DefaultPanelistService(PanelistService):
    """Business logic for schedule panelist assignments and responses."""

    def __init__(
        self,
        panelist_repository: PanelistRepository | None = None,
        schedule_repository: ScheduleRepository | None = None,
        user_repository: UserRepository | None = None,
        notification_repository: NotificationRepository | None = None,
    ) -> None:
        self._panelist_repository = panelist_repository
        self._schedule_repository = schedule_repository
        self._user_repository = user_repository
        self._notification_repository = notification_repository

    @property
    def panelist_repository(self) -> PanelistRepository:
        if self._panelist_repository is None:
            try:
                self._panelist_repository = get_panelist_repository()
            except SupabaseClientConfigurationError as exc:
                raise PanelistServiceUnavailableError(str(exc)) from exc

        return self._panelist_repository

    @property
    def schedule_repository(self) -> ScheduleRepository:
        if self._schedule_repository is None:
            try:
                self._schedule_repository = get_schedule_repository()
            except SupabaseClientConfigurationError as exc:
                raise PanelistServiceUnavailableError(str(exc)) from exc

        return self._schedule_repository

    @property
    def user_repository(self) -> UserRepository:
        if self._user_repository is None:
            try:
                self._user_repository = get_user_repository()
            except SupabaseClientConfigurationError as exc:
                raise PanelistServiceUnavailableError(str(exc)) from exc

        return self._user_repository

    @property
    def notification_repository(self) -> NotificationRepository:
        if self._notification_repository is None:
            try:
                self._notification_repository = get_notification_repository()
            except SupabaseClientConfigurationError as exc:
                raise PanelistServiceUnavailableError(str(exc)) from exc

        return self._notification_repository

    def _get_schedule_or_raise(self, schedule_id: UUID) -> Schedule:
        schedule = self.schedule_repository.get_by_id(schedule_id)
        if schedule is None:
            raise PanelistNotFoundError("Schedule was not found.")

        return schedule

    def _require_schedule_manager(
        self,
        *,
        current_user: AuthenticatedUser,
        schedule_id: UUID,
    ) -> Schedule:
        schedule = self._get_schedule_or_raise(schedule_id)
        if current_user.app_role == ADMIN_ROLE_NAME:
            return schedule

        if current_user.app_role == ADVISER_ROLE_NAME and schedule.adviser_id == current_user.id:
            return schedule

        raise PanelistForbiddenError("Only the assigned adviser can manage panelists.")

    def _require_defense_schedule(self, schedule_id: UUID) -> Schedule:
        schedule = self._get_schedule_or_raise(schedule_id)
        schedule_type_name = self.schedule_repository.get_type_name_by_id(schedule.type_id)
        if schedule_type_name is None:
            raise PanelistServiceUnavailableError("Schedule type lookup is unavailable.")

        if schedule_type_name != DEFENSE_TYPE_NAME:
            raise PanelistValidationError("Panelists can only be assigned to defense schedules.")

        return schedule

    def _get_panelist_user_or_raise(self, panelist_id: UUID) -> User:
        panelist_user = self.user_repository.get_by_id(panelist_id)
        if panelist_user is None:
            raise PanelistNotFoundError("Panelist user was not found.")

        if panelist_user.role_name is None or panelist_user.role_name.lower() != ADVISER_ROLE_NAME:
            raise PanelistValidationError("Selected panelist must be an adviser.")

        return panelist_user

    def _to_assignment_response(
        self,
        assignment: PanelistAssignment,
    ) -> PanelistAssignmentResponse:
        panelist_user = self.user_repository.get_by_id(assignment.panelist_id)
        if panelist_user is None:
            raise PanelistNotFoundError("Panelist user was not found.")

        invite_status_name = self.panelist_repository.get_invite_status_name(
            assignment.invite_status_id
        )
        invite_status = _normalize_invite_status_name(invite_status_name)
        return PanelistAssignmentResponse(
            id=assignment.id,
            schedule_id=assignment.schedule_id,
            panelist=panelist_user,
            invite_status=invite_status,
        )

    def add_panelist(
        self,
        current_user: AuthenticatedUser,
        schedule_id: UUID,
        payload: PanelistAssignmentCreateRequest,
    ) -> PanelistAssignmentResponse:
        self._require_schedule_manager(current_user=current_user, schedule_id=schedule_id)
        schedule = self._require_defense_schedule(schedule_id)
        panelist_user = self._get_panelist_user_or_raise(payload.panelist_id)

        if self.panelist_repository.get(schedule_id, payload.panelist_id) is not None:
            raise PanelistConflictError("Panelist is already assigned to this schedule.")

        try:
            assignment = self.panelist_repository.create(schedule.id, panelist_user.id)
        except PanelistRepositoryNotFoundError as exc:
            raise PanelistServiceUnavailableError(str(exc)) from exc

        scheduled_for = (
            schedule.scheduled_at.isoformat() if schedule.scheduled_at else "an unscheduled slot"
        )
        self.notification_repository.create(
            user_id=panelist_user.id,
            schedule_id=schedule.id,
            message=(
                f'You were invited to be a panelist for "{schedule.topic}" on ' f"{scheduled_for}."
            ),
        )
        return self._to_assignment_response(assignment)

    def respond_to_invite(
        self,
        current_user: AuthenticatedUser,
        schedule_id: UUID,
        panelist_id: UUID,
        payload: PanelistInviteResponseRequest,
    ) -> PanelistAssignmentResponse:
        if current_user.id != panelist_id:
            raise PanelistForbiddenError("Only the invited panelist can respond to the invite.")

        assignment = self.panelist_repository.get(schedule_id, panelist_id)
        if assignment is None:
            raise PanelistNotFoundError("Panelist assignment was not found.")

        current_status_name = self.panelist_repository.get_invite_status_name(
            assignment.invite_status_id
        )
        current_status = _normalize_invite_status_name(current_status_name)
        if current_status == payload.response:
            raise PanelistConflictError(
                f"Panelist invite is already marked as {payload.response.value}."
            )

        next_status_id = self.panelist_repository.get_invite_status_id(payload.response.value)
        if next_status_id is None:
            raise PanelistServiceUnavailableError(
                f'Invite status "{payload.response.value}" is not configured.'
            )

        updated_assignment = self.panelist_repository.update_status(assignment.id, next_status_id)
        return self._to_assignment_response(updated_assignment)

    def remove_panelist(
        self,
        current_user: AuthenticatedUser,
        schedule_id: UUID,
        panelist_id: UUID,
    ) -> None:
        self._require_schedule_manager(current_user=current_user, schedule_id=schedule_id)
        assignment = self.panelist_repository.get(schedule_id, panelist_id)
        if assignment is None:
            raise PanelistNotFoundError("Panelist assignment was not found.")

        self.panelist_repository.delete(assignment.id)
