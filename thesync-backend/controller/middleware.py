from __future__ import annotations

from fastapi import Request, status
from fastapi.responses import JSONResponse
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.types import ASGIApp

from repository.auth import (
    AuthConfigurationError,
    AuthenticationError,
    extract_bearer_token,
)
from usecase.auth import authenticate_access_token


class SupabaseAuthMiddleware(BaseHTTPMiddleware):
    """Resolve the current Supabase user from an incoming Bearer token."""

    def __init__(self, app: ASGIApp) -> None:
        super().__init__(app)

    async def dispatch(self, request: Request, call_next):
        request.state.current_user = None
        request.state.supabase_claims = None

        try:
            access_token = extract_bearer_token(request.headers.get("Authorization"))
            if access_token is None:
                return await call_next(request)

            claims, current_user = authenticate_access_token(access_token)
        except AuthenticationError as exc:
            return JSONResponse(
                status_code=status.HTTP_401_UNAUTHORIZED,
                content={"detail": str(exc)},
            )
        except AuthConfigurationError as exc:
            return JSONResponse(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                content={"detail": str(exc)},
            )

        request.state.supabase_claims = claims
        request.state.current_user = current_user
        return await call_next(request)
