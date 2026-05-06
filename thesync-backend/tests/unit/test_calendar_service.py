from __future__ import annotations

import unittest
from datetime import UTC, datetime
from uuid import UUID, uuid4

from model.schedule import Schedule
from model.user import User
from repository.google_calendar import GoogleCalendarRemoteEvent
from usecase.calendar_service import (
    DEFAULT_EVENT_DURATION,
    CalendarServiceError,
    GoogleCalendarScheduleService,
)


def _build_user(*, user_id: UUID, full_name: str, email: str) -> User:
    return User(
        id=user_id,
        role_id=1,
        role_name="student",
        full_name=full_name,
        email=email,
        created_at=datetime(2026, 5, 6, 10, 0, tzinfo=UTC),
    )


def _build_schedule(
    *,
    student_id: UUID,
    adviser_id: UUID,
    google_calendar_event_id: str | None = None,
) -> Schedule:
    return Schedule(
        id=uuid4(),
        student_id=student_id,
        adviser_id=adviser_id,
        type_id=1,
        status_id=2,
        topic="CMSC 200A Proposal Defense",
        requested_at=datetime(2026, 5, 6, 10, 0, tzinfo=UTC),
        scheduled_at=datetime(2026, 5, 10, 10, 30, tzinfo=UTC),
        google_calendar_event_id=google_calendar_event_id,
        created_at=datetime(2026, 5, 6, 10, 0, tzinfo=UTC),
    )


class _FakeScheduleRepository:
    def __init__(self, schedule: Schedule) -> None:
        self.schedule = schedule
        self.set_calls: list[tuple[UUID, str | None, str | None]] = []

    def set_calendar_event(
        self,
        schedule_id: UUID,
        google_event_id: str | None,
        meet_link: str | None,
    ) -> Schedule:
        self.set_calls.append((schedule_id, google_event_id, meet_link))
        self.schedule = self.schedule.model_copy(
            update={
                "google_calendar_event_id": google_event_id,
                "meet_link": meet_link,
            }
        )
        return self.schedule


class _FakeUserRepository:
    def __init__(self, users: list[User]) -> None:
        self.users = {user.id: user for user in users}

    def get_by_id(self, user_id: UUID | str) -> User | None:
        try:
            normalized_user_id = UUID(str(user_id))
        except ValueError:
            return None
        return self.users.get(normalized_user_id)


class _FakeCalendarClient:
    def __init__(self) -> None:
        self.create_calls: list[dict[str, object]] = []
        self.update_calls: list[dict[str, object]] = []

    def create_event(self, **kwargs) -> GoogleCalendarRemoteEvent:
        self.create_calls.append(kwargs)
        return GoogleCalendarRemoteEvent(
            event_id="google-event-1",
            summary=str(kwargs["summary"]),
            status="confirmed",
            starts_at=kwargs["starts_at"],
            ends_at=kwargs["ends_at"],
            html_link="https://calendar.google.com/event?eid=1",
            meet_link="https://meet.google.com/abc-defg-hij",
        )

    def update_event(self, event_id: str, **kwargs) -> GoogleCalendarRemoteEvent:
        self.update_calls.append({"event_id": event_id, **kwargs})
        return GoogleCalendarRemoteEvent(
            event_id=event_id,
            summary=str(kwargs["summary"]),
            status="confirmed",
            starts_at=kwargs["starts_at"],
            ends_at=kwargs["ends_at"],
            html_link="https://calendar.google.com/event?eid=1",
            meet_link="https://meet.google.com/updated-link",
        )


class _TestableGoogleCalendarScheduleService(GoogleCalendarScheduleService):
    def __init__(
        self,
        *,
        schedule_repository: _FakeScheduleRepository,
        user_repository: _FakeUserRepository,
        connection: object | None,
        client: _FakeCalendarClient,
    ) -> None:
        super().__init__(
            schedule_repository=schedule_repository,
            user_repository=user_repository,
        )
        self._connection = connection
        self._client = client

    def _load_connection(self, adviser_id: UUID) -> object | None:
        return self._connection

    def _build_client(self, connection: object) -> _FakeCalendarClient:
        return self._client


