from __future__ import annotations

import unittest
from datetime import UTC, datetime, time
from uuid import uuid4

from pydantic import ValidationError

from model.auth import AuthenticatedUser
from model.availability import AvailabilitySlotCreateRequest
from repository.availability_repository import AvailabilityRepositoryUnavailableError
from usecase.availability import AvailabilityServiceUnavailableError
from usecase.availability_service import DefaultAvailabilityService


def _build_user() -> AuthenticatedUser:
    return AuthenticatedUser(
        id=uuid4(),
        role_id=1,
        role_name="adviser",
        full_name="Adviser User",
        email="adviser@example.com",
        created_at=datetime(2026, 5, 9, 10, 0, tzinfo=UTC),
        app_role="adviser",
    )


class _UnavailableAvailabilityRepository:
    def list_by_adviser(self, adviser_id):
        del adviser_id
        raise AvailabilityRepositoryUnavailableError("schema is out of date")


class AvailabilityServiceTests(unittest.TestCase):
    def test_create_request_rejects_weekend_rules(self) -> None:
        with self.assertRaises(ValidationError) as raised:
            AvailabilitySlotCreateRequest(
                day_of_week=5,
                start_time=time(9, 0),
                end_time=time(10, 0),
                is_blocked=False,
            )

        self.assertIn("Monday to Friday", str(raised.exception))

    def test_list_slots_translates_repository_unavailable_error(self) -> None:
        service = DefaultAvailabilityService(
            availability_repository=_UnavailableAvailabilityRepository(),
        )

        with self.assertRaises(AvailabilityServiceUnavailableError) as raised:
            service.list_slots(_build_user())

        self.assertIn("schema is out of date", str(raised.exception))


if __name__ == "__main__":
    unittest.main()
