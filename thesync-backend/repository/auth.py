from __future__ import annotations

from functools import lru_cache

import jwt
from jwt import PyJWKClient
from jwt.exceptions import InvalidTokenError, PyJWKClientError
from sqlalchemy import select
from sqlalchemy.orm import joinedload

from model.auth import (
    AuthenticatedUser,
    SupabaseClaims,
    is_registration_completed,
    normalize_app_role_name,
)
from repository.config import get_settings
from repository.database import SessionLocal
from repository.orm import UserRecord


class AuthConfigurationError(RuntimeError):
    """Raised when the backend auth layer is not configured correctly."""


class AuthenticationError(RuntimeError):
    """Raised when an incoming access token cannot be trusted."""


def extract_bearer_token(authorization: str | None) -> str | None:
    if authorization is None:
        return None

    scheme, _, token = authorization.partition(" ")

    if scheme.lower() != "bearer" or not token.strip():
        raise AuthenticationError("Authorization header must use the Bearer scheme.")

    return token.strip()


@lru_cache
def get_jwks_client() -> PyJWKClient:
    settings = get_settings()

    if not settings.supabase_url:
        raise AuthConfigurationError(
            "SUPABASE_URL is required for JWT verification when SUPABASE_JWT_SECRET is not set."
        )

    jwks_url = f"{settings.supabase_url.rstrip('/')}/auth/v1/.well-known/jwks.json"
    return PyJWKClient(jwks_url)


def decode_supabase_access_token(access_token: str) -> SupabaseClaims:
    settings = get_settings()

    if not settings.supabase_url and not settings.supabase_jwt_secret:
        raise AuthConfigurationError(
            "Configure SUPABASE_URL or SUPABASE_JWT_SECRET before enabling auth middleware."
        )

    issuer = f"{settings.supabase_url.rstrip('/')}/auth/v1" if settings.supabase_url else None
    decode_kwargs = {
        "algorithms": ["HS256"] if settings.supabase_jwt_secret else ["RS256", "ES256"],
        "audience": settings.supabase_jwt_audience,
        "options": {"require": ["sub", "exp", "iat"]},
    }

    if issuer:
        decode_kwargs["issuer"] = issuer

    try:
        if settings.supabase_jwt_secret:
            payload = jwt.decode(access_token, settings.supabase_jwt_secret, **decode_kwargs)
        else:
            signing_key = get_jwks_client().get_signing_key_from_jwt(access_token)
            payload = jwt.decode(access_token, signing_key.key, **decode_kwargs)
    except (InvalidTokenError, PyJWKClientError) as exc:
        raise AuthenticationError("Invalid or expired Supabase access token.") from exc

    claims = SupabaseClaims.model_validate(payload)

    if claims.role != settings.supabase_jwt_audience:
        raise AuthenticationError("Only authenticated user access tokens are accepted.")

    return claims


def get_authenticated_user(access_token: str) -> tuple[SupabaseClaims, AuthenticatedUser]:
    claims = decode_supabase_access_token(access_token)

    if not is_registration_completed(claims.user_metadata):
        raise AuthenticationError("Authenticated account has not completed registration.")

    with SessionLocal() as session:
        statement = (
            select(UserRecord)
            .options(joinedload(UserRecord.role))
            .where(UserRecord.id == claims.sub)
        )
        user_record = session.execute(statement).unique().scalar_one_or_none()

    if user_record is None:
        raise AuthenticationError("Authenticated account is not provisioned in the application.")

    app_role = normalize_app_role_name(user_record.role.name)

    if app_role is None:
        raise AuthenticationError("Authenticated account has an unsupported application role.")

    current_user = AuthenticatedUser.model_validate(
        {
            "id": user_record.id,
            "role_id": user_record.role_id,
            "full_name": user_record.full_name,
            "email": user_record.email,
            "avatar_url": user_record.avatar_url,
            "created_at": user_record.created_at,
            "app_role": app_role,
        }
    )

    return claims, current_user
