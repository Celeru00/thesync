from __future__ import annotations

import json
from dataclasses import dataclass
from datetime import UTC, datetime, timedelta
from typing import Any
from urllib.error import HTTPError, URLError
from urllib.parse import quote, urlencode
from urllib.request import Request, urlopen
from uuid import uuid4

from repository.config import Settings, get_settings
from repository.orm import GoogleCalendarConnectionRecord

GOOGLE_CALENDAR_API_BASE_URL = "https://www.googleapis.com/calendar/v3"
GoogleCalendarAttendee = dict[str, str]


def _debug_log(event: str, **fields: object) -> None:
    payload = " ".join(f"{key}={value!r}" for key, value in fields.items())
    print(f"[calendar-sync] {event} {payload}".strip(), flush=True)


class CalendarSyncConfigurationError(RuntimeError):
    """Raised when Google Calendar sync is not configured correctly."""


class GoogleCalendarApiError(RuntimeError):
    """Raised when the Google Calendar API cannot be queried successfully."""

    def __init__(
        self,
        message: str,
        *,
        http_status: int | None = None,
        api_reason: str | None = None,
        service: str | None = None,
        response_body: str | None = None,
    ) -> None:
        super().__init__(message)
        self.http_status = http_status
        self.api_reason = api_reason
        self.service = service
        self.response_body = response_body


class GoogleCalendarEventNotFound(GoogleCalendarApiError):
    """Raised when the linked Google Calendar event no longer exists."""


@dataclass(slots=True)
class GoogleCalendarRemoteEvent:
    event_id: str
    summary: str | None
    status: str | None
    starts_at: datetime | None
    ends_at: datetime | None
    html_link: str | None
    meet_link: str | None


def _parse_datetime_value(value: str | None) -> datetime | None:
    if not value:
        return None

    normalized = value.replace("Z", "+00:00")
    parsed = datetime.fromisoformat(normalized)

    if parsed.tzinfo is None:
        return parsed.replace(tzinfo=UTC)

    return parsed


def _extract_event_datetime(payload: dict[str, Any], field_name: str) -> datetime | None:
    container = payload.get(field_name)
    if not isinstance(container, dict):
        return None

    if isinstance(container.get("dateTime"), str):
        return _parse_datetime_value(container["dateTime"])

    if isinstance(container.get("date"), str):
        return _parse_datetime_value(f"{container['date']}T00:00:00+00:00")

    return None


def _extract_meet_link(payload: dict[str, Any]) -> str | None:
    hangout_link = payload.get("hangoutLink")
    if isinstance(hangout_link, str) and hangout_link.strip():
        return hangout_link.strip()

    conference_data = payload.get("conferenceData")
    if not isinstance(conference_data, dict):
        return None

    entry_points = conference_data.get("entryPoints")
    if not isinstance(entry_points, list):
        return None

    for entry in entry_points:
        if not isinstance(entry, dict):
            continue

        uri = entry.get("uri")
        if isinstance(uri, str) and uri.strip():
            return uri.strip()

    return None


def _build_remote_event(payload: dict[str, Any]) -> GoogleCalendarRemoteEvent:
    event_id = payload.get("id")
    if not isinstance(event_id, str) or not event_id.strip():
        raise GoogleCalendarApiError("Google Calendar returned an event without an id.")

    summary = payload.get("summary")
    status = payload.get("status")
    html_link = payload.get("htmlLink")

    return GoogleCalendarRemoteEvent(
        event_id=event_id.strip(),
        summary=summary.strip() if isinstance(summary, str) and summary.strip() else None,
        status=status.strip() if isinstance(status, str) and status.strip() else None,
        starts_at=_extract_event_datetime(payload, "start"),
        ends_at=_extract_event_datetime(payload, "end"),
        html_link=html_link.strip() if isinstance(html_link, str) and html_link.strip() else None,
        meet_link=_extract_meet_link(payload),
    )


def _parse_google_error_response(exc: HTTPError) -> tuple[str, str, str | None, str | None]:
    body = exc.read().decode("utf-8", errors="ignore")
    message = body.strip() or f"HTTP {exc.code}"
    api_reason = None
    service = None

    try:
        payload = json.loads(body)
    except json.JSONDecodeError:
        return body, message, api_reason, service

    error_payload = payload.get("error")
    if not isinstance(error_payload, dict):
        return body, message, api_reason, service

    error_message = error_payload.get("message")
    if isinstance(error_message, str) and error_message.strip():
        message = error_message.strip()

    errors = error_payload.get("errors")
    if isinstance(errors, list):
        for error in errors:
            if not isinstance(error, dict):
                continue

            reason = error.get("reason")
            if isinstance(reason, str) and reason.strip():
                api_reason = reason.strip()
                break

    details = error_payload.get("details")
    if isinstance(details, list):
        for detail in details:
            if not isinstance(detail, dict):
                continue

            reason = detail.get("reason")
            if isinstance(reason, str) and reason.strip():
                api_reason = reason.strip()

            metadata = detail.get("metadata")
            if isinstance(metadata, dict):
                detail_service = metadata.get("service")
                if isinstance(detail_service, str) and detail_service.strip():
                    service = detail_service.strip()

            if api_reason and service:
                break

    return body, message, api_reason, service


