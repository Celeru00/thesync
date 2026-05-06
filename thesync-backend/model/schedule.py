from __future__ import annotations

from datetime import date, datetime
from uuid import UUID

from pydantic import Field, NonNegativeInt, PositiveInt, field_validator, model_validator

from model.base import DomainModel, NonEmptyText, normalize_optional_text


class UserSummary(DomainModel):
    """Minimal user fields embedded inside a ScheduleDetail response."""

    id: UUID
    full_name: NonEmptyText


class PanelistDetail(DomainModel):
    """Panelist assignment entry with resolved names (for ScheduleDetail)."""

    id: UUID
    panelist_id: UUID
    full_name: NonEmptyText
    invite_status: NonEmptyText


class ScheduleDetail(DomainModel):
    """Full schedule detail response for GET /schedules/{id} (THE-55).

    Differences from Schedule:
    - student/adviser are embedded UserSummary objects instead of raw UUIDs
    - type and status are resolved name strings
    - panelist_assignments contains resolved names
    - meet_link is only populated when status == approved
    - google_calendar_event_id is only populated for admin/adviser callers
    """

    id: UUID
    topic: NonEmptyText
    student: UserSummary
    adviser: UserSummary
    type: NonEmptyText
    status: NonEmptyText
    requested_at: datetime
    scheduled_at: datetime | None = None
    meet_link: str | None = None
    google_calendar_event_id: str | None = None
    panelist_assignments: list[PanelistDetail]
    created_at: datetime


class Schedule(DomainModel):
    """Domain and API representation of a schedule request."""

    id: UUID
    student_id: UUID
    adviser_id: UUID
    type_id: PositiveInt
    status_id: PositiveInt
    topic: NonEmptyText
    requested_at: datetime
    scheduled_at: datetime | None = None
    google_calendar_event_id: str | None = None
    meet_link: str | None = None
    created_at: datetime

    @field_validator("google_calendar_event_id", "meet_link", mode="before")
    @classmethod
    def normalize_optional_strings(cls, value: str | None) -> str | None:
        return normalize_optional_text(value)

    @model_validator(mode="after")
    def validate_users(self) -> Schedule:
        if self.student_id == self.adviser_id:
            raise ValueError("student_id and adviser_id must reference different users.")

        return self


class ScheduleListFilters(DomainModel):
    """Filters and pagination for schedule list queries."""

    status_name: str | None = Field(default=None, alias="status")
    type_name: str | None = Field(default=None, alias="type")
    status_id: PositiveInt | None = None
    type_id: PositiveInt | None = None
    from_date: date | datetime | None = Field(default=None, alias="from")
    to_date: date | datetime | None = Field(default=None, alias="to")
    page: PositiveInt = 1
    limit: PositiveInt = 20

    @field_validator("status_name", "type_name", mode="before")
    @classmethod
    def normalize_optional_filters(cls, value: str | None) -> str | None:
        return normalize_optional_text(value)


class ScheduleListItem(Schedule):
    """Expanded schedule row returned by list endpoints."""

    student_full_name: NonEmptyText
    adviser_full_name: NonEmptyText
    type_name: NonEmptyText
    status_name: NonEmptyText


class ScheduleListResponse(DomainModel):
    """Paginated schedule list response."""

    items: list[ScheduleListItem]
    total: NonNegativeInt
    page: PositiveInt
    limit: PositiveInt


class ScheduleCreateRequest(DomainModel):
    """Payload for creating a schedule request."""

    adviser_id: UUID
    type_id: PositiveInt
    topic: NonEmptyText
    scheduled_at: datetime


class ScheduleApproveRequest(DomainModel):
    """Payload for approving a schedule."""

    scheduled_at: datetime | None = None


class ScheduleRejectRequest(DomainModel):
    """Payload for rejecting a schedule."""

    remarks: str | None = None

    @field_validator("remarks", mode="before")
    @classmethod
    def normalize_rejection_remarks(cls, value: str | None) -> str | None:
        return normalize_optional_text(value)


class ScheduleRescheduleRequest(DomainModel):
    """Payload for rescheduling a schedule."""

    scheduled_at: datetime
    remarks: str | None = None

    @field_validator("remarks", mode="before")
    @classmethod
    def normalize_reschedule_remarks(cls, value: str | None) -> str | None:
        return normalize_optional_text(value)
