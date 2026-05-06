from __future__ import annotations

from functools import lru_cache

from supabase import Client, create_client

from repository.config import get_settings


class SupabaseClientConfigurationError(RuntimeError):
    """Raised when the Supabase service-role client cannot be created."""


@lru_cache
def get_supabase_admin_client() -> Client:
    settings = get_settings()
    supabase_url = settings.resolved_supabase_url

    if not supabase_url:
        raise SupabaseClientConfigurationError(
            "SUPABASE_URL is required to create the Supabase service-role client."
        )

    if not settings.supabase_service_role_key:
        raise SupabaseClientConfigurationError(
            "SUPABASE_SERVICE_ROLE_KEY is required to create the Supabase service-role client."
        )

    return create_client(supabase_url, settings.supabase_service_role_key)
