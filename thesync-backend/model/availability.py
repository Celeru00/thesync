from __future__ import annotations

from datetime import datetime
from uuid import UUID

from pydantic import model_validator

from model.base import DomainModel


class AvailabilitySlotCreateRequest(DomainModel):
    """Payload for creating an adviser availability slot."""

    slot_start: datetime
    slot_end: datetime
    is_blocked: bool = False

    @model_validator(mode="after")
    def validate_time_range(self) -> AvailabilitySlotCreateRequest:
        if self.slot_end <= self.slot_start:
            raise ValueError("slot_end must be later than slot_start.")

        return self


class AvailabilitySlotPatchRequest(DomainModel):
    """Payload for toggling whether an availability slot is blocked."""

    is_blocked: bool


class AvailabilitySlotResponse(DomainModel):
    """Availability slot returned by the API and repositories."""

    id: UUID
    adviser_id: UUID
    slot_start: datetime
    slot_end: datetime
    is_blocked: bool = False

    @model_validator(mode="after")
    def validate_time_range(self) -> AvailabilitySlotResponse:
        if self.slot_end <= self.slot_start:
            raise ValueError("slot_end must be later than slot_start.")

        return self


AvailabilitySlot = AvailabilitySlotResponse
AvailabilitySlotBlockedUpdateRequest = AvailabilitySlotPatchRequest
