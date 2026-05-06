from __future__ import annotations

from typing import Any
from uuid import UUID, uuid4

from model.base import PaginatedResult
from model.notification import Notification
from repository.supabase_client import get_supabase_admin_client

NOTIFICATION_SELECT = "id, user_id, schedule_id, message, is_read, created_at"


class NotificationRepositoryNotFoundError(LookupError):
    """Raised when the requested notification does not exist."""


def _first_row(data: Any) -> dict[str, Any] | None:
    if isinstance(data, dict):
        return data

    if isinstance(data, list):
        for row in data:
            if isinstance(row, dict):
                return row

    return None


def _rows(data: Any) -> list[dict[str, Any]]:
    if isinstance(data, dict):
        return [data]

    if isinstance(data, list):
        return [row for row in data if isinstance(row, dict)]

    return []


def _to_notification(row: dict[str, Any]) -> Notification:
    return Notification.model_validate(
        {
            "id": row.get("id"),
            "user_id": row.get("user_id"),
            "schedule_id": row.get("schedule_id"),
            "message": row.get("message"),
            "is_read": row.get("is_read"),
            "created_at": row.get("created_at"),
        }
    )


class NotificationRepository:
    """Supabase-backed repository for raw notification queries."""

    def __init__(self, client: Any | None = None) -> None:
        self._client = client or get_supabase_admin_client()

    def _get_by_id(self, notification_id: UUID | str) -> Notification | None:
        response = (
            self._client.table("notifications")
            .select(NOTIFICATION_SELECT)
            .eq("id", str(notification_id))
            .execute()
        )
        row = _first_row(response.data)

        if row is None:
            return None

        return _to_notification(row)

    def create(
        self,
        user_id: UUID,
        schedule_id: UUID | None,
        message: str,
    ) -> Notification:
        notification_id = uuid4()
        payload = {
            "id": str(notification_id),
            "user_id": str(user_id),
            "schedule_id": str(schedule_id) if schedule_id is not None else None,
            "message": message,
        }
        response = self._client.table("notifications").insert(payload).execute()
        row = _first_row(response.data)

        if row is not None:
            return _to_notification(row)

        notification = self._get_by_id(notification_id)
        if notification is None:
            raise NotificationRepositoryNotFoundError("Created notification could not be reloaded.")

        return notification

    def list_by_user(
        self,
        user_id: UUID | str,
        limit: int,
        offset: int,
    ) -> PaginatedResult[Notification]:
        response = (
            self._client.table("notifications")
            .select(NOTIFICATION_SELECT, count="exact")
            .eq("user_id", str(user_id))
            .order("created_at", desc=True)
            .range(offset, offset + limit - 1)
            .execute()
        )
        rows = _rows(response.data)
        total = getattr(response, "count", None)
        page = (offset // limit) + 1 if limit > 0 else 1

        return PaginatedResult[Notification](
            items=[_to_notification(row) for row in rows],
            total=total if isinstance(total, int) and total >= 0 else len(rows),
            page=page,
            page_size=limit,
        )

    def mark_read(self, notification_id: UUID | str) -> Notification:
        if self._get_by_id(notification_id) is None:
            raise NotificationRepositoryNotFoundError("Notification was not found.")

        response = (
            self._client.table("notifications")
            .update({"is_read": True})
            .eq("id", str(notification_id))
            .execute()
        )
        row = _first_row(response.data)

        if row is not None:
            return _to_notification(row)

        notification = self._get_by_id(notification_id)
        if notification is None:
            raise NotificationRepositoryNotFoundError("Notification was not found.")

        return notification

    def mark_all_read(self, user_id: UUID | str) -> int:
        unread_count_response = (
            self._client.table("notifications")
            .select("id", count="exact")
            .eq("user_id", str(user_id))
            .eq("is_read", False)
            .execute()
        )
        unread_count = getattr(unread_count_response, "count", None)
        updated_count = (
            unread_count
            if isinstance(unread_count, int) and unread_count >= 0
            else len(_rows(unread_count_response.data))
        )

        if updated_count == 0:
            return 0

        self._client.table("notifications").update({"is_read": True}).eq(
            "user_id", str(user_id)
        ).eq("is_read", False).execute()
        return updated_count


def get_notification_repository() -> NotificationRepository:
    return NotificationRepository()
