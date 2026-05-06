from __future__ import annotations

from typing import Protocol

from model.auth import AuthenticatedUser
from model.dashboard import AdviserDashboardResponse, StudentDashboardResponse


class DashboardServiceError(RuntimeError):
    """Base exception for dashboard service failures."""


class DashboardForbiddenError(DashboardServiceError):
    """Raised when the caller cannot access the requested dashboard."""


class DashboardServiceUnavailableError(DashboardServiceError):
    """Raised when the dashboard service dependency is not configured."""


class DashboardService(Protocol):
    """Use-case contract for portal dashboard views."""

    def get_student_dashboard(
        self,
        current_user: AuthenticatedUser,
    ) -> StudentDashboardResponse: ...

    def get_adviser_dashboard(
        self,
        current_user: AuthenticatedUser,
    ) -> AdviserDashboardResponse: ...
