from __future__ import annotations

from datetime import UTC, date, datetime, timedelta
from typing import Final

from model.auth import AuthenticatedUser
from model.dashboard import (
    AdviserDashboardResponse,
    AdviserDashboardStats,
    DashboardActivityItem,
    DashboardActivityType,
    DashboardSessionItem,
    StudentDashboardResponse,
    StudentDashboardStats,
)
from model.schedule import ScheduleListFilters, ScheduleListItem
from repository.notification_repository import NotificationRepository, get_notification_repository
from repository.schedule_repository import ScheduleRepository, get_schedule_repository
from repository.supabase_client import SupabaseClientConfigurationError
from usecase.dashboard import (
    DashboardForbiddenError,
    DashboardService,
    DashboardServiceUnavailableError,
)

STUDENT_ROLE_NAME: Final[str] = "student"
ADVISER_ROLE_NAME: Final[str] = "adviser"
UPCOMING_SESSION_STATUSES: Final[set[str]] = {"approved", "pending", "rescheduled"}
PENDING_APPROVAL_STATUSES: Final[set[str]] = {"pending", "rescheduled"}
ACTIVE_ADVISEE_EXCLUDED_STATUSES: Final[set[str]] = {"cancelled", "rejected"}
TODAYS_SESSION_STATUSES: Final[set[str]] = {"approved", "rescheduled"}
MONTHLY_SESSION_EXCLUDED_STATUSES: Final[set[str]] = {"cancelled", "rejected"}
DEFAULT_SESSION_DURATION = timedelta(hours=1)
DASHBOARD_PAGE_SIZE = 200
RECENT_ACTIVITY_LIMIT = 3


def _normalize_datetime(value: datetime | None) -> datetime | None:
    if value is None:
        return None

    if value.tzinfo is None:
        return value.replace(tzinfo=UTC)

    return value.astimezone(UTC)


def _normalized_status_name(schedule: ScheduleListItem) -> str:
    return schedule.status_name.strip().lower()


def _activity_metadata(message: str) -> tuple[DashboardActivityType, str]:
    normalized = message.strip().lower()

    if "approved" in normalized:
        return "approved", "Request Approved"

    if "completed" in normalized:
        return "completed", "Session Completed"

    if "cancel" in normalized:
        return "notification", "Schedule Cancelled"

    if "resched" in normalized:
        return "notification", "Schedule Rescheduled"

    if "reject" in normalized:
        return "notification", "Request Rejected"

    if "submitted" in normalized or "new schedule request" in normalized:
        return "notification", "New Request"

    return "notification", "New Notification"


