from __future__ import annotations

from fastapi import APIRouter, HTTPException

from controller.dependencies import CurrentClaims, CurrentUser
from model.auth import (
    AuthenticatedUser,
    AuthInitializeRequest,
    AuthInitializeResponse,
    CompleteRegistrationRequest,
)
from usecase.auth import AuthFlowError, complete_registration, initialize_authenticated_session

router = APIRouter(prefix="/auth", tags=["auth"])


def _debug_log(event: str, **fields: object) -> None:
    payload = " ".join(f"{key}={value!r}" for key, value in fields.items())
    print(f"[backend-auth] {event} {payload}".strip(), flush=True)


def _raise_auth_flow_error(error: AuthFlowError) -> None:
    raise HTTPException(
        status_code=error.status_code,
        detail={
            "error_code": error.code,
            "message": str(error),
        },
    ) from error


@router.get("/me", response_model=AuthenticatedUser)
def get_me(current_user: CurrentUser) -> AuthenticatedUser:
    return current_user


@router.post("/initialize", response_model=AuthInitializeResponse)
def initialize_auth(
    payload: AuthInitializeRequest,
    current_claims: CurrentClaims,
) -> AuthInitializeResponse:
    try:
        _debug_log(
            "initialize_start",
            user_id=str(current_claims.sub),
            flow=payload.flow,
            requested_role=payload.requested_role,
        )
        response = initialize_authenticated_session(
            current_claims,
            flow=payload.flow,
            requested_role=payload.requested_role,
        )
        _debug_log(
            "initialize_success",
            user_id=str(current_claims.sub),
            action=response.action,
            redirect_to=response.redirect_to,
            register_role=response.register_role,
        )
        return response
    except AuthFlowError as exc:
        _debug_log(
            "initialize_failed",
            user_id=str(current_claims.sub),
            flow=payload.flow,
            requested_role=payload.requested_role,
            error_code=exc.code,
            reason=str(exc),
        )
        _raise_auth_flow_error(exc)


@router.post("/register", response_model=AuthenticatedUser)
def register_auth_user(
    payload: CompleteRegistrationRequest,
    current_claims: CurrentClaims,
) -> AuthenticatedUser:
    try:
        _debug_log(
            "register_start",
            user_id=str(current_claims.sub),
            role=payload.role,
        )
        current_user = complete_registration(current_claims, payload)
        _debug_log(
            "register_success",
            user_id=str(current_claims.sub),
            role=current_user.app_role,
        )
        return current_user
    except AuthFlowError as exc:
        _debug_log(
            "register_failed",
            user_id=str(current_claims.sub),
            role=payload.role,
            error_code=exc.code,
            reason=str(exc),
        )
        _raise_auth_flow_error(exc)
