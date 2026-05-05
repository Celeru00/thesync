from __future__ import annotations

from datetime import datetime
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


class PanelistAssignment(DomainModel):
    """Assignment of a panelist to a schedule."""

    id: UUID
    schedule_id: UUID
    panelist_id: UUID
    invite_status_id: PositiveInt


class AvailabilitySlot(DomainModel):
    """Time window made available by an adviser."""

    id: UUID
    adviser_id: UUID
    slot_start: datetime
    slot_end: datetime
    is_blocked: bool = False

    @model_validator(mode="after")
    def validate_time_range(self) -> AvailabilitySlot:
        if self.slot_end <= self.slot_start:
            raise ValueError("slot_end must be later than slot_start.")

        return self


class Notification(DomainModel):
    """User-facing notification emitted by schedule events."""

    id: UUID
    user_id: UUID
    schedule_id: UUID | None = None
    message: NonEmptyText
    is_read: bool = False
    created_at: datetime


class AuditLog(DomainModel):
    """Immutable schedule status transition record."""

    id: UUID
    schedule_id: UUID
    changed_by: UUID
    previous_status_id: PositiveInt | None = None
    new_status_id: PositiveInt
    remarks: str | None = None
    changed_at: datetime

    @field_validator("remarks", mode="before")
    @classmethod
    def normalize_remarks(cls, value: str | None) -> str | None:
        return normalize_optional_text(value)
