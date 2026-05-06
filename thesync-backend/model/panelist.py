from __future__ import annotations

from enum import StrEnum
from uuid import UUID

from pydantic import PositiveInt

from model.base import DomainModel
from model.user import UserResponse


class InviteStatusEnum(StrEnum):
    invited = "invited"
    accepted = "accepted"
    declined = "declined"


class PanelistAssignmentCreateRequest(DomainModel):
    """Payload for assigning a panelist to a schedule."""

    panelist_id: UUID


class PanelistRespondRequest(DomainModel):
    """Payload for a panelist responding to an invite."""

    response: InviteStatusEnum


class PanelistAssignment(DomainModel):
    """Assignment of a panelist to a schedule at the data/domain layer."""

    id: UUID
    schedule_id: UUID
    panelist_id: UUID
    invite_status_id: PositiveInt


class PanelistAssignmentResponse(DomainModel):
    """Expanded panelist assignment returned by the API."""

    id: UUID
    schedule_id: UUID
    panelist: UserResponse
    invite_status: InviteStatusEnum


PanelistInviteResponseRequest = PanelistRespondRequest
