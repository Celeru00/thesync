from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from controller.auth import router as auth_router
from controller.availability import router as availability_router
from controller.calendar import router as calendar_router
from controller.middleware import SupabaseAuthMiddleware
from controller.notifications import router as notifications_router
from controller.panelists import router as panelists_router
from controller.schedules import router as schedules_router
from repository.audit_repository import get_audit_repository
from repository.config import get_settings
from repository.notification_repository import get_notification_repository
from repository.schedule_repository import get_schedule_repository
from usecase.calendar_service import GoogleCalendarScheduleService
from usecase.schedule_status_service import DefaultScheduleStatusService

settings = get_settings()

app = FastAPI(title=settings.app_name)
schedule_repository = get_schedule_repository()
app.state.schedule_status_service = DefaultScheduleStatusService(
    schedule_repository=schedule_repository,
    notification_repository=get_notification_repository(),
    audit_repository=get_audit_repository(),
    calendar_service=GoogleCalendarScheduleService(schedule_repository),
)
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
app.include_router(availability_router, prefix="/api")
app.include_router(panelists_router, prefix="/api")
app.include_router(notifications_router, prefix="/api")
app.include_router(schedules_router, prefix="/api")


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
