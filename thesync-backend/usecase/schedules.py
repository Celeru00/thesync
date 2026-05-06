from __future__ import annotations

from typing import Protocol
from uuid import UUID

from model.auth import AuthenticatedUser
from model.base import PaginatedResult
from model.schedule import (
    Schedule,
    ScheduleApproveRequest,
    ScheduleCreateRequest,
    ScheduleListFilters,
    ScheduleRejectRequest,
    ScheduleRescheduleRequest,
)


class ScheduleServiceError(RuntimeError):
    """Base exception for schedule service failures."""


class ScheduleValidationError(ScheduleServiceError):
    """Raised when the schedule payload is invalid."""


class ScheduleForbiddenError(ScheduleServiceError):
    """Raised when the caller cannot access the schedule."""


class ScheduleNotFoundError(ScheduleServiceError):
    """Raised when the requested schedule does not exist."""


class ScheduleConflictError(ScheduleServiceError):
    """Raised when the schedule operation conflicts with existing state."""


class ScheduleServiceUnavailableError(ScheduleServiceError):
    """Raised when the schedule service dependency is not configured."""


class ScheduleService(Protocol):
    """Use-case contract for schedule CRUD operations."""

    def create_schedule(
        self,
        current_user: AuthenticatedUser,
        payload: ScheduleCreateRequest,
    ) -> Schedule: ...

    def list_schedules(
        self,
        current_user: AuthenticatedUser,
        filters: ScheduleListFilters,
    ) -> PaginatedResult[Schedule]: ...

    def get_schedule(
        self,
        current_user: AuthenticatedUser,
        schedule_id: UUID,
    ) -> Schedule: ...

    def cancel_schedule(
        self,
        current_user: AuthenticatedUser,
        schedule_id: UUID,
    ) -> None: ...


class ScheduleStatusService(Protocol):
    """Use-case contract for schedule status transitions."""

    def approve_schedule(
        self,
        current_user: AuthenticatedUser,
        schedule_id: UUID,
        payload: ScheduleApproveRequest,
    ) -> Schedule: ...

    def reject_schedule(
        self,
        current_user: AuthenticatedUser,
        schedule_id: UUID,
        payload: ScheduleRejectRequest,
    ) -> Schedule: ...

    def reschedule(
        self,
        current_user: AuthenticatedUser,
        schedule_id: UUID,
        payload: ScheduleRescheduleRequest,
    ) -> Schedule: ...
