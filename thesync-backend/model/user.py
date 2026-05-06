from __future__ import annotations

from datetime import datetime
from uuid import UUID

from pydantic import EmailStr, Field, PositiveInt, field_validator

from model.base import DomainModel, NonEmptyText, normalize_optional_text


class User(DomainModel):
    """Domain and API representation of a system user."""

    id: UUID
    role_id: PositiveInt
    role_name: NonEmptyText | None = None
    full_name: NonEmptyText
    email: EmailStr
    avatar_url: str | None = None
    identifier: NonEmptyText | None = None
    degree_program: NonEmptyText | None = None
    department: NonEmptyText | None = None
    created_at: datetime

    @field_validator("email", mode="after")
    @classmethod
    def normalize_email(cls, value: EmailStr) -> str:
        return value.lower()

    @field_validator("avatar_url", mode="before")
    @classmethod
    def normalize_avatar_url(cls, value: str | None) -> str | None:
        return normalize_optional_text(value)

    @field_validator("identifier", "degree_program", "department", mode="before")
    @classmethod
    def normalize_optional_profile_fields(cls, value: str | None) -> str | None:
        return normalize_optional_text(value)


class UserResponse(User):
    """Expanded user response returned by API-facing models."""


class ReportsResult(DomainModel):
    """Aggregated metrics used by the admin dashboard."""

    total_consultations: int = 0
    total_defenses: int = 0
    approval_rate: float = 0.0
    avg_time_to_approval_hours: float | None = None
    by_status: dict[str, int] = Field(default_factory=dict)
    by_day_of_week: dict[str, int] = Field(default_factory=dict)
