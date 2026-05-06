from __future__ import annotations

from functools import lru_cache
from urllib.parse import urlparse

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Application settings loaded from environment variables."""

    app_name: str = "ThesisSync Backend"
    app_env: str = "development"
    database_url: str = "sqlite:///./thesync.db"
    frontend_url: str = "http://localhost:3000"
    sqlalchemy_echo: bool = False
    supabase_url: str | None = None
    supabase_jwt_audience: str = "authenticated"
    supabase_jwt_secret: str | None = None
    supabase_jwt_leeway_seconds: int = 60

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )

    @property
    def resolved_supabase_url(self) -> str | None:
        if self.supabase_url:
            return self.supabase_url.rstrip("/")

        database_host = urlparse(self.database_url).hostname

        if not database_host:
            return None

        if not database_host.startswith("db.") or not database_host.endswith(".supabase.co"):
            return None

        project_ref = database_host.removeprefix("db.").removesuffix(".supabase.co")

        if not project_ref:
            return None

        return f"https://{project_ref}.supabase.co"


@lru_cache
def get_settings() -> Settings:
    return Settings()
