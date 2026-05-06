from __future__ import annotations

from functools import lru_cache
from uuid import UUID

import jwt
from jwt import PyJWKClient
from jwt.exceptions import InvalidTokenError, PyJWKClientError
from pydantic import ValidationError
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError, SQLAlchemyError
from sqlalchemy.orm import joinedload

from model.auth import (
    ApplicationUserState,
    AppRole,
    AuthenticatedUser,
    SignupRole,
    SupabaseClaims,
    normalize_app_role_name,
)
from repository.config import get_settings
from repository.database import SessionLocal
from repository.orm import UserRecord

PENDING_EMAIL_DOMAIN = "@pending.local"
ROLE_ID_BY_APP_ROLE: dict[AppRole, int] = {
    "student": 1,
    "adviser": 2,
    "admin": 3,
}


def _debug_log(event: str, **fields: object) -> None:
    payload = " ".join(f"{key}={value!r}" for key, value in fields.items())
    print(f"[backend-auth] {event} {payload}".strip(), flush=True)


class AuthConfigurationError(RuntimeError):
    """Raised when the backend auth layer is not configured correctly."""


class AuthenticationError(RuntimeError):
    """Raised when an incoming access token cannot be trusted."""


class ProvisioningError(RuntimeError):
    """Raised when an application user cannot be provisioned or completed."""


class AuthServiceUnavailableError(RuntimeError):
    """Raised when the auth layer cannot reach its persistence dependencies."""


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
    supabase_url = settings.resolved_supabase_url

    if not supabase_url:
        raise AuthConfigurationError(
            "SUPABASE_URL is required for JWT verification when SUPABASE_JWT_SECRET is not set."
        )

    jwks_url = f"{supabase_url}/auth/v1/.well-known/jwks.json"
    return PyJWKClient(jwks_url)


def decode_supabase_access_token(access_token: str) -> SupabaseClaims:
    settings = get_settings()
    supabase_url = settings.resolved_supabase_url

    if not supabase_url and not settings.supabase_jwt_secret:
        raise AuthConfigurationError(
            "Configure SUPABASE_URL or SUPABASE_JWT_SECRET before enabling auth middleware."
        )

    try:
        token_header = jwt.get_unverified_header(access_token)
    except InvalidTokenError as exc:
        _debug_log("token_header_invalid", reason=repr(exc))
        raise AuthenticationError("Invalid or expired Supabase access token.") from exc

    algorithm = str(token_header.get("alg", "")).upper()
    _debug_log(
        "token_decode_start",
        algorithm=algorithm,
        has_supabase_url=bool(supabase_url),
        has_jwt_secret=bool(settings.supabase_jwt_secret),
        audience=settings.supabase_jwt_audience,
    )
    decode_kwargs = {
        "audience": settings.supabase_jwt_audience,
        "leeway": settings.supabase_jwt_leeway_seconds,
        "options": {"require": ["sub", "exp", "iat"]},
    }

    try:
        if algorithm.startswith("HS"):
            if not settings.supabase_jwt_secret:
                _debug_log("token_decode_missing_hs_secret")
                raise AuthConfigurationError(
                    "SUPABASE_JWT_SECRET is required because this Supabase project "
                    "is using a legacy symmetric signing key."
                )

            _debug_log("token_decode_using_hs_secret", algorithm=algorithm)
            decode_kwargs["algorithms"] = [algorithm]
            payload = jwt.decode(access_token, settings.supabase_jwt_secret, **decode_kwargs)
        else:
            if not supabase_url:
                _debug_log("token_decode_missing_supabase_url", algorithm=algorithm)
                raise AuthConfigurationError(
                    "SUPABASE_URL is required for JWT verification when "
                    "asymmetric signing keys are in use."
                )

            _debug_log("token_decode_using_jwks", algorithm=algorithm, supabase_url=supabase_url)
            decode_kwargs["algorithms"] = ["RS256", "ES256"]
            decode_kwargs["issuer"] = f"{supabase_url}/auth/v1"
            signing_key = get_jwks_client().get_signing_key_from_jwt(access_token)
            payload = jwt.decode(access_token, signing_key.key, **decode_kwargs)
    except (InvalidTokenError, PyJWKClientError) as exc:
        _debug_log("token_decode_failed", algorithm=algorithm, reason=repr(exc))
        raise AuthenticationError("Invalid or expired Supabase access token.") from exc

    try:
        claims = SupabaseClaims.model_validate(payload)
    except ValidationError as exc:
        _debug_log("token_claims_invalid", reason=repr(exc))
        raise AuthenticationError("Invalid or expired Supabase access token.") from exc

    _debug_log("token_decode_success", user_id=str(claims.sub), role=claims.role)

    if claims.role != settings.supabase_jwt_audience:
        raise AuthenticationError("Only authenticated user access tokens are accepted.")

    return claims


def _normalize_optional_text(value: str | None) -> str | None:
    if value is None:
        return None

    normalized = value.strip()
    return normalized or None


def _normalize_optional_email(value: str | None) -> str | None:
    normalized = _normalize_optional_text(value)
    return normalized.lower() if normalized else None


def _get_metadata_value(claims: SupabaseClaims, *keys: str) -> str | None:
    for key in keys:
        value = claims.user_metadata.get(key)
        if isinstance(value, str):
            normalized = _normalize_optional_text(value)
            if normalized:
                return normalized

    return None


def _resolve_full_name(claims: SupabaseClaims) -> str | None:
    return (
        _get_metadata_value(claims, "full_name", "name")
        or _get_metadata_value(claims, "given_name")
        or _normalize_optional_email(claims.email)
    )


def _resolve_email(claims: SupabaseClaims) -> str | None:
    return _normalize_optional_email(claims.email)


