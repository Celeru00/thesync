from __future__ import annotations

from fastapi import APIRouter

from controller.dependencies import CurrentUser
from model.auth import AuthenticatedUser

router = APIRouter(prefix="/auth", tags=["auth"])


@router.get("/me", response_model=AuthenticatedUser)
def get_me(current_user: CurrentUser) -> AuthenticatedUser:
    return current_user
