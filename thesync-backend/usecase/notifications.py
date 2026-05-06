from __future__ import annotations

from typing import Protocol
from uuid import UUID

from model.auth import AuthenticatedUser
from model.notification import Notification, NotificationMarkAllReadResult


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

    def list_notifications(self, current_user: AuthenticatedUser) -> list[Notification]: ...

    def mark_read(
        self,
        current_user: AuthenticatedUser,
        notification_id: UUID,
    ) -> Notification: ...

    def mark_all_read(
        self,
        current_user: AuthenticatedUser,
    ) -> NotificationMarkAllReadResult: ...
