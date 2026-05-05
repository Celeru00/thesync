from __future__ import annotations

from datetime import datetime
from uuid import UUID

from pydantic import EmailStr, PositiveInt, field_validator

from model.base import DomainModel, NonEmptyText, normalize_optional_text


class User(DomainModel):
    """Domain and API representation of a system user."""

    id: UUID
    role_id: PositiveInt
    full_name: NonEmptyText
    email: EmailStr
    avatar_url: str | None = None
    created_at: datetime

    @field_validator("email", mode="after")
    @classmethod
    def normalize_email(cls, value: EmailStr) -> str:
        return value.lower()

    @field_validator("avatar_url", mode="before")
    @classmethod
    def normalize_avatar_url(cls, value: str | None) -> str | None:
        return normalize_optional_text(value)
