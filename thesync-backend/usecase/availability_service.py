from __future__ import annotations

from datetime import UTC, date, datetime
from typing import Final
from uuid import UUID

from model.auth import AuthenticatedUser
from model.availability import (
    AvailabilitySlot,
    AvailabilitySlotBlockedUpdateRequest,
    AvailabilitySlotCreateRequest,
)
from repository.availability_repository import (
    AvailabilityRepository,
    AvailabilityRepositoryNotFoundError,
    get_availability_repository,
)
from repository.supabase_client import SupabaseClientConfigurationError
from repository.user_repository import UserRepository, get_user_repository
from usecase.availability import (
    AvailabilityConflictError,
    AvailabilityForbiddenError,
    AvailabilityNotFoundError,
    AvailabilityService,
    AvailabilityServiceUnavailableError,
)

ADVISER_ROLE_NAME: Final[str] = "adviser"
ADMIN_ROLE_NAME: Final[str] = "admin"
STUDENT_ROLE_NAME: Final[str] = "student"


def _normalize_datetime(value: datetime) -> datetime:
    if value.tzinfo is None:
        return value.replace(tzinfo=UTC)

    return value.astimezone(UTC)


class DefaultAvailabilityService(AvailabilityService):
    """Business logic for adviser availability slot management."""

    def __init__(
        self,
        availability_repository: AvailabilityRepository | None = None,
        user_repository: UserRepository | None = None,
    ) -> None:
        self._availability_repository = availability_repository
        self._user_repository = user_repository

    @property
    def availability_repository(self) -> AvailabilityRepository:
        if self._availability_repository is None:
            try:
                self._availability_repository = get_availability_repository()
            except SupabaseClientConfigurationError as exc:
                raise AvailabilityServiceUnavailableError(str(exc)) from exc

        return self._availability_repository

    @property
    def user_repository(self) -> UserRepository:
        if self._user_repository is None:
            try:
                self._user_repository = get_user_repository()
            except SupabaseClientConfigurationError as exc:
                raise AvailabilityServiceUnavailableError(str(exc)) from exc

        return self._user_repository

    def _require_adviser(self, current_user: AuthenticatedUser) -> None:
        if current_user.app_role != ADVISER_ROLE_NAME:
            raise AvailabilityForbiddenError("Only advisers can manage availability slots.")

    def _get_slot_for_owner(
        self,
        *,
        current_user: AuthenticatedUser,
        slot_id: UUID,
    ) -> AvailabilitySlot:
        slot = self.availability_repository.get_by_id(slot_id)
        if slot is None:
            raise AvailabilityNotFoundError("Availability slot was not found.")

        if slot.adviser_id != current_user.id:
            raise AvailabilityForbiddenError("You can only manage your own availability slots.")

        return slot

    def _ensure_adviser_exists(self, adviser_id: UUID) -> None:
        adviser = self.user_repository.get_by_id(adviser_id)
        if adviser is None:
            raise AvailabilityNotFoundError("Adviser was not found.")

        if adviser.role_name is None or adviser.role_name.lower() != ADVISER_ROLE_NAME:
            raise AvailabilityNotFoundError("Adviser was not found.")

    def _ensure_no_overlap(
        self,
        *,
        adviser_id: UUID,
        slot_start: datetime,
        slot_end: datetime,
        excluded_slot_id: UUID | None = None,
    ) -> None:
        normalized_slot_start = _normalize_datetime(slot_start)
        normalized_slot_end = _normalize_datetime(slot_end)
        for existing_slot in self.availability_repository.list_by_adviser(adviser_id):
            if excluded_slot_id is not None and existing_slot.id == excluded_slot_id:
                continue

            existing_slot_start = _normalize_datetime(existing_slot.slot_start)
            existing_slot_end = _normalize_datetime(existing_slot.slot_end)
            if (
                normalized_slot_start < existing_slot_end
                and normalized_slot_end > existing_slot_start
            ):
                raise AvailabilityConflictError(
                    "Availability slots must not overlap existing slots."
                )

    def create_slot(
        self,
        current_user: AuthenticatedUser,
        payload: AvailabilitySlotCreateRequest,
    ) -> AvailabilitySlot:
        self._require_adviser(current_user)
        normalized_slot_start = _normalize_datetime(payload.slot_start)
        normalized_slot_end = _normalize_datetime(payload.slot_end)
        self._ensure_no_overlap(
            adviser_id=current_user.id,
            slot_start=normalized_slot_start,
            slot_end=normalized_slot_end,
        )

        try:
            slot = self.availability_repository.create(
                adviser_id=current_user.id,
                slot_start=normalized_slot_start,
                slot_end=normalized_slot_end,
            )
        except AvailabilityRepositoryNotFoundError as exc:
            raise AvailabilityServiceUnavailableError(str(exc)) from exc

        if payload.is_blocked:
            return self.availability_repository.update_blocked(slot.id, True)

        return slot

    def list_slots(self, current_user: AuthenticatedUser) -> list[AvailabilitySlot]:
        self._require_adviser(current_user)
        return self.availability_repository.list_by_adviser(current_user.id)

    def get_free_slots(
        self,
        current_user: AuthenticatedUser,
        adviser_id: UUID,
        day: date | datetime | None = None,
    ) -> list[AvailabilitySlot]:
        if current_user.app_role not in {STUDENT_ROLE_NAME, ADVISER_ROLE_NAME, ADMIN_ROLE_NAME}:
            raise AvailabilityForbiddenError("You do not have permission to view free slots.")

        self._ensure_adviser_exists(adviser_id)
        return self.availability_repository.get_free_slots(adviser_id, day)

    def toggle_blocked(
        self,
        current_user: AuthenticatedUser,
        slot_id: UUID,
        payload: AvailabilitySlotBlockedUpdateRequest,
    ) -> AvailabilitySlot:
        self._require_adviser(current_user)
        self._get_slot_for_owner(current_user=current_user, slot_id=slot_id)
        return self.availability_repository.update_blocked(slot_id, payload.is_blocked)

    def delete_slot(self, current_user: AuthenticatedUser, slot_id: UUID) -> None:
        self._require_adviser(current_user)
        self._get_slot_for_owner(current_user=current_user, slot_id=slot_id)
        self.availability_repository.delete(slot_id)
