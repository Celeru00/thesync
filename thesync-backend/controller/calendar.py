from __future__ import annotations

from datetime import datetime
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Query, status

from controller.dependencies import CurrentUser, require_roles
from model.auth import AuthenticatedUser
from model.calendar import (
    CalendarSyncSummary,
    GoogleCalendarConnectionStatus,
    GoogleCalendarConnectRequest,
    GoogleCalendarEvent,
)
from repository.google_calendar import CalendarSyncConfigurationError
from usecase.calendar import (
    CalendarIntegrationError,
    connect_google_calendar,
    disconnect_google_calendar,
    get_google_calendar_connection_status,
    list_google_calendar_events,
)
from usecase.calendar_sync import CalendarSyncError, sync_google_calendar_updates

router = APIRouter(prefix="/calendar", tags=["calendar"])

AdminUser = Annotated[AuthenticatedUser, Depends(require_roles("admin"))]
OptionalDateTimeQuery = Annotated[datetime | None, Query()]


@router.get("/google/connection", response_model=GoogleCalendarConnectionStatus)
def get_google_calendar_connection(current_user: CurrentUser) -> GoogleCalendarConnectionStatus:
    return get_google_calendar_connection_status(current_user)


@router.post("/google/connect", response_model=GoogleCalendarConnectionStatus)
def connect_google_calendar_account(
    payload: GoogleCalendarConnectRequest,
    current_user: CurrentUser,
) -> GoogleCalendarConnectionStatus:
    try:
        return connect_google_calendar(current_user, payload)
    except CalendarIntegrationError as exc:
        raise HTTPException(status_code=exc.status_code, detail=str(exc)) from exc


@router.delete("/google/connection", response_model=GoogleCalendarConnectionStatus)
def disconnect_google_calendar_account(
    current_user: CurrentUser,
) -> GoogleCalendarConnectionStatus:
    return disconnect_google_calendar(current_user)


@router.get("/google/events", response_model=list[GoogleCalendarEvent])
def get_google_calendar_events(
    current_user: CurrentUser,
    time_min: OptionalDateTimeQuery = None,
    time_max: OptionalDateTimeQuery = None,
) -> list[GoogleCalendarEvent]:
    try:
        return list_google_calendar_events(
            current_user,
            time_min=time_min,
            time_max=time_max,
        )
    except CalendarIntegrationError as exc:
        raise HTTPException(status_code=exc.status_code, detail=str(exc)) from exc


@router.post("/fetch-updates", response_model=CalendarSyncSummary)
def fetch_calendar_updates(current_user: AdminUser) -> CalendarSyncSummary:
    try:
        return sync_google_calendar_updates(current_user)
    except (CalendarSyncConfigurationError, CalendarSyncError) as exc:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(exc),
        ) from exc
