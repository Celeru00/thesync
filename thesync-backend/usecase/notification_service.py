from __future__ import annotations

from uuid import UUID

from model.auth import AuthenticatedUser
from model.notification import (
    NotificationListResponse,
    NotificationMarkAllReadResult,
    NotificationResponse,
)
from repository.notification_repository import (
    NotificationRepository,
    get_notification_repository,
)
from repository.supabase_client import SupabaseClientConfigurationError
from usecase.notifications import (
    NotificationForbiddenError,
    NotificationNotFoundError,
    NotificationService,
    NotificationServiceUnavailableError,
)


class DefaultNotificationService(NotificationService):
    """Business logic for listing and updating user notifications."""

    def __init__(self, notification_repository: NotificationRepository | None = None) -> None:
        self._notification_repository = notification_repository

    @property
    def notification_repository(self) -> NotificationRepository:
        if self._notification_repository is None:
            try:
                self._notification_repository = get_notification_repository()
            except SupabaseClientConfigurationError as exc:
                raise NotificationServiceUnavailableError(str(exc)) from exc

        return self._notification_repository

    def list_notifications(
        self,
        current_user: AuthenticatedUser,
        limit: int,
        offset: int,
    ) -> NotificationListResponse:
        page = self.notification_repository.list_by_user(current_user.id, limit, offset)
        total_unread = self.notification_repository.count_unread(current_user.id)
        return NotificationListResponse(
            items=page.items,
            total=page.total,
            page=page.page,
            page_size=page.page_size,
            total_unread=total_unread,
        )

    def mark_read(
        self,
        current_user: AuthenticatedUser,
        notification_id: UUID,
    ) -> NotificationResponse:
        notification = self.notification_repository.get_by_id(notification_id)
        if notification is None:
            raise NotificationNotFoundError("Notification was not found.")

        if notification.user_id != current_user.id:
            raise NotificationForbiddenError("You can only mark your own notifications as read.")

        if notification.is_read:
            return NotificationResponse.model_validate(notification)

        updated_notification = self.notification_repository.mark_read(notification_id)
        return NotificationResponse.model_validate(updated_notification)

    def mark_all_read(
        self,
        current_user: AuthenticatedUser,
    ) -> NotificationMarkAllReadResult:
        updated_count = self.notification_repository.mark_all_read(current_user.id)
        return NotificationMarkAllReadResult(updated_count=updated_count)
