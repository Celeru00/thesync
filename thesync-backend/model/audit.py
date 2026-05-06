from __future__ import annotations

from datetime import datetime
from uuid import UUID

from pydantic import PositiveInt, field_validator

from model.base import DomainModel, NonEmptyText, normalize_optional_text
from model.user import UserResponse


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


class AuditLogResponse(DomainModel):
    """Expanded audit log returned by the API."""

    id: UUID
    changed_by: UserResponse
    previous_status: NonEmptyText | None = None
    new_status: NonEmptyText
    remarks: str | None = None
    changed_at: datetime

    @field_validator("remarks", mode="before")
    @classmethod
    def normalize_response_remarks(cls, value: str | None) -> str | None:
        return normalize_optional_text(value)
