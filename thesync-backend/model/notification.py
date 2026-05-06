from __future__ import annotations

from datetime import datetime
from uuid import UUID

from pydantic import NonNegativeInt, field_validator

from model.base import DomainModel, NonEmptyText, normalize_optional_text


class Notification(DomainModel):
    """User-facing notification emitted by schedule events."""

    id: UUID
    user_id: UUID
    schedule_id: UUID | None = None
    message: NonEmptyText
    is_read: bool = False
    created_at: datetime

    @field_validator("message", mode="before")
    @classmethod
    def normalize_message(cls, value: str) -> str:
        normalized = normalize_optional_text(value)
        if normalized is None:
            raise ValueError("message must not be empty.")

        return normalized


class NotificationResponse(Notification):
    """Notification response shape returned by the API."""


class NotificationListResponse(DomainModel):
    """Paginated notification response including unread totals."""

    items: list[NotificationResponse]
    total: NonNegativeInt
    page: NonNegativeInt
    page_size: NonNegativeInt
    total_unread: NonNegativeInt = 0


class NotificationMarkAllReadResult(DomainModel):
    """Result of marking notifications as read in bulk."""

    updated_count: NonNegativeInt = 0
