from __future__ import annotations

from datetime import UTC, timedelta
from uuid import UUID

from sqlalchemy import select

from model.schedule import Schedule
from repository.database import SessionLocal
from repository.google_calendar import (
    CalendarSyncConfigurationError,
    GoogleCalendarApiError,
    GoogleCalendarAttendee,
    GoogleCalendarClient,
)
from repository.orm import GoogleCalendarConnectionRecord
from repository.schedule_repository import ScheduleRepository, get_schedule_repository
from repository.supabase_client import SupabaseClientConfigurationError
from repository.user_repository import UserRepository, get_user_repository

DEFAULT_EVENT_DURATION = timedelta(hours=1)


class CalendarServiceError(RuntimeError):
    """Raised when a schedule cannot be synchronized to Google Calendar."""


class CalendarService:
    """Protocol-like base class for schedule calendar sync side effects."""

    def sync(self, schedule: Schedule) -> Schedule:
        raise NotImplementedError


class GoogleCalendarScheduleService(CalendarService):
    """Push approved ThesisSync schedules to the adviser's connected Google Calendar."""

    def __init__(
        self,
        schedule_repository: ScheduleRepository | None = None,
        user_repository: UserRepository | None = None,
    ) -> None:
        self._schedule_repository = schedule_repository or get_schedule_repository()
        self._user_repository = user_repository

    @property
    def user_repository(self) -> UserRepository:
        if self._user_repository is None:
            try:
                self._user_repository = get_user_repository()
            except SupabaseClientConfigurationError as exc:
                raise CalendarServiceError(str(exc)) from exc

        return self._user_repository

    def _build_attendees(self, schedule: Schedule) -> list[GoogleCalendarAttendee]:
        student = self.user_repository.get_by_id(schedule.student_id)
        adviser = self.user_repository.get_by_id(schedule.adviser_id)

        if student is None:
            raise CalendarServiceError("Unable to load the scheduled student for Google Calendar.")

        if adviser is None:
            raise CalendarServiceError("Unable to load the assigned adviser for Google Calendar.")

        return [
            {
                "email": student.email,
                "displayName": student.full_name,
            },
            {
                "email": adviser.email,
                "displayName": adviser.full_name,
            },
        ]

    def _load_connection(self, adviser_id: UUID) -> GoogleCalendarConnectionRecord | None:
        with SessionLocal() as session:
            connection = session.execute(
                select(GoogleCalendarConnectionRecord).where(
                    GoogleCalendarConnectionRecord.user_id == adviser_id
                )
            ).scalar_one_or_none()
            if connection is not None:
                session.expunge(connection)
            return connection

    def _build_client(self, connection: GoogleCalendarConnectionRecord) -> GoogleCalendarClient:
        return GoogleCalendarClient(connection)

    def sync(self, schedule: Schedule) -> Schedule:
        if schedule.scheduled_at is None:
            raise CalendarServiceError(
                "A schedule time is required before syncing to Google Calendar."
            )

        attendees = self._build_attendees(schedule)
        connection = self._load_connection(schedule.adviser_id)

        if connection is None:
            raise CalendarServiceError("The assigned adviser has not connected Google Calendar.")

        client = self._build_client(connection)
        event_summary = schedule.topic
        event_description = "Scheduled via ThesisSync."
        event_starts_at = (
            schedule.scheduled_at.astimezone(UTC)
            if schedule.scheduled_at.tzinfo
            else schedule.scheduled_at.replace(tzinfo=UTC)
        )
        event_ends_at = event_starts_at + DEFAULT_EVENT_DURATION

        try:
            if schedule.google_calendar_event_id:
                remote_event = client.update_event(
                    schedule.google_calendar_event_id,
                    summary=event_summary,
                    starts_at=event_starts_at,
                    ends_at=event_ends_at,
                    description=event_description,
                    attendees=attendees,
                )
            else:
                remote_event = client.create_event(
                    summary=event_summary,
                    starts_at=event_starts_at,
                    ends_at=event_ends_at,
                    description=event_description,
                    attendees=attendees,
                )
        except (CalendarSyncConfigurationError, GoogleCalendarApiError) as exc:
            raise CalendarServiceError(str(exc)) from exc

        return self._schedule_repository.set_calendar_event(
            schedule.id,
            remote_event.event_id,
            remote_event.meet_link,
        )