class DefaultDashboardService(DashboardService):
    """Builds student and adviser dashboard data from repository reads."""

    def __init__(
        self,
        schedule_repository: ScheduleRepository | None = None,
        notification_repository: NotificationRepository | None = None,
    ) -> None:
        self._schedule_repository = schedule_repository
        self._notification_repository = notification_repository

    @property
    def schedule_repository(self) -> ScheduleRepository:
        if self._schedule_repository is None:
            try:
                self._schedule_repository = get_schedule_repository()
            except SupabaseClientConfigurationError as exc:
                raise DashboardServiceUnavailableError(str(exc)) from exc

        return self._schedule_repository

    @property
    def notification_repository(self) -> NotificationRepository:
        if self._notification_repository is None:
            try:
                self._notification_repository = get_notification_repository()
            except SupabaseClientConfigurationError as exc:
                raise DashboardServiceUnavailableError(str(exc)) from exc

        return self._notification_repository

    def _require_role(self, current_user: AuthenticatedUser, expected_role: str) -> None:
        if current_user.app_role != expected_role:
            raise DashboardForbiddenError(f"Only {expected_role}s can access this dashboard.")

    def _fetch_all_student_schedules(
        self, current_user: AuthenticatedUser
    ) -> list[ScheduleListItem]:
        return self._fetch_all_schedules(
            lambda filters: self.schedule_repository.list_by_student(current_user.id, filters)
        )

    def _fetch_all_adviser_schedules(
        self, current_user: AuthenticatedUser
    ) -> list[ScheduleListItem]:
        return self._fetch_all_schedules(
            lambda filters: self.schedule_repository.list_by_adviser(current_user.id, filters)
        )

    def _fetch_all_schedules(self, fetch_page) -> list[ScheduleListItem]:
        page = 1
        items: list[ScheduleListItem] = []

        while True:
            response = fetch_page(ScheduleListFilters(page=page, limit=DASHBOARD_PAGE_SIZE))
            items.extend(response.items)

            if not response.items or len(items) >= response.total:
                break

            page += 1

        return items

    def _build_upcoming_sessions(
        self,
        schedules: list[ScheduleListItem],
        *,
        counterpart_name_getter,
        now: datetime,
        limit: int | None = 3,
    ) -> list[DashboardSessionItem]:
        upcoming: list[DashboardSessionItem] = []

        for schedule in schedules:
            scheduled_at = _normalize_datetime(schedule.scheduled_at)
            if scheduled_at is None or scheduled_at < now:
                continue

            if _normalized_status_name(schedule) not in UPCOMING_SESSION_STATUSES:
                continue

            upcoming.append(
                DashboardSessionItem(
                    id=schedule.id,
                    title=schedule.topic,
                    counterpart_name=counterpart_name_getter(schedule),
                    scheduled_at=scheduled_at,
                    ends_at=scheduled_at + DEFAULT_SESSION_DURATION,
                    status_name=schedule.status_name,
                    type_name=schedule.type_name,
                )
            )

        upcoming.sort(key=lambda item: item.scheduled_at)

        if limit is None:
            return upcoming

        return upcoming[:limit]

    def _build_recent_activity(
        self, current_user: AuthenticatedUser
    ) -> list[DashboardActivityItem]:
        notifications = self.notification_repository.list_by_user(
            current_user.id,
            RECENT_ACTIVITY_LIMIT,
            0,
        ).items

        activity_items: list[DashboardActivityItem] = []
        for notification in notifications:
            activity_type, title = _activity_metadata(notification.message)
            activity_items.append(
                DashboardActivityItem(
                    id=notification.id,
                    activity_type=activity_type,
                    title=title,
                    message=notification.message,
                    created_at=_normalize_datetime(notification.created_at) or datetime.now(tz=UTC),
                )
            )

        return activity_items

    def get_student_dashboard(
        self,
        current_user: AuthenticatedUser,
    ) -> StudentDashboardResponse:
        self._require_role(current_user, STUDENT_ROLE_NAME)

        now = datetime.now(tz=UTC)
        schedules = self._fetch_all_student_schedules(current_user)

        completed_count = 0
        pending_requests = 0
        total_hours = 0

        for schedule in schedules:
            status_name = _normalized_status_name(schedule)
            if status_name == "completed":
                completed_count += 1

            if status_name == "pending":
                pending_requests += 1

            if status_name in {"approved", "completed", "rescheduled"} and schedule.scheduled_at:
                total_hours += 1

        all_upcoming_sessions = self._build_upcoming_sessions(
            schedules,
            counterpart_name_getter=lambda schedule: schedule.adviser_full_name,
            now=now,
            limit=None,
        )
        upcoming_sessions = all_upcoming_sessions[:3]

        return StudentDashboardResponse(
            current_user_name=current_user.full_name,
            stats=StudentDashboardStats(
                upcoming_sessions=len(all_upcoming_sessions),
                pending_requests=pending_requests,
                completed=completed_count,
                total_hours=total_hours,
            ),
            upcoming_sessions=upcoming_sessions,
            recent_activity=self._build_recent_activity(current_user),
        )

    def get_adviser_dashboard(
        self,
        current_user: AuthenticatedUser,
    ) -> AdviserDashboardResponse:
        self._require_role(current_user, ADVISER_ROLE_NAME)

        now = datetime.now(tz=UTC)
        today = now.date()
        month_start = date(today.year, today.month, 1)
        schedules = self._fetch_all_adviser_schedules(current_user)

        pending_approvals = 0
        todays_sessions = 0
        active_advisee_ids: set[str] = set()
        this_month = 0

        for schedule in schedules:
            status_name = _normalized_status_name(schedule)
            scheduled_at = _normalize_datetime(schedule.scheduled_at)

            if status_name in PENDING_APPROVAL_STATUSES:
                pending_approvals += 1

            if status_name not in ACTIVE_ADVISEE_EXCLUDED_STATUSES:
                active_advisee_ids.add(str(schedule.student_id))

            if (
                scheduled_at is not None
                and scheduled_at.date() == today
                and status_name in TODAYS_SESSION_STATUSES
            ):
                todays_sessions += 1

            if (
                scheduled_at is not None
                and status_name not in MONTHLY_SESSION_EXCLUDED_STATUSES
                and scheduled_at.date() >= month_start
                and scheduled_at.year == today.year
                and scheduled_at.month == today.month
            ):
                this_month += 1

        upcoming_sessions = self._build_upcoming_sessions(
            schedules,
            counterpart_name_getter=lambda schedule: schedule.student_full_name,
            now=now,
        )

        return AdviserDashboardResponse(
            current_user_name=current_user.full_name,
            stats=AdviserDashboardStats(
                pending_approvals=pending_approvals,
                todays_sessions=todays_sessions,
                active_advisees=len(active_advisee_ids),
                this_month=this_month,
            ),
            upcoming_sessions=upcoming_sessions,
            recent_activity=self._build_recent_activity(current_user),
        )
