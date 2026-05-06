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
        return initialize_authenticated_session(
            current_claims,
            flow=payload.flow,
            requested_role=payload.requested_role,
        )
    except AuthFlowError as exc:
        _raise_auth_flow_error(exc)


@router.post("/register", response_model=AuthenticatedUser)
def register_auth_user(
    payload: CompleteRegistrationRequest,
    current_claims: CurrentClaims,
) -> AuthenticatedUser:
    try:
        return complete_registration(current_claims, payload)
    except AuthFlowError as exc:
        _raise_auth_flow_error(exc)
