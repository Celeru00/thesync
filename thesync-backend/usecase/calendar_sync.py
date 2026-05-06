from __future__ import annotations

from datetime import datetime
from typing import Final

from sqlalchemy import select
from sqlalchemy.orm import joinedload

from model.auth import AuthenticatedUser
from model.calendar import CalendarSyncSummary
from repository.database import SessionLocal
from repository.google_calendar import (
    CalendarSyncConfigurationError,
    GoogleCalendarApiError,
    GoogleCalendarClient,
    GoogleCalendarEventNotFound,
    GoogleCalendarRemoteEvent,
)
from repository.orm import (
    AuditLogRecord,
    GoogleCalendarConnectionRecord,
    NotificationRecord,
    ScheduleRecord,
    ScheduleStatusRecord,
)

APPROVED_STATUS_NAME: Final[str] = "approved"
RESCHEDULED_STATUS_NAME: Final[str] = "rescheduled"
CANCELLED_STATUS_NAME: Final[str] = "cancelled"


def _debug_log(event: str, **fields: object) -> None:
    payload = " ".join(f"{key}={value!r}" for key, value in fields.items())
    print(f"[calendar-sync] {event} {payload}".strip(), flush=True)


class CalendarSyncError(RuntimeError):
    """Raised when the calendar sync use case cannot proceed."""


def _format_datetime(value: datetime | None) -> str:
    return value.isoformat() if value is not None else "unscheduled"


def _load_required_status_ids(session) -> dict[str, int]:
    statuses = session.execute(select(ScheduleStatusRecord)).scalars().all()
    status_ids = {status.name.strip().lower(): status.id for status in statuses}
    missing = [
        name
        for name in (APPROVED_STATUS_NAME, RESCHEDULED_STATUS_NAME, CANCELLED_STATUS_NAME)
        if name not in status_ids
    ]

    if missing:
        raise CalendarSyncError(
            "Missing required schedule statuses for calendar sync: " + ", ".join(sorted(missing))
        )

    return status_ids


def _build_rescheduled_message(schedule: ScheduleRecord, event: GoogleCalendarRemoteEvent) -> str:
    return (
        f'Your schedule for "{schedule.topic}" was moved to '
        f"{_format_datetime(event.starts_at)} in Google Calendar."
    )


def _build_cancelled_message(schedule: ScheduleRecord) -> str:
    return f'Your schedule for "{schedule.topic}" was cancelled in Google Calendar.'


def sync_google_calendar_updates(changed_by_user: AuthenticatedUser) -> CalendarSyncSummary:
    summary = CalendarSyncSummary()

    with SessionLocal() as session:
        status_ids = _load_required_status_ids(session)
        approved_status_id = status_ids[APPROVED_STATUS_NAME]
        rescheduled_status_id = status_ids[RESCHEDULED_STATUS_NAME]
        cancelled_status_id = status_ids[CANCELLED_STATUS_NAME]

        schedules = (
            session.execute(
                select(ScheduleRecord)
                .options(joinedload(ScheduleRecord.student))
                .where(ScheduleRecord.google_calendar_event_id.is_not(None))
                .where(ScheduleRecord.status_id == approved_status_id)
            )
            .scalars()
            .all()
        )
        summary.total = len(schedules)

        for schedule in schedules:
            try:
                connection = session.execute(
                    select(GoogleCalendarConnectionRecord).where(
                        GoogleCalendarConnectionRecord.user_id == schedule.adviser_id
                    )
                ).scalar_one_or_none()

                if connection is None:
                    summary.errors += 1
                    _debug_log(
                        "schedule_sync_missing_connection",
                        schedule_id=str(schedule.id),
                        adviser_id=str(schedule.adviser_id),
                    )
                    continue

                client = GoogleCalendarClient(connection)
                event = client.get_event(schedule.google_calendar_event_id or "")
                previous_status_id = schedule.status_id
                current_scheduled_at = schedule.scheduled_at

                if event.status == "cancelled":
                    schedule.status_id = cancelled_status_id
                    session.add(
                        AuditLogRecord(
                            schedule_id=schedule.id,
                            changed_by=changed_by_user.id,
                            previous_status_id=previous_status_id,
                            new_status_id=cancelled_status_id,
                            remarks="Google Calendar event was cancelled.",
                        )
                    )
                    session.add(
                        NotificationRecord(
                            user_id=schedule.student_id,
                            schedule_id=schedule.id,
                            message=_build_cancelled_message(schedule),
                        )
                    )
                    session.commit()
                    summary.cancelled += 1
                    _debug_log(
                        "schedule_cancelled",
                        schedule_id=str(schedule.id),
                        event_id=event.event_id,
                    )
                    continue

                if event.starts_at != current_scheduled_at:
                    schedule.scheduled_at = event.starts_at
                    if event.meet_link:
                        schedule.meet_link = event.meet_link
                    schedule.status_id = rescheduled_status_id
                    session.add(
                        AuditLogRecord(
                            schedule_id=schedule.id,
                            changed_by=changed_by_user.id,
                            previous_status_id=previous_status_id,
                            new_status_id=rescheduled_status_id,
                            remarks=(
                                "Google Calendar event moved from "
                                f"{_format_datetime(current_scheduled_at)} to "
                                f"{_format_datetime(event.starts_at)}."
                            ),
                        )
                    )
                    session.add(
                        NotificationRecord(
                            user_id=schedule.student_id,
                            schedule_id=schedule.id,
                            message=_build_rescheduled_message(schedule, event),
                        )
                    )
                    session.commit()
                    summary.updated += 1
                    _debug_log(
                        "schedule_rescheduled",
                        schedule_id=str(schedule.id),
                        event_id=event.event_id,
                        previous_time=_format_datetime(current_scheduled_at),
                        new_time=_format_datetime(event.starts_at),
                    )
                    continue

                if event.meet_link and event.meet_link != schedule.meet_link:
                    schedule.meet_link = event.meet_link
                    session.commit()
                    _debug_log(
                        "schedule_meet_link_updated",
                        schedule_id=str(schedule.id),
                        event_id=event.event_id,
                    )
            except GoogleCalendarEventNotFound:
                session.rollback()
                try:
                    schedule.google_calendar_event_id = None
                    schedule.meet_link = None
                    session.add(
                        AuditLogRecord(
                            schedule_id=schedule.id,
                            changed_by=changed_by_user.id,
                            previous_status_id=schedule.status_id,
                            new_status_id=schedule.status_id,
                            remarks=(
                                "Linked Google Calendar event was not found. "
                                "Cleared stored event metadata."
                            ),
                        )
                    )
                    session.commit()
                    summary.not_found += 1
                    _debug_log(
                        "schedule_event_not_found",
                        schedule_id=str(schedule.id),
                    )
                except Exception as exc:
                    session.rollback()
                    summary.errors += 1
                    _debug_log(
                        "schedule_event_not_found_failed",
                        schedule_id=str(schedule.id),
                        reason=repr(exc),
                    )
            except (CalendarSyncConfigurationError, GoogleCalendarApiError) as exc:
                session.rollback()
                summary.errors += 1
                _debug_log(
                    "schedule_sync_error",
                    schedule_id=str(schedule.id),
                    event_id=schedule.google_calendar_event_id,
                    reason=repr(exc),
                )
            except Exception as exc:
                session.rollback()
                summary.errors += 1
                _debug_log(
                    "schedule_sync_unexpected_error",
                    schedule_id=str(schedule.id),
                    event_id=schedule.google_calendar_event_id,
                    reason=repr(exc),
                )

    return summary