def _raise_google_api_error(exc: HTTPError, path: str) -> None:
    response_body, message, api_reason, service = _parse_google_error_response(exc)
    raise GoogleCalendarApiError(
        f"Google Calendar API returned {exc.code} for {path}: {message}".strip(),
        http_status=exc.code,
        api_reason=api_reason,
        service=service,
        response_body=response_body or None,
    ) from exc


class GoogleCalendarClient:
    """Google Calendar client backed by per-user OAuth tokens."""

    def __init__(
        self,
        connection: GoogleCalendarConnectionRecord,
        settings: Settings | None = None,
    ) -> None:
        self._settings = settings or get_settings()
        self._connection = connection

    def _ensure_configured(self) -> None:
        if (
            not self._settings.google_oauth_client_id
            or not self._settings.google_oauth_client_secret
        ):
            raise CalendarSyncConfigurationError(
                "GOOGLE_OAUTH_CLIENT_ID and GOOGLE_OAUTH_CLIENT_SECRET are required for "
                "Google Calendar integration."
            )

    def _refresh_access_token(self) -> str:
        self._ensure_configured()
        request_body = urlencode(
            {
                "client_id": self._settings.google_oauth_client_id,
                "client_secret": self._settings.google_oauth_client_secret,
                "refresh_token": self._connection.refresh_token,
                "grant_type": "refresh_token",
            }
        ).encode("utf-8")
        request = Request(
            self._settings.google_oauth_token_uri,
            data=request_body,
            headers={"Content-Type": "application/x-www-form-urlencoded"},
            method="POST",
        )

        try:
            with urlopen(request, timeout=15) as response:  # nosec B310
                payload = json.loads(response.read().decode("utf-8"))
        except HTTPError as exc:
            reason = exc.read().decode("utf-8", errors="ignore")
            raise GoogleCalendarApiError(
                f"Unable to refresh the Google Calendar access token: {exc.code} {reason}".strip()
            ) from exc
        except URLError as exc:
            raise GoogleCalendarApiError(
                "Unable to reach Google OAuth while refreshing the Calendar access token."
            ) from exc

        access_token = payload.get("access_token")
        expires_in = payload.get("expires_in")
        token_type = payload.get("token_type")
        scope = payload.get("scope")

        if not isinstance(access_token, str) or not access_token:
            raise GoogleCalendarApiError(
                "Google OAuth did not return an access token for calendar access."
            )

        if not isinstance(expires_in, int):
            expires_in = 3600

        self._connection.access_token = access_token
        self._connection.token_expires_at = datetime.now(UTC) + timedelta(seconds=expires_in)
        self._connection.updated_at = datetime.now(UTC)

        if isinstance(token_type, str) and token_type.strip():
            self._connection.token_type = token_type.strip()

        if isinstance(scope, str) and scope.strip():
            self._connection.scopes = scope.strip()

        _debug_log(
            "access_token_refreshed",
            user_id=str(self._connection.user_id),
            google_email=self._connection.google_email,
            expires_at=(
                self._connection.token_expires_at.isoformat()
                if self._connection.token_expires_at
                else None
            ),
        )
        return self._connection.access_token

    def _get_valid_access_token(self) -> str:
        now = datetime.now(UTC)

        if (
            self._connection.access_token
            and self._connection.token_expires_at
            and now < self._connection.token_expires_at - timedelta(seconds=60)
        ):
            return self._connection.access_token

        return self._refresh_access_token()

    def _request_json(
        self,
        path: str,
        *,
        query: dict[str, str] | None = None,
        method: str = "GET",
        body: dict[str, Any] | None = None,
    ) -> dict[str, Any]:
        access_token = self._get_valid_access_token()
        request_url = (
            f"{GOOGLE_CALENDAR_API_BASE_URL}/calendars/"
            f"{quote(self._connection.calendar_id, safe='')}/{path}"
        )

        if query:
            request_url = f"{request_url}?{urlencode(query)}"

        request_body = json.dumps(body).encode("utf-8") if body is not None else None

        def build_request(token: str) -> Request:
            headers = {
                "Authorization": f"Bearer {token}",
                "Accept": "application/json",
            }
            if request_body is not None:
                headers["Content-Type"] = "application/json"

            return Request(
                request_url,
                data=request_body,
                headers=headers,
                method=method,
            )

        request = build_request(access_token)

        try:
            with urlopen(request, timeout=15) as response:  # nosec B310
                return json.loads(response.read().decode("utf-8"))
        except HTTPError as exc:
            if exc.code in {401, 403}:
                self._refresh_access_token()
                retry_request = build_request(self._connection.access_token)
                try:
                    with urlopen(retry_request, timeout=15) as response:  # nosec B310
                        return json.loads(response.read().decode("utf-8"))
                except HTTPError as retry_exc:
                    if retry_exc.code in {404, 410}:
                        raise GoogleCalendarEventNotFound(
                            f"Google Calendar resource {path} was not found."
                        ) from retry_exc

                    _raise_google_api_error(retry_exc, path)

            if exc.code in {404, 410}:
                raise GoogleCalendarEventNotFound(
                    f"Google Calendar resource {path} was not found."
                ) from exc

            _raise_google_api_error(exc, path)
        except URLError as exc:
            raise GoogleCalendarApiError(
                f"Unable to reach Google Calendar while requesting {path}."
            ) from exc

    def list_events(
        self,
        *,
        time_min: datetime | None = None,
        time_max: datetime | None = None,
    ) -> list[GoogleCalendarRemoteEvent]:
        base_query = {
            "singleEvents": "true",
            "orderBy": "startTime",
            "maxResults": "250",
        }
        if time_min is not None:
            base_query["timeMin"] = time_min.astimezone(UTC).isoformat()
        if time_max is not None:
            base_query["timeMax"] = time_max.astimezone(UTC).isoformat()

        items: list[dict[str, Any]] = []
        next_page_token: str | None = None

        while True:
            query = dict(base_query)
            if next_page_token:
                query["pageToken"] = next_page_token

            payload = self._request_json("events", query=query)
            page_items = payload.get("items")
            if not isinstance(page_items, list):
                raise GoogleCalendarApiError("Google Calendar returned an invalid events payload.")

            items.extend(item for item in page_items if isinstance(item, dict))
            raw_next_page_token = payload.get("nextPageToken")
            if not isinstance(raw_next_page_token, str) or not raw_next_page_token.strip():
                break

            next_page_token = raw_next_page_token.strip()

        events = [_build_remote_event(item) for item in items]
        _debug_log(
            "events_listed",
            user_id=str(self._connection.user_id),
            calendar_id=self._connection.calendar_id,
            count=len(events),
        )
        return events

    def get_event(self, event_id: str) -> GoogleCalendarRemoteEvent:
        payload = self._request_json(f"events/{quote(event_id, safe='')}")
        event = _build_remote_event(payload)
        _debug_log(
            "event_fetched",
            user_id=str(self._connection.user_id),
            calendar_id=self._connection.calendar_id,
            event_id=event.event_id,
            status=event.status,
        )
        return event

    def create_event(
        self,
        *,
        summary: str,
        starts_at: datetime,
        ends_at: datetime,
        description: str | None = None,
        attendees: list[GoogleCalendarAttendee] | None = None,
    ) -> GoogleCalendarRemoteEvent:
        payload_body: dict[str, Any] = {
            "summary": summary,
            "description": description,
            "start": {"dateTime": starts_at.astimezone(UTC).isoformat()},
            "end": {"dateTime": ends_at.astimezone(UTC).isoformat()},
            "conferenceData": {
                "createRequest": {
                    "requestId": str(uuid4()),
                    "conferenceSolutionKey": {"type": "hangoutsMeet"},
                }
            },
        }
        if attendees:
            payload_body["attendees"] = attendees

        payload = self._request_json(
            "events",
            method="POST",
            query={"conferenceDataVersion": "1"},
            body=payload_body,
        )
        event = _build_remote_event(payload)
        _debug_log(
            "event_created",
            user_id=str(self._connection.user_id),
            calendar_id=self._connection.calendar_id,
            event_id=event.event_id,
        )
        return event

    def update_event(
        self,
        event_id: str,
        *,
        summary: str,
        starts_at: datetime,
        ends_at: datetime,
        description: str | None = None,
        attendees: list[GoogleCalendarAttendee] | None = None,
    ) -> GoogleCalendarRemoteEvent:
        payload_body: dict[str, Any] = {
            "summary": summary,
            "description": description,
            "start": {"dateTime": starts_at.astimezone(UTC).isoformat()},
            "end": {"dateTime": ends_at.astimezone(UTC).isoformat()},
        }
        if attendees:
            payload_body["attendees"] = attendees

        payload = self._request_json(
            f"events/{quote(event_id, safe='')}",
            method="PATCH",
            query={"conferenceDataVersion": "1"},
            body=payload_body,
        )
        event = _build_remote_event(payload)
        _debug_log(
            "event_updated",
            user_id=str(self._connection.user_id),
            calendar_id=self._connection.calendar_id,
            event_id=event.event_id,
        )
        return event