def _resolve_avatar_url(claims: SupabaseClaims) -> str | None:
    return _get_metadata_value(claims, "avatar_url", "picture")


def _raise_auth_storage_unavailable(exc: Exception) -> None:
    raise AuthServiceUnavailableError(
        "Authentication services are temporarily unavailable. "
        "Check database connectivity and try again."
    ) from exc


def _load_user_record(user_id: UUID, *, with_role: bool = False) -> UserRecord | None:
    try:
        with SessionLocal() as session:
            statement = select(UserRecord).where(UserRecord.id == user_id)
            if with_role:
                statement = statement.options(joinedload(UserRecord.role))

            return session.execute(statement).unique().scalar_one_or_none()
    except SQLAlchemyError as exc:
        _debug_log("user_record_load_failed", user_id=str(user_id), reason=repr(exc))
        _raise_auth_storage_unavailable(exc)


def _to_application_user_state(user_record: UserRecord) -> ApplicationUserState:
    app_role = normalize_app_role_name(user_record.role.name) if user_record.role else None

    return ApplicationUserState.model_validate(
        {
            "id": user_record.id,
            "role_id": user_record.role_id,
            "registration_completed": user_record.registration_completed,
            "app_role": app_role,
        }
    )


def _to_authenticated_user(user_record: UserRecord) -> AuthenticatedUser:
    if user_record.role is None:
        raise AuthenticationError("Authenticated account has an unresolved application role.")

    app_role = normalize_app_role_name(user_record.role.name)

    if app_role is None:
        raise AuthenticationError("Authenticated account has an unsupported application role.")

    return AuthenticatedUser.model_validate(
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


def _ensure_user_record(session, claims: SupabaseClaims) -> UserRecord:
    statement = select(UserRecord).where(UserRecord.id == claims.sub)
    user_record = session.execute(statement).scalar_one_or_none()
    resolved_full_name = _resolve_full_name(claims) or str(claims.sub)
    resolved_email = _resolve_email(claims) or f"{claims.sub}{PENDING_EMAIL_DOMAIN}"
    resolved_avatar_url = _resolve_avatar_url(claims)

    if user_record is None:
        user_record = UserRecord(
            id=claims.sub,
            role_id=ROLE_ID_BY_APP_ROLE["student"],
            full_name=resolved_full_name,
            email=resolved_email,
            avatar_url=resolved_avatar_url,
            registration_completed=False,
        )
        session.add(user_record)
        session.flush()
        return user_record

    if user_record.full_name == str(user_record.id):
        user_record.full_name = resolved_full_name

    if user_record.email.endswith(PENDING_EMAIL_DOMAIN):
        user_record.email = resolved_email

    if resolved_avatar_url and not user_record.avatar_url:
        user_record.avatar_url = resolved_avatar_url

    session.flush()
    return user_record


def resolve_authenticated_session(
    access_token: str,
) -> tuple[SupabaseClaims, AuthenticatedUser | None]:
    claims = decode_supabase_access_token(access_token)
    user_record = _load_user_record(claims.sub, with_role=True)

    if user_record is None or not user_record.registration_completed:
        return claims, None

    return claims, _to_authenticated_user(user_record)


def get_authenticated_user(access_token: str) -> tuple[SupabaseClaims, AuthenticatedUser]:
    claims = decode_supabase_access_token(access_token)
    user_record = _load_user_record(claims.sub, with_role=True)

    if user_record is None:
        raise AuthenticationError("Authenticated account is not provisioned in the application.")

    if not user_record.registration_completed:
        raise AuthenticationError("Authenticated account has not completed registration.")

    return claims, _to_authenticated_user(user_record)


def get_application_user_state(user_id: UUID) -> ApplicationUserState | None:
    user_record = _load_user_record(user_id, with_role=True)

    if user_record is None:
        return None

    return _to_application_user_state(user_record)


def ensure_application_user(claims: SupabaseClaims) -> ApplicationUserState:
    try:
        with SessionLocal() as session:
            _ensure_user_record(session, claims)
            session.commit()
    except IntegrityError as exc:
        user_state = get_application_user_state(claims.sub)
        if user_state is None:
            raise ProvisioningError(
                "We couldn't prepare your account right now. Please try again."
            ) from exc

        return user_state
    except SQLAlchemyError as exc:
        _debug_log("ensure_application_user_failed", user_id=str(claims.sub), reason=repr(exc))
        _raise_auth_storage_unavailable(exc)

    user_state = get_application_user_state(claims.sub)

    if user_state is None:
        raise ProvisioningError("We couldn't prepare your account right now. Please try again.")

    return user_state


def complete_application_user_registration(
    claims: SupabaseClaims,
    *,
    role: SignupRole,
    full_name: str,
    email: str,
    avatar_url: str | None,
) -> AuthenticatedUser:
    try:
        with SessionLocal() as session:
            user_record = _ensure_user_record(session, claims)
            user_record.role_id = ROLE_ID_BY_APP_ROLE[role]
            user_record.full_name = full_name.strip()
            user_record.email = email.strip().lower()
            user_record.avatar_url = _normalize_optional_text(avatar_url) or _resolve_avatar_url(
                claims
            )
            user_record.registration_completed = True
            session.commit()
    except IntegrityError as exc:
        raise ProvisioningError(
            "We couldn't create your account right now. Please try again."
        ) from exc
    except SQLAlchemyError as exc:
        _debug_log(
            "complete_registration_failed",
            user_id=str(claims.sub),
            role=role,
            reason=repr(exc),
        )
        _raise_auth_storage_unavailable(exc)

    user_record = _load_user_record(claims.sub, with_role=True)

    if user_record is None:
        raise ProvisioningError("We couldn't create your account right now. Please try again.")

    return _to_authenticated_user(user_record)
