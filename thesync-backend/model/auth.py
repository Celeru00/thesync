from __future__ import annotations

from typing import Any, Literal
from uuid import UUID

from pydantic import ConfigDict, EmailStr, Field, PositiveInt

from model.base import DomainModel, NonEmptyText
from model.user import User

AppRole = Literal["student", "adviser", "admin"]
SignupRole = Literal["student", "adviser"]
AuthFlow = Literal["login", "signup"]


def normalize_app_role_name(value: str) -> AppRole | None:
    normalized = value.strip().lower()

    if normalized == "advisor":
        return "adviser"

    if normalized in {"student", "adviser", "admin"}:
        return normalized

    return None


class SupabaseClaims(DomainModel):
    """Verified claims extracted from a Supabase access token."""

    model_config = ConfigDict(extra="allow")

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


class ApplicationUserState(DomainModel):
    """Backend view of a provisioned application user."""

    id: UUID
    role_id: PositiveInt
    registration_completed: bool
    app_role: AppRole | None = None


class AuthInitializeRequest(DomainModel):
    flow: AuthFlow
    requested_role: AppRole | None = None


class AuthInitializeResponse(DomainModel):
    action: Literal["redirect", "register"]
    redirect_to: str | None = None
    register_role: SignupRole | None = None


class CompleteRegistrationRequest(DomainModel):
    role: SignupRole
    full_name: NonEmptyText
    email: EmailStr
    avatar_url: str | None = None
    identifier: NonEmptyText
    department: NonEmptyText
