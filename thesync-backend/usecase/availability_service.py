from __future__ import annotations

from datetime import date, datetime, time
from typing import Final
from uuid import UUID

from model.auth import AuthenticatedUser
from model.availability import (
    AvailabilityRule,
    AvailabilitySlot,
    AvailabilitySlotBlockedUpdateRequest,
    AvailabilitySlotCreateRequest,
)
from repository.availability_repository import (
    AvailabilityRepository,
    AvailabilityRepositoryCalendarError,
    AvailabilityRepositoryNotFoundError,
    AvailabilityRepositoryUnavailableError,
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


def _times_overlap(
    start_a: time,
    end_a: time,
    start_b: time,
    end_b: time,
) -> bool:
    return start_a < end_b and end_a > start_b


class DefaultAvailabilityService(AvailabilityService):
    """Business logic for recurring adviser availability rule management."""

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
    ) -> AvailabilityRule:
        try:
            slot = self.availability_repository.get_by_id(slot_id)
        except AvailabilityRepositoryUnavailableError as exc:
            raise AvailabilityServiceUnavailableError(str(exc)) from exc
        if slot is None:
            raise AvailabilityNotFoundError("Availability rule was not found.")

        if slot.adviser_id != current_user.id:
            raise AvailabilityForbiddenError("You can only manage your own availability rules.")

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
        day_of_week: int,
        start_time: time,
        end_time: time,
        is_blocked: bool,
        excluded_slot_id: UUID | None = None,
    ) -> None:
        try:
            existing_slots = self.availability_repository.list_by_adviser(adviser_id)
        except AvailabilityRepositoryUnavailableError as exc:
            raise AvailabilityServiceUnavailableError(str(exc)) from exc

        for existing_slot in existing_slots:
            if excluded_slot_id is not None and existing_slot.id == excluded_slot_id:
                continue

            if existing_slot.day_of_week != day_of_week:
                continue

            if existing_slot.is_blocked != is_blocked:
                continue

            if _times_overlap(
                start_time,
                end_time,
                existing_slot.start_time,
                existing_slot.end_time,
            ):
                raise AvailabilityConflictError(
                    "Recurring availability rules of the same type must not overlap."
                )

    def create_slot(
        self,
        current_user: AuthenticatedUser,
        payload: AvailabilitySlotCreateRequest,
    ) -> AvailabilityRule:
        self._require_adviser(current_user)
        self._ensure_no_overlap(
            adviser_id=current_user.id,
            day_of_week=payload.day_of_week,
            start_time=payload.start_time,
            end_time=payload.end_time,
            is_blocked=payload.is_blocked,
        )

        try:
            slot = self.availability_repository.create(
                adviser_id=current_user.id,
                day_of_week=payload.day_of_week,
                start_time=payload.start_time,
                end_time=payload.end_time,
                is_blocked=payload.is_blocked,
            )
        except (
            AvailabilityRepositoryNotFoundError,
            AvailabilityRepositoryUnavailableError,
        ) as exc:
            raise AvailabilityServiceUnavailableError(str(exc)) from exc

        return slot

    def list_slots(self, current_user: AuthenticatedUser) -> list[AvailabilityRule]:
        self._require_adviser(current_user)
        try:
            return self.availability_repository.list_by_adviser(current_user.id)
        except AvailabilityRepositoryUnavailableError as exc:
            raise AvailabilityServiceUnavailableError(str(exc)) from exc

    def get_free_slots(
        self,
        current_user: AuthenticatedUser,
        adviser_id: UUID,
        day: date | datetime | None = None,
    ) -> list[AvailabilitySlot]:
        if current_user.app_role not in {STUDENT_ROLE_NAME, ADVISER_ROLE_NAME, ADMIN_ROLE_NAME}:
            raise AvailabilityForbiddenError("You do not have permission to view free slots.")

        self._ensure_adviser_exists(adviser_id)
        try:
            return self.availability_repository.get_free_slots(adviser_id, day)
        except (
            AvailabilityRepositoryCalendarError,
            AvailabilityRepositoryUnavailableError,
        ) as exc:
            raise AvailabilityServiceUnavailableError(str(exc)) from exc

    def toggle_blocked(
        self,
        current_user: AuthenticatedUser,
        slot_id: UUID,
        payload: AvailabilitySlotBlockedUpdateRequest,
    ) -> AvailabilityRule:
        self._require_adviser(current_user)
        slot = self._get_slot_for_owner(current_user=current_user, slot_id=slot_id)
        self._ensure_no_overlap(
            adviser_id=current_user.id,
            day_of_week=slot.day_of_week,
            start_time=slot.start_time,
            end_time=slot.end_time,
            is_blocked=payload.is_blocked,
            excluded_slot_id=slot.id,
        )
        try:
            return self.availability_repository.update_blocked(slot_id, payload.is_blocked)
        except AvailabilityRepositoryUnavailableError as exc:
            raise AvailabilityServiceUnavailableError(str(exc)) from exc

    def delete_slot(self, current_user: AuthenticatedUser, slot_id: UUID) -> None:
        self._require_adviser(current_user)
        self._get_slot_for_owner(current_user=current_user, slot_id=slot_id)
        try:
            self.availability_repository.delete(slot_id)
        except AvailabilityRepositoryUnavailableError as exc:
            raise AvailabilityServiceUnavailableError(str(exc)) from exc
