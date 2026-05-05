from __future__ import annotations

from collections.abc import Callable
from typing import Annotated

from fastapi import Depends, HTTPException, Request, status

from model.auth import AppRole, AuthenticatedUser
from usecase.auth import AuthorizationError, ensure_roles


def get_current_user(request: Request) -> AuthenticatedUser:
    current_user = getattr(request.state, "current_user", None)

    if current_user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication required.",
        )

    return current_user


CurrentUser = Annotated[AuthenticatedUser, Depends(get_current_user)]


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
