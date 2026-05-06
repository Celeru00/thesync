from __future__ import annotations

from typing import Annotated, cast
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, Request, status

from controller.dependencies import CurrentUser
from model.notification import (
    NotificationListResponse,
    NotificationMarkAllReadResult,
    NotificationResponse,
)
from usecase.notifications import (
    NotificationConflictError,
    NotificationForbiddenError,
    NotificationNotFoundError,
    NotificationService,
    NotificationServiceUnavailableError,
)

router = APIRouter(prefix="/notifications", tags=["notifications"])


class _UnavailableNotificationService:
    def _raise(self) -> None:
        raise NotificationServiceUnavailableError("Notification service is not configured.")

    def list_notifications(self, *args, **kwargs) -> NotificationListResponse:
        self._raise()

    def mark_read(self, *args, **kwargs) -> NotificationResponse:
        self._raise()

    def mark_all_read(self, *args, **kwargs) -> NotificationMarkAllReadResult:
        self._raise()


_UNAVAILABLE_NOTIFICATION_SERVICE = _UnavailableNotificationService()


def get_notification_service(request: Request) -> NotificationService:
    service = getattr(request.app.state, "notification_service", _UNAVAILABLE_NOTIFICATION_SERVICE)
    return cast(NotificationService, service)


NotificationServiceDependency = Annotated[
    NotificationService,
    Depends(get_notification_service),
]


def _raise_notification_http_error(exc: Exception) -> None:
    if isinstance(exc, NotificationForbiddenError):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail=str(exc)) from exc

    if isinstance(exc, NotificationNotFoundError):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc)) from exc

    if isinstance(exc, NotificationConflictError):
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail=str(exc)) from exc

    if isinstance(exc, NotificationServiceUnavailableError):
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail=str(exc)
        ) from exc


@router.get("", response_model=NotificationListResponse)
def list_notifications(
    current_user: CurrentUser,
    service: NotificationServiceDependency,
    limit: Annotated[int, Query(ge=1, le=100)] = 20,
    offset: Annotated[int, Query(ge=0)] = 0,
) -> NotificationListResponse:
    try:
        return service.list_notifications(current_user, limit, offset)
    except (NotificationForbiddenError, NotificationServiceUnavailableError) as exc:
        _raise_notification_http_error(exc)


@router.patch("/{notification_id}/read", response_model=NotificationResponse)
def mark_notification_read(
    notification_id: UUID,
    current_user: CurrentUser,
    service: NotificationServiceDependency,
) -> NotificationResponse:
    try:
        return service.mark_read(current_user, notification_id)
    except (
        NotificationForbiddenError,
        NotificationNotFoundError,
        NotificationConflictError,
        NotificationServiceUnavailableError,
    ) as exc:
        _raise_notification_http_error(exc)


@router.patch("/read-all", response_model=NotificationMarkAllReadResult)
def mark_all_notifications_read(
    current_user: CurrentUser,
    service: NotificationServiceDependency,
) -> NotificationMarkAllReadResult:
    try:
        return service.mark_all_read(current_user)
    except (
        NotificationForbiddenError,
        NotificationConflictError,
        NotificationServiceUnavailableError,
    ) as exc:
        _raise_notification_http_error(exc)
