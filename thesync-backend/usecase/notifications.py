from __future__ import annotations

from typing import Protocol
from uuid import UUID

from model.auth import AuthenticatedUser
from model.notification import (
    NotificationListResponse,
    NotificationMarkAllReadResult,
    NotificationResponse,
)


class NotificationServiceError(RuntimeError):
    """Base exception for notification service failures."""


class NotificationForbiddenError(NotificationServiceError):
    """Raised when the caller cannot access the requested notification."""


class NotificationNotFoundError(NotificationServiceError):
    """Raised when the requested notification cannot be found."""


class NotificationConflictError(NotificationServiceError):
    """Raised when the notification update conflicts with existing state."""


class NotificationServiceUnavailableError(NotificationServiceError):
    """Raised when the notification service dependency is not configured."""


class NotificationService(Protocol):
    """Use-case contract for user notification operations."""

    def list_notifications(
        self,
        current_user: AuthenticatedUser,
        limit: int,
        offset: int,
    ) -> NotificationListResponse: ...

    def mark_read(
        self,
        current_user: AuthenticatedUser,
        notification_id: UUID,
    ) -> NotificationResponse: ...

    def mark_all_read(
        self,
        current_user: AuthenticatedUser,
    ) -> NotificationMarkAllReadResult: ...
