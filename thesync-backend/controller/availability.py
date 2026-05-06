from __future__ import annotations

from datetime import date, datetime
from typing import Annotated, cast
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, Request, Response, status

from controller.dependencies import CurrentUser
from model.availability import (
    AvailabilitySlot,
    AvailabilitySlotBlockedUpdateRequest,
    AvailabilitySlotCreateRequest,
)
from usecase.availability import (
    AvailabilityConflictError,
    AvailabilityForbiddenError,
    AvailabilityNotFoundError,
    AvailabilityService,
    AvailabilityServiceUnavailableError,
    AvailabilityValidationError,
)

router = APIRouter(prefix="/availability", tags=["availability"])


class _UnavailableAvailabilityService:
    def _raise(self) -> None:
        raise AvailabilityServiceUnavailableError("Availability service is not configured.")

    def create_slot(self, *args, **kwargs) -> AvailabilitySlot:
        self._raise()

    def list_slots(self, *args, **kwargs) -> list[AvailabilitySlot]:
        self._raise()

    def get_free_slots(self, *args, **kwargs) -> list[AvailabilitySlot]:
        self._raise()

    def toggle_blocked(self, *args, **kwargs) -> AvailabilitySlot:
        self._raise()

    def delete_slot(self, *args, **kwargs) -> None:
        self._raise()


_UNAVAILABLE_AVAILABILITY_SERVICE = _UnavailableAvailabilityService()


def get_availability_service(request: Request) -> AvailabilityService:
    service = getattr(request.app.state, "availability_service", _UNAVAILABLE_AVAILABILITY_SERVICE)
    return cast(AvailabilityService, service)


AvailabilityServiceDependency = Annotated[AvailabilityService, Depends(get_availability_service)]


def _raise_availability_http_error(exc: Exception) -> None:
    if isinstance(exc, AvailabilityValidationError):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc)) from exc

    if isinstance(exc, AvailabilityForbiddenError):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail=str(exc)) from exc

    if isinstance(exc, AvailabilityNotFoundError):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc)) from exc

    if isinstance(exc, AvailabilityConflictError):
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail=str(exc)) from exc

    if isinstance(exc, AvailabilityServiceUnavailableError):
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail=str(exc)
        ) from exc


@router.post("", response_model=AvailabilitySlot, status_code=status.HTTP_201_CREATED)
def create_availability_slot(
    payload: AvailabilitySlotCreateRequest,
    current_user: CurrentUser,
    service: AvailabilityServiceDependency,
) -> AvailabilitySlot:
    try:
        return service.create_slot(current_user, payload)
    except (
        AvailabilityValidationError,
        AvailabilityForbiddenError,
        AvailabilityNotFoundError,
        AvailabilityConflictError,
        AvailabilityServiceUnavailableError,
    ) as exc:
        _raise_availability_http_error(exc)


@router.get("", response_model=list[AvailabilitySlot])
def list_availability_slots(
    current_user: CurrentUser,
    service: AvailabilityServiceDependency,
) -> list[AvailabilitySlot]:
    try:
        return service.list_slots(current_user)
    except (AvailabilityForbiddenError, AvailabilityServiceUnavailableError) as exc:
        _raise_availability_http_error(exc)


@router.get("/{adviser_id}", response_model=list[AvailabilitySlot])
def get_adviser_free_slots(
    adviser_id: UUID,
    current_user: CurrentUser,
    service: AvailabilityServiceDependency,
    day: Annotated[date | datetime | None, Query(alias="date")] = None,
) -> list[AvailabilitySlot]:
    try:
        return service.get_free_slots(current_user, adviser_id, day)
    except (
        AvailabilityForbiddenError,
        AvailabilityNotFoundError,
        AvailabilityServiceUnavailableError,
    ) as exc:
        _raise_availability_http_error(exc)


@router.patch("/{availability_id}", response_model=AvailabilitySlot)
def toggle_availability_slot_blocked(
    availability_id: UUID,
    payload: AvailabilitySlotBlockedUpdateRequest,
    current_user: CurrentUser,
    service: AvailabilityServiceDependency,
) -> AvailabilitySlot:
    try:
        return service.toggle_blocked(current_user, availability_id, payload)
    except (
        AvailabilityValidationError,
        AvailabilityForbiddenError,
        AvailabilityNotFoundError,
        AvailabilityConflictError,
        AvailabilityServiceUnavailableError,
    ) as exc:
        _raise_availability_http_error(exc)


@router.delete("/{availability_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_availability_slot(
    availability_id: UUID,
    current_user: CurrentUser,
    service: AvailabilityServiceDependency,
) -> Response:
    try:
        service.delete_slot(current_user, availability_id)
    except (
        AvailabilityForbiddenError,
        AvailabilityNotFoundError,
        AvailabilityConflictError,
        AvailabilityServiceUnavailableError,
    ) as exc:
        _raise_availability_http_error(exc)

    return Response(status_code=status.HTTP_204_NO_CONTENT)
