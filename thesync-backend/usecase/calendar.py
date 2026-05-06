from __future__ import annotations

from datetime import UTC, datetime

from sqlalchemy import select

from model.auth import AuthenticatedUser
from model.calendar import (
    GoogleCalendarConnectionStatus,
    GoogleCalendarConnectRequest,
    GoogleCalendarEvent,
)
from repository.database import SessionLocal
from repository.google_calendar import (
    CalendarSyncConfigurationError,
    GoogleCalendarApiError,
    GoogleCalendarClient,
)
from repository.orm import GoogleCalendarConnectionRecord


class CalendarIntegrationError(RuntimeError):
    """Raised when the user's Google Calendar integration cannot be completed."""

    def __init__(self, message: str, *, status_code: int = 400) -> None:
        super().__init__(message)
        self.status_code = status_code


def _translate_calendar_api_error(exc: GoogleCalendarApiError) -> CalendarIntegrationError:
    if exc.api_reason in {"SERVICE_DISABLED", "accessNotConfigured"} or (
        exc.service == "calendar-json.googleapis.com"
    ):
        return CalendarIntegrationError(
            "Google Calendar API is not enabled for the configured Google Cloud project. "
            "Enable the Google Calendar API, wait a few minutes, then try again.",
            status_code=503,
        )

    if exc.http_status == 403:
        return CalendarIntegrationError(
            "Google Calendar access was denied. Reconnect your Google Calendar and try again.",
            status_code=502,
        )

    return CalendarIntegrationError(
        "We couldn't fetch your Google Calendar right now. Please try again.",
        status_code=502,
    )


def _load_connection(session, user_id):
    return session.execute(
        select(GoogleCalendarConnectionRecord).where(
            GoogleCalendarConnectionRecord.user_id == user_id
        )
    ).scalar_one_or_none()


def _to_connection_status(
    record: GoogleCalendarConnectionRecord | None,
) -> GoogleCalendarConnectionStatus:
    if record is None:
        return GoogleCalendarConnectionStatus(connected=False)

    return GoogleCalendarConnectionStatus(
        connected=True,
        google_email=record.google_email,
        calendar_id=record.calendar_id,
        connected_at=record.connected_at,
        updated_at=record.updated_at,
    )


def get_google_calendar_connection_status(
    current_user: AuthenticatedUser,
) -> GoogleCalendarConnectionStatus:
    with SessionLocal() as session:
        record = _load_connection(session, current_user.id)
        return _to_connection_status(record)


def connect_google_calendar(
    current_user: AuthenticatedUser,
    payload: GoogleCalendarConnectRequest,
) -> GoogleCalendarConnectionStatus:
    with SessionLocal() as session:
        record = _load_connection(session, current_user.id)
        now = datetime.now(UTC)

        if record is None:
            record = GoogleCalendarConnectionRecord(
                user_id=current_user.id,
                google_email=str(payload.google_email),
                calendar_id=payload.calendar_id,
                access_token=payload.provider_access_token,
                refresh_token=payload.provider_refresh_token,
                token_type=payload.token_type,
                scopes=payload.scopes,
                token_expires_at=now,
                connected_at=now,
                updated_at=now,
            )
            session.add(record)
        else:
            record.google_email = str(payload.google_email)
            record.calendar_id = payload.calendar_id
            record.access_token = payload.provider_access_token
            record.refresh_token = payload.provider_refresh_token
            record.token_type = payload.token_type
            record.scopes = payload.scopes
            record.token_expires_at = now
            record.updated_at = now

        session.commit()
        session.refresh(record)
        return _to_connection_status(record)


def disconnect_google_calendar(current_user: AuthenticatedUser) -> GoogleCalendarConnectionStatus:
    with SessionLocal() as session:
        record = _load_connection(session, current_user.id)
        if record is not None:
            session.delete(record)
            session.commit()

    return GoogleCalendarConnectionStatus(connected=False)


def list_google_calendar_events(
    current_user: AuthenticatedUser,
    *,
    time_min: datetime | None = None,
    time_max: datetime | None = None,
) -> list[GoogleCalendarEvent]:
    with SessionLocal() as session:
        record = _load_connection(session, current_user.id)
        if record is None:
            raise CalendarIntegrationError(
                "Connect your Google Calendar before viewing calendar events.",
                status_code=409,
            )

        client = GoogleCalendarClient(record)
        try:
            remote_events = client.list_events(time_min=time_min, time_max=time_max)
        except CalendarSyncConfigurationError as exc:
            raise CalendarIntegrationError(
                "Google Calendar integration is not configured on the server.",
                status_code=503,
            ) from exc
        except GoogleCalendarApiError as exc:
            raise _translate_calendar_api_error(exc) from exc

        session.commit()
        return [
            GoogleCalendarEvent(
                event_id=event.event_id,
                summary=event.summary,
                status=event.status or "confirmed",
                starts_at=event.starts_at,
                ends_at=event.ends_at,
                html_link=event.html_link,
                meet_link=event.meet_link,
            )
            for event in remote_events
        ]
