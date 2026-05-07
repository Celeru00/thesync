from __future__ import annotations

import contextlib
import io
import unittest
from datetime import UTC, datetime

from repository.config import Settings
from usecase.email_service import SendGridEmailService


class _RecordingSendGridEmailService(SendGridEmailService):
    def __init__(self, settings: Settings, *, should_fail: bool = False) -> None:
        super().__init__(settings)
        self.should_fail = should_fail
        self.delivered_payloads: list[dict[str, object]] = []

    def _deliver_payload(self, payload: dict[str, object]) -> None:
        if self.should_fail:
            raise RuntimeError("simulated sendgrid failure")
        self.delivered_payloads.append(payload)


class SendGridEmailServiceTests(unittest.TestCase):
    def test_submitted_email_uses_dynamic_template_payload(self) -> None:
        service = _RecordingSendGridEmailService(
            Settings(
                sendgrid_api_key="sendgrid-key",
                sendgrid_from_email="noreply@example.com",
                sendgrid_from_name="ThesisSync",
                sendgrid_template_schedule_submitted="d-submitted",
            )
        )

        service.send_schedule_submitted(
            adviser_email="adviser@example.com",
            adviser_name="Adviser User",
            student_name="Student User",
            schedule_type="consultation",
            topic="CMSC 200A Proposal Defense",
            scheduled_at=datetime(2026, 5, 10, 10, 30, tzinfo=UTC),
        )

        self.assertEqual(len(service.delivered_payloads), 1)
        payload = service.delivered_payloads[0]
        self.assertEqual(payload["template_id"], "d-submitted")
        self.assertEqual(payload["from"]["email"], "noreply@example.com")
        self.assertEqual(
            payload["personalizations"][0]["to"][0]["email"],
            "adviser@example.com",
        )
        self.assertEqual(
            payload["personalizations"][0]["dynamic_template_data"]["topic"],
            "CMSC 200A Proposal Defense",
        )
        self.assertEqual(
            payload["personalizations"][0]["dynamic_template_data"]["schedule_type"],
            "consultation",
        )
        self.assertEqual(
            payload["personalizations"][0]["dynamic_template_data"]["requested_date"],
            "May 10, 2026",
        )
        self.assertEqual(
            payload["personalizations"][0]["dynamic_template_data"]["requested_time"],
            "10:30 AM",
        )

    def test_sendgrid_failures_are_logged_and_swallowed(self) -> None:
        service = _RecordingSendGridEmailService(
            Settings(
                sendgrid_api_key="sendgrid-key",
                sendgrid_from_email="noreply@example.com",
                sendgrid_template_schedule_approved="d-approved",
            ),
            should_fail=True,
        )
        stderr = io.StringIO()

        with contextlib.redirect_stderr(stderr):
            service.send_schedule_approved(
                student_email="student@example.com",
                student_name="Student User",
                adviser_name="Adviser User",
                topic="CMSC 200A Proposal Defense",
                scheduled_at=datetime(2026, 5, 10, 10, 30, tzinfo=UTC),
                meet_link="https://meet.google.com/abc-defg-hij",
            )

        self.assertEqual(service.delivered_payloads, [])
        self.assertIn("delivery_failed", stderr.getvalue())

    def test_rescheduled_email_uses_dynamic_template_payload(self) -> None:
        service = _RecordingSendGridEmailService(
            Settings(
                sendgrid_api_key="sendgrid-key",
                sendgrid_from_email="noreply@example.com",
                sendgrid_template_schedule_rescheduled="d-rescheduled",
                frontend_url="https://thesync.example.com",
            )
        )

        service.send_schedule_rescheduled(
            recipient_email="adviser@example.com",
            recipient_name="Adviser User",
            rescheduled_by_student=True,
            student_name="Student User",
            adviser_name="Adviser User",
            topic="CMSC 200A Proposal Defense",
            scheduled_at=datetime(2026, 5, 11, 8, 0, tzinfo=UTC),
            rescheduled_by_name="Student User",
        )

        self.assertEqual(len(service.delivered_payloads), 1)
        payload = service.delivered_payloads[0]
        self.assertEqual(payload["template_id"], "d-rescheduled")
        personalization = payload["personalizations"][0]
        self.assertEqual(personalization["to"][0]["email"], "adviser@example.com")
        self.assertEqual(
            personalization["dynamic_template_data"]["rescheduled_by_student"],
            True,
        )
        self.assertEqual(
            personalization["dynamic_template_data"]["rescheduled_by_name"],
            "Student User",
        )
        self.assertEqual(
            personalization["dynamic_template_data"]["counterparty_role"],
            "adviser",
        )
        self.assertEqual(
            personalization["dynamic_template_data"]["review_url"],
            "https://thesync.example.com/adviser/consultations",
        )
        self.assertEqual(
            personalization["dynamic_template_data"]["scheduled_date"],
            "May 11, 2026",
        )
        self.assertEqual(
            personalization["dynamic_template_data"]["scheduled_time"],
            "8:00 AM",
        )

    def test_no_email_is_sent_when_recipient_email_is_missing(self) -> None:
        service = _RecordingSendGridEmailService(
            Settings(
                sendgrid_api_key="sendgrid-key",
                sendgrid_from_email="noreply@example.com",
                sendgrid_template_schedule_rescheduled="d-rescheduled",
            )
        )

        service.send_schedule_rescheduled(
            recipient_email=None,
            recipient_name="Student User",
            rescheduled_by_student=False,
            student_name="Student User",
            adviser_name="Adviser User",
            topic="CMSC 200A Proposal Defense",
            scheduled_at=datetime(2026, 5, 11, 8, 0, tzinfo=UTC),
            rescheduled_by_name="Adviser User",
        )

        self.assertEqual(service.delivered_payloads, [])

    def test_cancelled_email_uses_dynamic_template_payload(self) -> None:
        service = _RecordingSendGridEmailService(
            Settings(
                sendgrid_api_key="sendgrid-key",
                sendgrid_from_email="noreply@example.com",
                sendgrid_template_schedule_cancelled="d-cancelled",
            )
        )

        service.send_schedule_cancelled(
            recipient_email="adviser@example.com",
            recipient_name="Adviser User",
            cancelled_by_student=True,
            student_name="Student User",
            adviser_name="Adviser User",
            topic="CMSC 200A Proposal Defense",
            schedule_type="consultation",
            requested_at=datetime(2026, 5, 10, 10, 30, tzinfo=UTC),
            cancelled_by_name="Student User",
        )

        self.assertEqual(len(service.delivered_payloads), 1)
        payload = service.delivered_payloads[0]
        self.assertEqual(payload["template_id"], "d-cancelled")
        personalization = payload["personalizations"][0]
        self.assertEqual(personalization["to"][0]["email"], "adviser@example.com")
        self.assertEqual(
            personalization["dynamic_template_data"]["cancelled_by_student"],
            True,
        )
        self.assertEqual(
            personalization["dynamic_template_data"]["requested_at"],
            "May 10, 2026 at 10:30 AM",
        )
        self.assertEqual(
            personalization["dynamic_template_data"]["cancelled_by_name"],
            "Student User",
        )


if __name__ == "__main__":
    unittest.main()
