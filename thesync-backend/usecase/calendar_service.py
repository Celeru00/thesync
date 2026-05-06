from __future__ import annotations

from datetime import UTC, timedelta

from sqlalchemy import select

from model.schedule import Schedule
from repository.database import SessionLocal
from repository.google_calendar import (
    CalendarSyncConfigurationError,
    GoogleCalendarApiError,
    GoogleCalendarClient,
)
from repository.orm import GoogleCalendarConnectionRecord
from repository.schedule_repository import ScheduleRepository, get_schedule_repository

DEFAULT_EVENT_DURATION = timedelta(hours=1)


class CalendarServiceError(RuntimeError):
    """Raised when a schedule cannot be synchronized to Google Calendar."""


class CalendarService:
    """Protocol-like base class for schedule calendar sync side effects."""

    def sync(self, schedule: Schedule) -> Schedule:
        raise NotImplementedError


class GoogleCalendarScheduleService(CalendarService):
    """Push approved ThesisSync schedules to the adviser's connected Google Calendar."""

    def __init__(self, schedule_repository: ScheduleRepository | None = None) -> None:
        self._schedule_repository = schedule_repository or get_schedule_repository()

    def sync(self, schedule: Schedule) -> Schedule:
        if schedule.scheduled_at is None:
            raise CalendarServiceError(
                "A schedule time is required before syncing to Google Calendar."
            )

        with SessionLocal() as session:
            connection = session.execute(
                select(GoogleCalendarConnectionRecord).where(
                    GoogleCalendarConnectionRecord.user_id == schedule.adviser_id
                )
            ).scalar_one_or_none()

            if connection is None:
                return schedule

            client = GoogleCalendarClient(connection)
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
                    )
                else:
                    remote_event = client.create_event(
                        summary=event_summary,
                        starts_at=event_starts_at,
                        ends_at=event_ends_at,
                        description=event_description,
                    )
                session.commit()
            except (CalendarSyncConfigurationError, GoogleCalendarApiError) as exc:
                session.rollback()
                raise CalendarServiceError(str(exc)) from exc

        return self._schedule_repository.set_calendar_event(
            schedule.id,
            remote_event.event_id,
            remote_event.meet_link,
        )
