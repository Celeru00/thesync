from __future__ import annotations

from datetime import datetime, time, timedelta
from uuid import UUID

from pydantic import Field, field_validator, model_validator

from model.base import DomainModel, NonEmptyText

BOOKING_INCREMENT_MINUTES = 30
MINIMUM_BOOKABLE_DURATION = timedelta(hours=1)
LAST_ALLOWED_WEEKDAY = 4


class AvailabilitySlotCreateRequest(DomainModel):
    """Payload for creating a recurring adviser availability rule."""

    day_of_week: int = Field(ge=0)
    start_time: time
    end_time: time
    is_blocked: bool = False

    @field_validator("start_time", "end_time", mode="after")
    @classmethod
    def validate_time_alignment(cls, value: time) -> time:
        total_minutes = value.hour * 60 + value.minute
        if total_minutes % BOOKING_INCREMENT_MINUTES != 0 or value.second or value.microsecond:
            raise ValueError(
                f"Availability times must use {BOOKING_INCREMENT_MINUTES}-minute increments."
            )

        return value

    @field_validator("day_of_week", mode="after")
    @classmethod
    def validate_weekday_range(cls, value: int) -> int:
        if value > LAST_ALLOWED_WEEKDAY:
            raise ValueError("Availability can only be set from Monday to Friday.")

        return value

    @model_validator(mode="after")
    def validate_time_range(self) -> AvailabilitySlotCreateRequest:
        if self.end_time <= self.start_time:
            raise ValueError("end_time must be later than start_time.")

        if not self.is_blocked:
            start_minutes = self.start_time.hour * 60 + self.start_time.minute
            end_minutes = self.end_time.hour * 60 + self.end_time.minute
            if end_minutes - start_minutes < int(MINIMUM_BOOKABLE_DURATION.total_seconds() // 60):
                raise ValueError("Available windows must be at least 60 minutes long.")

        return self


class AvailabilitySlotPatchRequest(DomainModel):
    """Payload for toggling whether an availability rule is blocked."""

    is_blocked: bool


class AvailabilitySlotResponse(DomainModel):
    """Recurring adviser availability rule returned by the API and repositories."""

    id: UUID
    adviser_id: UUID
    day_of_week: int = Field(ge=0)
    start_time: time
    end_time: time
    is_blocked: bool = False

    @field_validator("day_of_week", mode="after")
    @classmethod
    def validate_weekday_range(cls, value: int) -> int:
        if value > LAST_ALLOWED_WEEKDAY:
            raise ValueError("Availability can only be set from Monday to Friday.")

        return value

    @model_validator(mode="after")
    def validate_time_range(self) -> AvailabilitySlotResponse:
        if self.end_time <= self.start_time:
            raise ValueError("end_time must be later than start_time.")

        return self


class AvailabilityConcreteSlotResponse(DomainModel):
    """Concrete date-specific slot produced from recurring adviser rules."""

    id: NonEmptyText
    adviser_id: UUID
    slot_start: datetime
    slot_end: datetime
    is_blocked: bool = False
    source_rule_id: UUID | None = None

    @model_validator(mode="after")
    def validate_time_range(self) -> AvailabilityConcreteSlotResponse:
        if self.slot_end <= self.slot_start:
            raise ValueError("slot_end must be later than slot_start.")

        return self


AvailabilityRule = AvailabilitySlotResponse
AvailabilitySlot = AvailabilityConcreteSlotResponse
AvailabilitySlotBlockedUpdateRequest = AvailabilitySlotPatchRequest
