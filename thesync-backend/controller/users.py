from __future__ import annotations

from fastapi import APIRouter, HTTPException, status

from controller.dependencies import CurrentUser
from model.user import UserResponse
from repository.supabase_client import SupabaseClientConfigurationError
from repository.user_repository import get_user_repository

router = APIRouter(prefix="/users", tags=["users"])


@router.get("/advisers", response_model=list[UserResponse], summary="List advisers")
def list_advisers(current_user: CurrentUser) -> list[UserResponse]:
    del current_user

    try:
        repository = get_user_repository()
        advisers = repository.list_by_role("adviser")
    except SupabaseClientConfigurationError as exc:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=str(exc),
        ) from exc
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Unable to load advisers right now.",
        ) from exc

    return [UserResponse.model_validate(adviser) for adviser in advisers]
