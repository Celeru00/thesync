from __future__ import annotations

from typing import Any, Literal
from uuid import UUID

from pydantic import EmailStr, Field

from model.base import DomainModel
from model.user import User

AppRole = Literal["student", "adviser", "admin"]


def normalize_app_role_name(value: str) -> AppRole | None:
    normalized = value.strip().lower()

    if normalized == "advisor":
        return "adviser"

    if normalized in {"student", "adviser", "admin"}:
        return normalized

    return None


class SupabaseClaims(DomainModel):
    """Verified claims extracted from a Supabase access token."""

    iss: str
    aud: str | list[str]
    exp: int
    iat: int
    sub: UUID
    role: str
    aal: str | None = None
    session_id: UUID | None = None
    email: EmailStr | None = None
    phone: str | None = None
    is_anonymous: bool | None = None
    app_metadata: dict[str, Any] = Field(default_factory=dict)
    user_metadata: dict[str, Any] = Field(default_factory=dict)


class AuthenticatedUser(User):
    """Application user resolved from a verified Supabase session."""

    app_role: AppRole
