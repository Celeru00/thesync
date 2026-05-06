from __future__ import annotations

from datetime import date, datetime
from typing import Annotated, cast
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, Request, Response, status

from controller.dependencies import CurrentUser
from model.base import PaginatedResult
from model.schedule import (
    Schedule,
    ScheduleApproveRequest,
    ScheduleCreateRequest,
    ScheduleListFilters,
    ScheduleRejectRequest,
    ScheduleRescheduleRequest,
)
from usecase.schedules import (
    ScheduleConflictError,
    ScheduleForbiddenError,
    ScheduleNotFoundError,
    ScheduleService,
    ScheduleServiceUnavailableError,
    ScheduleStatusService,
    ScheduleValidationError,
)

router = APIRouter(prefix="/schedules", tags=["schedules"])

OptionalPositiveIntQuery = Annotated[int | None, Query(ge=1)]
OptionalDateOrDateTimeQuery = Annotated[date | datetime | None, Query()]
PositiveIntQuery = Annotated[int, Query(ge=1)]


class _UnavailableScheduleService:
    def _raise(self) -> None:
        raise ScheduleServiceUnavailableError("Schedule service is not configured.")

    def create_schedule(self, *args, **kwargs) -> Schedule:
        self._raise()

    def list_schedules(self, *args, **kwargs) -> PaginatedResult[Schedule]:
        self._raise()

    def get_schedule(self, *args, **kwargs) -> Schedule:
        self._raise()

    def cancel_schedule(self, *args, **kwargs) -> None:
        self._raise()


class _UnavailableScheduleStatusService:
    def _raise(self) -> None:
        raise ScheduleServiceUnavailableError("Schedule status service is not configured.")

    def approve_schedule(self, *args, **kwargs) -> Schedule:
        self._raise()

    def reject_schedule(self, *args, **kwargs) -> Schedule:
        self._raise()

    def reschedule(self, *args, **kwargs) -> Schedule:
        self._raise()


_UNAVAILABLE_SCHEDULE_SERVICE = _UnavailableScheduleService()
_UNAVAILABLE_SCHEDULE_STATUS_SERVICE = _UnavailableScheduleStatusService()


def get_schedule_service(request: Request) -> ScheduleService:
    service = getattr(request.app.state, "schedule_service", _UNAVAILABLE_SCHEDULE_SERVICE)
    return cast(ScheduleService, service)


def get_schedule_status_service(request: Request) -> ScheduleStatusService:
    service = getattr(
        request.app.state,
        "schedule_status_service",
        _UNAVAILABLE_SCHEDULE_STATUS_SERVICE,
    )
    return cast(ScheduleStatusService, service)


ScheduleServiceDependency = Annotated[ScheduleService, Depends(get_schedule_service)]
ScheduleStatusServiceDependency = Annotated[
    ScheduleStatusService,
    Depends(get_schedule_status_service),
]


def get_schedule_list_filters(
    status_id: OptionalPositiveIntQuery = None,
    type_id: OptionalPositiveIntQuery = None,
    from_date: OptionalDateOrDateTimeQuery = None,
    to_date: OptionalDateOrDateTimeQuery = None,
    page: PositiveIntQuery = 1,
    page_size: PositiveIntQuery = 20,
) -> ScheduleListFilters:
    return ScheduleListFilters(
        status_id=status_id,
        type_id=type_id,
        from_date=from_date,
        to_date=to_date,
        page=page,
        page_size=page_size,
    )


ScheduleListFiltersDependency = Annotated[ScheduleListFilters, Depends(get_schedule_list_filters)]


def _raise_schedule_http_error(exc: Exception) -> None:
    if isinstance(exc, ScheduleValidationError):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc)) from exc

    if isinstance(exc, ScheduleForbiddenError):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail=str(exc)) from exc

    if isinstance(exc, ScheduleNotFoundError):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc)) from exc

    if isinstance(exc, ScheduleConflictError):
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail=str(exc)) from exc

    if isinstance(exc, ScheduleServiceUnavailableError):
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail=str(exc)
        ) from exc


