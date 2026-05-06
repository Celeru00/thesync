from __future__ import annotations

from typing import Protocol
from uuid import UUID

from model.auth import AuthenticatedUser
from model.panelist import (
    PanelistAssignment,
    PanelistAssignmentCreateRequest,
    PanelistInviteResponseRequest,
)


class PanelistServiceError(RuntimeError):
    """Base exception for panelist assignment service failures."""


class PanelistValidationError(PanelistServiceError):
    """Raised when the panelist payload is invalid."""


class PanelistForbiddenError(PanelistServiceError):
    """Raised when the caller cannot modify the panelist assignment."""


class PanelistNotFoundError(PanelistServiceError):
    """Raised when the schedule or panelist assignment does not exist."""


class PanelistConflictError(PanelistServiceError):
    """Raised when the requested panelist change conflicts with existing data."""


class PanelistServiceUnavailableError(PanelistServiceError):
    """Raised when the panelist service dependency is not configured."""


class PanelistService(Protocol):
    """Use-case contract for schedule panelist assignment operations."""

    def add_panelist(
        self,
        current_user: AuthenticatedUser,
        schedule_id: UUID,
        payload: PanelistAssignmentCreateRequest,
    ) -> PanelistAssignment: ...

    def respond_to_invite(
        self,
        current_user: AuthenticatedUser,
        schedule_id: UUID,
        panelist_id: UUID,
        payload: PanelistInviteResponseRequest,
    ) -> PanelistAssignment: ...

    def remove_panelist(
        self,
        current_user: AuthenticatedUser,
        schedule_id: UUID,
        panelist_id: UUID,
    ) -> None: ...
