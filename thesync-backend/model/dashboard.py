from __future__ import annotations

from datetime import datetime
from typing import Literal
from uuid import UUID

from pydantic import NonNegativeInt

from model.base import DomainModel, NonEmptyText

DashboardActivityType = Literal["approved", "notification", "completed"]


class DashboardSessionItem(DomainModel):
    """Shared schedule summary used by dashboard views."""

    id: UUID
    title: NonEmptyText
    counterpart_name: NonEmptyText
    scheduled_at: datetime
    ends_at: datetime
    status_name: NonEmptyText
    type_name: NonEmptyText


class DashboardActivityItem(DomainModel):
    """Recent dashboard activity entry derived from notifications."""

    id: UUID
    activity_type: DashboardActivityType
    title: NonEmptyText
    message: NonEmptyText
    created_at: datetime


class StudentDashboardStats(DomainModel):
    upcoming_sessions: NonNegativeInt = 0
    pending_requests: NonNegativeInt = 0
    completed: NonNegativeInt = 0
    total_hours: NonNegativeInt = 0


class StudentDashboardResponse(DomainModel):
    current_user_name: NonEmptyText
    stats: StudentDashboardStats
    upcoming_sessions: list[DashboardSessionItem]
    recent_activity: list[DashboardActivityItem]


class AdviserDashboardStats(DomainModel):
    pending_approvals: NonNegativeInt = 0
    todays_sessions: NonNegativeInt = 0
    active_advisees: NonNegativeInt = 0
    this_month: NonNegativeInt = 0


class AdviserDashboardResponse(DomainModel):
    current_user_name: NonEmptyText
    stats: AdviserDashboardStats
    upcoming_sessions: list[DashboardSessionItem]
    recent_activity: list[DashboardActivityItem]