@router.post(
    "", response_model=Schedule, status_code=status.HTTP_201_CREATED, summary="Create schedule"
)
def create_schedule(
    payload: ScheduleCreateRequest,
    current_user: CurrentUser,
    service: ScheduleServiceDependency,
) -> Schedule:
    try:
        return service.create_schedule(current_user, payload)
    except (
        ScheduleValidationError,
        ScheduleForbiddenError,
        ScheduleNotFoundError,
        ScheduleConflictError,
        ScheduleServiceUnavailableError,
    ) as exc:
        _raise_schedule_http_error(exc)


@router.get("", response_model=PaginatedResult[Schedule], summary="List schedules")
def list_schedules(
    current_user: CurrentUser,
    filters: ScheduleListFiltersDependency,
    service: ScheduleServiceDependency,
) -> PaginatedResult[Schedule]:
    try:
        return service.list_schedules(current_user, filters)
    except (
        ScheduleForbiddenError,
        ScheduleValidationError,
        ScheduleServiceUnavailableError,
    ) as exc:
        _raise_schedule_http_error(exc)


@router.get("/{schedule_id}", response_model=Schedule, summary="Get schedule")
def get_schedule(
    schedule_id: UUID,
    current_user: CurrentUser,
    service: ScheduleServiceDependency,
) -> Schedule:
    try:
        return service.get_schedule(current_user, schedule_id)
    except (
        ScheduleForbiddenError,
        ScheduleNotFoundError,
        ScheduleServiceUnavailableError,
    ) as exc:
        _raise_schedule_http_error(exc)


@router.delete("/{schedule_id}", status_code=status.HTTP_204_NO_CONTENT, summary="Cancel schedule")
def cancel_schedule(
    schedule_id: UUID,
    current_user: CurrentUser,
    service: ScheduleServiceDependency,
) -> Response:
    try:
        service.cancel_schedule(current_user, schedule_id)
    except (
        ScheduleForbiddenError,
        ScheduleNotFoundError,
        ScheduleConflictError,
        ScheduleServiceUnavailableError,
    ) as exc:
        _raise_schedule_http_error(exc)

    return Response(status_code=status.HTTP_204_NO_CONTENT)


@router.put("/{schedule_id}/approve", response_model=Schedule, summary="Approve schedule")
def approve_schedule(
    schedule_id: UUID,
    payload: ScheduleApproveRequest,
    current_user: CurrentUser,
    service: ScheduleStatusServiceDependency,
) -> Schedule:
    try:
        return service.approve_schedule(current_user, schedule_id, payload)
    except (
        ScheduleValidationError,
        ScheduleForbiddenError,
        ScheduleNotFoundError,
        ScheduleConflictError,
        ScheduleServiceUnavailableError,
    ) as exc:
        _raise_schedule_http_error(exc)


@router.put("/{schedule_id}/reject", response_model=Schedule, summary="Reject schedule")
def reject_schedule(
    schedule_id: UUID,
    payload: ScheduleRejectRequest,
    current_user: CurrentUser,
    service: ScheduleStatusServiceDependency,
) -> Schedule:
    try:
        return service.reject_schedule(current_user, schedule_id, payload)
    except (
        ScheduleValidationError,
        ScheduleForbiddenError,
        ScheduleNotFoundError,
        ScheduleConflictError,
        ScheduleServiceUnavailableError,
    ) as exc:
        _raise_schedule_http_error(exc)


@router.put("/{schedule_id}/reschedule", response_model=Schedule, summary="Reschedule schedule")
def reschedule_schedule(
    schedule_id: UUID,
    payload: ScheduleRescheduleRequest,
    current_user: CurrentUser,
    service: ScheduleStatusServiceDependency,
) -> Schedule:
    try:
        return service.reschedule(current_user, schedule_id, payload)
    except (
        ScheduleValidationError,
        ScheduleForbiddenError,
        ScheduleNotFoundError,
        ScheduleConflictError,
        ScheduleServiceUnavailableError,
    ) as exc:
        _raise_schedule_http_error(exc)
