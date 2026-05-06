from __future__ import annotations

from collections.abc import Callable
from typing import Annotated

from fastapi import Depends, HTTPException, Request, Security, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer

from model.auth import AppRole, AuthenticatedUser, SupabaseClaims
from usecase.auth import AuthorizationError, ensure_roles

bearer_scheme = HTTPBearer(
    auto_error=False,
    description=("Paste a Supabase access token as a Bearer token to test protected endpoints."),
)


def get_current_user(
    request: Request,
    credentials: Annotated[HTTPAuthorizationCredentials | None, Security(bearer_scheme)] = None,
) -> AuthenticatedUser:
    current_user = getattr(request.state, "current_user", None)

    if current_user is None and credentials is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication required.",
        )

    if current_user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication required.",
        )

    return current_user


CurrentUser = Annotated[AuthenticatedUser, Depends(get_current_user)]


def get_current_claims(
    request: Request,
    credentials: Annotated[HTTPAuthorizationCredentials | None, Security(bearer_scheme)] = None,
) -> SupabaseClaims:
    current_claims = getattr(request.state, "supabase_claims", None)

    if current_claims is None and credentials is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication required.",
        )

    if current_claims is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication required.",
        )

    return current_claims


CurrentClaims = Annotated[SupabaseClaims, Depends(get_current_claims)]


def require_roles(*allowed_roles: AppRole) -> Callable[[CurrentUser], AuthenticatedUser]:
    allowed = set(allowed_roles)

    def dependency(current_user: CurrentUser) -> AuthenticatedUser:
        try:
            return ensure_roles(current_user, allowed)
        except AuthorizationError as exc:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=str(exc),
            ) from exc

    return dependency
