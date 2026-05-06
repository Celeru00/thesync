from __future__ import annotations

from datetime import date, datetime
from typing import Protocol
from uuid import UUID

from model.auth import AuthenticatedUser
from model.availability import (
    AvailabilitySlot,
    AvailabilitySlotBlockedUpdateRequest,
    AvailabilitySlotCreateRequest,
)


class AvailabilityServiceError(RuntimeError):
    """Base exception for availability service failures."""


class AvailabilityValidationError(AvailabilityServiceError):
    """Raised when the availability payload is invalid."""


class AvailabilityForbiddenError(AvailabilityServiceError):
    """Raised when the caller cannot access the requested availability slot."""


class AvailabilityNotFoundError(AvailabilityServiceError):
    """Raised when the requested availability slot cannot be found."""


class AvailabilityConflictError(AvailabilityServiceError):
    """Raised when the requested availability change conflicts with existing data."""


class AvailabilityServiceUnavailableError(AvailabilityServiceError):
    """Raised when the availability service dependency is not configured."""


class AvailabilityService(Protocol):
    """Use-case contract for adviser availability operations."""

    def create_slot(
        self,
        current_user: AuthenticatedUser,
        payload: AvailabilitySlotCreateRequest,
    ) -> AvailabilitySlot: ...

    def list_slots(self, current_user: AuthenticatedUser) -> list[AvailabilitySlot]: ...

    def get_free_slots(
        self,
        current_user: AuthenticatedUser,
        adviser_id: UUID,
        day: date | datetime | None = None,
    ) -> list[AvailabilitySlot]: ...

    def toggle_blocked(
        self,
        current_user: AuthenticatedUser,
        slot_id: UUID,
        payload: AvailabilitySlotBlockedUpdateRequest,
    ) -> AvailabilitySlot: ...

    def delete_slot(self, current_user: AuthenticatedUser, slot_id: UUID) -> None: ...
