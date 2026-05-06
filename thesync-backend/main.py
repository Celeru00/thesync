from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from controller.auth import router as auth_router
from controller.availability import router as availability_router
from controller.calendar import router as calendar_router
from controller.middleware import SupabaseAuthMiddleware
from controller.notifications import router as notifications_router
from controller.panelists import router as panelists_router
from controller.schedules import router as schedules_router
from controller.users import router as users_router
from repository.config import get_settings
from usecase.availability_service import DefaultAvailabilityService
from usecase.notification_service import DefaultNotificationService
from usecase.panelist_service import DefaultPanelistService
from usecase.schedule_service import DefaultScheduleService
from usecase.schedule_status_service import DefaultScheduleStatusService

settings = get_settings()

app = FastAPI(title=settings.app_name)
app.state.availability_service = DefaultAvailabilityService()
app.state.notification_service = DefaultNotificationService()
app.state.panelist_service = DefaultPanelistService()
app.state.schedule_service = DefaultScheduleService()
app.state.schedule_status_service = DefaultScheduleStatusService()
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
app.include_router(users_router, prefix="/api")


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
