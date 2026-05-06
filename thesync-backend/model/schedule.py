from __future__ import annotations

from datetime import date, datetime
from uuid import UUID

from pydantic import PositiveInt, field_validator, model_validator

from model.base import DomainModel, NonEmptyText, normalize_optional_text


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

    status_id: PositiveInt | None = None
    type_id: PositiveInt | None = None
    from_date: date | datetime | None = None
    to_date: date | datetime | None = None
    page: PositiveInt = 1
    page_size: PositiveInt = 20


class ScheduleCreateRequest(DomainModel):
    """Payload for creating a schedule request."""

    adviser_id: UUID
    type_id: PositiveInt
    topic: NonEmptyText
    scheduled_at: datetime | None = None


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