class GoogleCalendarScheduleServiceTests(unittest.TestCase):
    def test_sync_creates_event_with_attendees_and_updates_schedule(self) -> None:
        student_id = uuid4()
        adviser_id = uuid4()
        schedule = _build_schedule(student_id=student_id, adviser_id=adviser_id)
        schedule_repository = _FakeScheduleRepository(schedule)
        user_repository = _FakeUserRepository(
            [
                _build_user(
                    user_id=student_id,
                    full_name="Student User",
                    email="student@example.com",
                ),
                _build_user(
                    user_id=adviser_id,
                    full_name="Adviser User",
                    email="adviser@example.com",
                ),
            ]
        )
        client = _FakeCalendarClient()
        service = _TestableGoogleCalendarScheduleService(
            schedule_repository=schedule_repository,
            user_repository=user_repository,
            connection=object(),
            client=client,
        )

        updated_schedule = service.sync(schedule)

        self.assertEqual(len(client.create_calls), 1)
        self.assertEqual(client.update_calls, [])
        payload = client.create_calls[0]
        self.assertEqual(payload["summary"], schedule.topic)
        self.assertEqual(payload["starts_at"], schedule.scheduled_at)
        self.assertEqual(
            payload["ends_at"],
            schedule.scheduled_at + DEFAULT_EVENT_DURATION,
        )
        self.assertEqual(
            payload["attendees"],
            [
                {"email": "student@example.com", "displayName": "Student User"},
                {"email": "adviser@example.com", "displayName": "Adviser User"},
            ],
        )
        self.assertEqual(
            schedule_repository.set_calls,
            [(schedule.id, "google-event-1", "https://meet.google.com/abc-defg-hij")],
        )
        self.assertEqual(updated_schedule.google_calendar_event_id, "google-event-1")
        self.assertEqual(updated_schedule.meet_link, "https://meet.google.com/abc-defg-hij")

    def test_sync_updates_existing_event_instead_of_creating_duplicate(self) -> None:
        student_id = uuid4()
        adviser_id = uuid4()
        schedule = _build_schedule(
            student_id=student_id,
            adviser_id=adviser_id,
            google_calendar_event_id="existing-event-id",
        )
        schedule_repository = _FakeScheduleRepository(schedule)
        user_repository = _FakeUserRepository(
            [
                _build_user(
                    user_id=student_id,
                    full_name="Student User",
                    email="student@example.com",
                ),
                _build_user(
                    user_id=adviser_id,
                    full_name="Adviser User",
                    email="adviser@example.com",
                ),
            ]
        )
        client = _FakeCalendarClient()
        service = _TestableGoogleCalendarScheduleService(
            schedule_repository=schedule_repository,
            user_repository=user_repository,
            connection=object(),
            client=client,
        )

        updated_schedule = service.sync(schedule)

        self.assertEqual(client.create_calls, [])
        self.assertEqual(len(client.update_calls), 1)
        self.assertEqual(client.update_calls[0]["event_id"], "existing-event-id")
        self.assertEqual(
            schedule_repository.set_calls,
            [(schedule.id, "existing-event-id", "https://meet.google.com/updated-link")],
        )
        self.assertEqual(updated_schedule.google_calendar_event_id, "existing-event-id")
        self.assertEqual(updated_schedule.meet_link, "https://meet.google.com/updated-link")

    def test_sync_raises_when_adviser_has_no_google_calendar_connection(self) -> None:
        student_id = uuid4()
        adviser_id = uuid4()
        schedule = _build_schedule(student_id=student_id, adviser_id=adviser_id)
        schedule_repository = _FakeScheduleRepository(schedule)
        user_repository = _FakeUserRepository(
            [
                _build_user(
                    user_id=student_id,
                    full_name="Student User",
                    email="student@example.com",
                ),
                _build_user(
                    user_id=adviser_id,
                    full_name="Adviser User",
                    email="adviser@example.com",
                ),
            ]
        )
        service = _TestableGoogleCalendarScheduleService(
            schedule_repository=schedule_repository,
            user_repository=user_repository,
            connection=None,
            client=_FakeCalendarClient(),
        )

        with self.assertRaises(CalendarServiceError):
            service.sync(schedule)

        self.assertEqual(schedule_repository.set_calls, [])


if __name__ == "__main__":
    unittest.main()
