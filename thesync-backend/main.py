from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from controller.auth import router as auth_router
from controller.calendar import router as calendar_router
from controller.middleware import SupabaseAuthMiddleware
from repository.config import get_settings

settings = get_settings()

app = FastAPI(title=settings.app_name)
app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.frontend_url],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
app.add_middleware(SupabaseAuthMiddleware)
app.include_router(auth_router, prefix="/api/v1")
app.include_router(calendar_router, prefix="/api")


@app.get("/")
def read_root() -> dict[str, str]:
    return {
        "app": settings.app_name,
        "environment": settings.app_env,
        "status": "ok",
    }


@app.get("/healthz")
def healthcheck() -> dict[str, str]:
    return {"status": "ok"}
