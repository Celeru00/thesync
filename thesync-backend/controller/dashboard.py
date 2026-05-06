from __future__ import annotations

from typing import Annotated, cast

from fastapi import APIRouter, Depends, HTTPException, Request, status

from controller.dependencies import CurrentUser
from model.dashboard import AdviserDashboardResponse, StudentDashboardResponse
from usecase.dashboard import (
    DashboardForbiddenError,
    DashboardService,
    DashboardServiceUnavailableError,
)

router = APIRouter(tags=["dashboard"])


class _UnavailableDashboardService:
    def _raise(self) -> None:
        raise DashboardServiceUnavailableError("Dashboard service is not configured.")

    def get_student_dashboard(self, *args, **kwargs) -> StudentDashboardResponse:
        self._raise()

    def get_adviser_dashboard(self, *args, **kwargs) -> AdviserDashboardResponse:
        self._raise()


_UNAVAILABLE_DASHBOARD_SERVICE = _UnavailableDashboardService()


def get_dashboard_service(request: Request) -> DashboardService:
    service = getattr(request.app.state, "dashboard_service", _UNAVAILABLE_DASHBOARD_SERVICE)
    return cast(DashboardService, service)


DashboardServiceDependency = Annotated[DashboardService, Depends(get_dashboard_service)]


def _raise_dashboard_http_error(exc: Exception) -> None:
    if isinstance(exc, DashboardForbiddenError):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail=str(exc)) from exc

    if isinstance(exc, DashboardServiceUnavailableError):
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=str(exc),
        ) from exc


@router.get(
    "/student/dashboard",
    response_model=StudentDashboardResponse,
    summary="Get student dashboard",
)
def get_student_dashboard(
    current_user: CurrentUser,
    service: DashboardServiceDependency,
) -> StudentDashboardResponse:
    try:
        return service.get_student_dashboard(current_user)
    except (DashboardForbiddenError, DashboardServiceUnavailableError) as exc:
        _raise_dashboard_http_error(exc)


@router.get(
    "/adviser/dashboard",
    response_model=AdviserDashboardResponse,
    summary="Get adviser dashboard",
)
def get_adviser_dashboard(
    current_user: CurrentUser,
    service: DashboardServiceDependency,
) -> AdviserDashboardResponse:
    try:
        return service.get_adviser_dashboard(current_user)
    except (DashboardForbiddenError, DashboardServiceUnavailableError) as exc:
        _raise_dashboard_http_error(exc)
