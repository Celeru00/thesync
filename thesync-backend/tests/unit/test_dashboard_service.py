from __future__ import annotations

import unittest
from datetime import UTC, datetime
from typing import Literal
from uuid import uuid4

from model.auth import AuthenticatedUser
from model.base import PaginatedResult
from model.notification import NotificationListResponse
from model.schedule import ScheduleListFilters, ScheduleListItem
from usecase.dashboard_service import DefaultDashboardService


def _build_user(*, role_name: Literal["student", "adviser", "admin"]) -> AuthenticatedUser:
    return AuthenticatedUser(
        id=uuid4(),
        role_id=1,
        role_name=role_name,
        full_name=f"{role_name.title()} User",
        email=f"{role_name}@example.com",
        created_at=datetime(2026, 5, 6, 10, 0, tzinfo=UTC),
        app_role=role_name,
    )


def _build_schedule_list_item(
    *,
    adviser_id,
    student_id,
    status_name: str,
    scheduled_at: datetime | None = None,
) -> ScheduleListItem:
    return ScheduleListItem(
        id=uuid4(),
        student_id=student_id,
        adviser_id=adviser_id,
        type_id=1,
        status_id=1,
        topic=f"{status_name.title()} Consultation",
        requested_at=datetime(2026, 5, 6, 10, 0, tzinfo=UTC),
        scheduled_at=scheduled_at,
        created_at=datetime(2026, 5, 6, 10, 0, tzinfo=UTC),
        student_full_name="Student User",
        adviser_full_name="Adviser User",
        type_name="consultation",
        status_name=status_name,
    )


class _FakeScheduleRepository:
    def __init__(self, items: list[ScheduleListItem]) -> None:
        self._items = items

    def list_by_adviser(
        self,
        adviser_id,
        filters: ScheduleListFilters,
    ) -> PaginatedResult[ScheduleListItem]:
        adviser_items = [item for item in self._items if str(item.adviser_id) == str(adviser_id)]
        return PaginatedResult[ScheduleListItem](
            items=adviser_items,
            total=len(adviser_items),
            page=filters.page,
            page_size=filters.limit,
        )


class _FakeNotificationRepository:
    def list_by_user(self, user_id, limit: int, offset: int) -> NotificationListResponse:
        del user_id, limit, offset
        return NotificationListResponse(
            items=[],
            total=0,
            page=1,
            page_size=0,
            total_unread=0,
        )


class DashboardServiceTests(unittest.TestCase):
    def test_adviser_dashboard_counts_rescheduled_as_pending_approval(self) -> None:
        adviser = _build_user(role_name="adviser")
        student_id = uuid4()
        items = [
            _build_schedule_list_item(
                adviser_id=adviser.id,
                student_id=student_id,
                status_name="pending",
                scheduled_at=datetime(2026, 5, 10, 10, 0, tzinfo=UTC),
            ),
            _build_schedule_list_item(
                adviser_id=adviser.id,
                student_id=uuid4(),
                status_name="rescheduled",
                scheduled_at=datetime(2026, 5, 11, 11, 0, tzinfo=UTC),
            ),
            _build_schedule_list_item(
                adviser_id=adviser.id,
                student_id=uuid4(),
                status_name="approved",
                scheduled_at=datetime(2026, 5, 12, 12, 0, tzinfo=UTC),
            ),
        ]
        service = DefaultDashboardService(
            schedule_repository=_FakeScheduleRepository(items),
            notification_repository=_FakeNotificationRepository(),
        )

        response = service.get_adviser_dashboard(adviser)

        self.assertEqual(response.stats.pending_approvals, 2)


if __name__ == "__main__":
    unittest.main()
