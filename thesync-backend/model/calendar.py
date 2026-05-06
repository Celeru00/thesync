from __future__ import annotations

from datetime import datetime

from pydantic import ConfigDict, EmailStr, field_validator

from model.base import DomainModel, NonEmptyText, normalize_optional_text


class CalendarSyncSummary(DomainModel):
    """Summary of a Google Calendar reconciliation run."""

    total: int = 0
    updated: int = 0
    cancelled: int = 0
    not_found: int = 0
    errors: int = 0


class GoogleCalendarConnectionStatus(DomainModel):
    """Connection state for a user's Google Calendar integration."""

    connected: bool
    google_email: EmailStr | None = None
    calendar_id: str | None = None
    connected_at: datetime | None = None
    updated_at: datetime | None = None


class GoogleCalendarConnectRequest(DomainModel):
    """Payload used to store Google provider tokens for a user."""

    provider_access_token: NonEmptyText
    provider_refresh_token: NonEmptyText
    calendar_id: NonEmptyText = "primary"
    google_email: EmailStr
    token_type: str | None = None
    scopes: str | None = None

    @field_validator("token_type", "scopes", mode="before")
    @classmethod
    def normalize_optional_strings(cls, value: str | None) -> str | None:
        return normalize_optional_text(value)


class GoogleCalendarEvent(DomainModel):
    """Normalized Google Calendar event payload for the frontend."""

    model_config = ConfigDict(extra="ignore")

    event_id: NonEmptyText
    summary: str | None = None
    status: NonEmptyText
    starts_at: datetime | None = None
    ends_at: datetime | None = None
    html_link: str | None = None
    meet_link: str | None = None

    @field_validator("summary", "html_link", "meet_link", mode="before")
    @classmethod
    def normalize_text_fields(cls, value: str | None) -> str | None:
        return normalize_optional_text(value)
