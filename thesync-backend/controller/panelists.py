from __future__ import annotations

from typing import Annotated, cast
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Request, Response, status

from controller.dependencies import CurrentUser
from model.panelist import (
    PanelistAssignment,
    PanelistAssignmentCreateRequest,
    PanelistInviteResponseRequest,
)
from usecase.panelists import (
    PanelistConflictError,
    PanelistForbiddenError,
    PanelistNotFoundError,
    PanelistService,
    PanelistServiceUnavailableError,
    PanelistValidationError,
)

router = APIRouter(tags=["panelists"])


class _UnavailablePanelistService:
    def _raise(self) -> None:
        raise PanelistServiceUnavailableError("Panelist service is not configured.")

    def add_panelist(self, *args, **kwargs) -> PanelistAssignment:
        self._raise()

    def respond_to_invite(self, *args, **kwargs) -> PanelistAssignment:
        self._raise()

    def remove_panelist(self, *args, **kwargs) -> None:
        self._raise()


_UNAVAILABLE_PANELIST_SERVICE = _UnavailablePanelistService()


def get_panelist_service(request: Request) -> PanelistService:
    service = getattr(request.app.state, "panelist_service", _UNAVAILABLE_PANELIST_SERVICE)
    return cast(PanelistService, service)


PanelistServiceDependency = Annotated[PanelistService, Depends(get_panelist_service)]


def _raise_panelist_http_error(exc: Exception) -> None:
    if isinstance(exc, PanelistValidationError):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc)) from exc

    if isinstance(exc, PanelistForbiddenError):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail=str(exc)) from exc

    if isinstance(exc, PanelistNotFoundError):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc)) from exc

    if isinstance(exc, PanelistConflictError):
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail=str(exc)) from exc

    if isinstance(exc, PanelistServiceUnavailableError):
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail=str(exc)
        ) from exc


@router.post(
    "/schedules/{schedule_id}/panelists",
    response_model=PanelistAssignment,
    status_code=status.HTTP_201_CREATED,
)
def add_schedule_panelist(
    schedule_id: UUID,
    payload: PanelistAssignmentCreateRequest,
    current_user: CurrentUser,
    service: PanelistServiceDependency,
) -> PanelistAssignment:
    try:
        return service.add_panelist(current_user, schedule_id, payload)
    except (
        PanelistValidationError,
        PanelistForbiddenError,
        PanelistNotFoundError,
        PanelistConflictError,
        PanelistServiceUnavailableError,
    ) as exc:
        _raise_panelist_http_error(exc)


@router.patch(
    "/schedules/{schedule_id}/panelists/{panelist_id}/respond",
    response_model=PanelistAssignment,
)
def respond_to_panelist_invite(
    schedule_id: UUID,
    panelist_id: UUID,
    payload: PanelistInviteResponseRequest,
    current_user: CurrentUser,
    service: PanelistServiceDependency,
) -> PanelistAssignment:
    try:
        return service.respond_to_invite(current_user, schedule_id, panelist_id, payload)
    except (
        PanelistValidationError,
        PanelistForbiddenError,
        PanelistNotFoundError,
        PanelistConflictError,
        PanelistServiceUnavailableError,
    ) as exc:
        _raise_panelist_http_error(exc)


@router.delete(
    "/schedules/{schedule_id}/panelists/{panelist_id}", status_code=status.HTTP_204_NO_CONTENT
)
def remove_schedule_panelist(
    schedule_id: UUID,
    panelist_id: UUID,
    current_user: CurrentUser,
    service: PanelistServiceDependency,
) -> Response:
    try:
        service.remove_panelist(current_user, schedule_id, panelist_id)
    except (
        PanelistForbiddenError,
        PanelistNotFoundError,
        PanelistConflictError,
        PanelistServiceUnavailableError,
    ) as exc:
        _raise_panelist_http_error(exc)

    return Response(status_code=status.HTTP_204_NO_CONTENT)
