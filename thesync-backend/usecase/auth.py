from __future__ import annotations

from model.auth import AppRole, AuthenticatedUser, SupabaseClaims
from repository.auth import get_authenticated_user


class AuthorizationError(RuntimeError):
    """Raised when an authenticated user lacks the required application role."""


def authenticate_access_token(access_token: str) -> tuple[SupabaseClaims, AuthenticatedUser]:
    return get_authenticated_user(access_token)


def ensure_roles(current_user: AuthenticatedUser, allowed_roles: set[AppRole]) -> AuthenticatedUser:
    if current_user.app_role not in allowed_roles:
        raise AuthorizationError("You do not have permission to perform this action.")

    return current_user
