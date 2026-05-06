from __future__ import annotations

from model.auth import (
    AppRole,
    AuthenticatedUser,
    AuthFlow,
    AuthInitializeResponse,
    CompleteRegistrationRequest,
    SignupRole,
    SupabaseClaims,
)
from repository.auth import (
    AuthServiceUnavailableError,
    ProvisioningError,
    complete_application_user_registration,
    ensure_application_user,
    get_application_user_state,
    get_authenticated_user,
)


class AuthorizationError(RuntimeError):
    """Raised when an authenticated user lacks the required application role."""


class AuthFlowError(RuntimeError):
    """Raised when an authenticated session cannot continue the requested flow."""

    def __init__(self, code: str, message: str, *, status_code: int = 409) -> None:
        super().__init__(message)
        self.code = code
        self.status_code = status_code


def _get_dashboard_path_for_role(role: AppRole) -> str:
    return {
        "student": "/student",
        "adviser": "/adviser",
        "admin": "/admin",
    }[role]


def authenticate_access_token(access_token: str) -> tuple[SupabaseClaims, AuthenticatedUser]:
    return get_authenticated_user(access_token)


def ensure_roles(current_user: AuthenticatedUser, allowed_roles: set[AppRole]) -> AuthenticatedUser:
    if current_user.app_role not in allowed_roles:
        raise AuthorizationError("You do not have permission to perform this action.")

    return current_user


def initialize_authenticated_session(
    current_claims: SupabaseClaims,
    *,
    flow: AuthFlow,
    requested_role: AppRole | None,
) -> AuthInitializeResponse:
    user_state = None

    if requested_role != "admin":
        try:
            user_state = ensure_application_user(current_claims)
        except ProvisioningError as exc:
            raise AuthFlowError(
                "registration-sync-failed",
                str(exc),
            ) from exc
        except AuthServiceUnavailableError as exc:
            raise AuthFlowError(
                "auth-backend-unavailable",
                str(exc),
                status_code=503,
            ) from exc
    else:
        try:
            user_state = get_application_user_state(current_claims.sub)
        except AuthServiceUnavailableError as exc:
            raise AuthFlowError(
                "auth-backend-unavailable",
                str(exc),
                status_code=503,
            ) from exc

    if user_state is None:
        raise AuthFlowError(
            "admin-not-provisioned",
            "This admin account is not ready to use yet.",
        )

    if user_state.registration_completed:
        if user_state.app_role is None:
            raise AuthFlowError(
                "role-not-supported",
                "This account role is not supported in the current app.",
            )

        if requested_role and requested_role != user_state.app_role:
            raise AuthFlowError(
                "role-mismatch",
                "This Google account is already set up under a different role.",
            )

        return AuthInitializeResponse(
            action="redirect",
            redirect_to=_get_dashboard_path_for_role(user_state.app_role),
        )

    if requested_role == "admin":
        raise AuthFlowError(
            "admin-not-provisioned",
            "This admin account is not ready to use yet.",
        )

    register_role: SignupRole | None = None
    if requested_role in {"student", "adviser"}:
        register_role = requested_role
    elif flow == "login" and user_state.app_role in {"student", "adviser"}:
        register_role = user_state.app_role

    if flow == "login" and register_role is None:
        register_role = "student"

    return AuthInitializeResponse(
        action="register",
        register_role=register_role,
    )


def complete_registration(
    current_claims: SupabaseClaims,
    payload: CompleteRegistrationRequest,
) -> AuthenticatedUser:
    try:
        return complete_application_user_registration(
            current_claims,
            role=payload.role,
            full_name=payload.full_name,
            email=str(payload.email),
            avatar_url=payload.avatar_url,
            identifier=payload.identifier,
            department=payload.department,
        )
    except ProvisioningError as exc:
        raise AuthFlowError(
            "registration-sync-failed",
            str(exc),
            status_code=409,
        ) from exc
    except AuthServiceUnavailableError as exc:
        raise AuthFlowError(
            "auth-backend-unavailable",
            str(exc),
            status_code=503,
        ) from exc
