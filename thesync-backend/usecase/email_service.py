from __future__ import annotations

import json
import sys
from datetime import UTC, datetime
from typing import Any
from urllib.error import HTTPError, URLError
from urllib.request import Request, urlopen

from repository.config import Settings, get_settings

SENDGRID_MAIL_SEND_URL = "https://api.sendgrid.com/v3/mail/send"


def _log_email_event(event: str, **fields: object) -> None:
    payload = " ".join(f"{key}={value!r}" for key, value in fields.items())
    print(f"[email-service] {event} {payload}".strip(), file=sys.stderr, flush=True)


def _format_datetime(value: datetime | None) -> str | None:
    if value is None:
        return None

    if value.tzinfo is None:
        return value.replace(tzinfo=UTC).isoformat()

    return value.astimezone(UTC).isoformat()


def _format_display_date(value: datetime | None) -> str | None:
    if value is None:
        return None

    return f"{value.strftime('%B')} {value.day}, {value.year}"


def _format_display_time(value: datetime | None) -> str | None:
    if value is None:
        return None

    return value.strftime("%I:%M %p").lstrip("0")


class EmailService:
    """Base email delivery contract for schedule lifecycle messages."""

    def send_schedule_submitted(
        self,
        *,
        adviser_email: str | None,
        adviser_name: str | None,
        student_name: str | None,
        schedule_type: str | None,
        topic: str,
        scheduled_at: datetime | None,
    ) -> None:
        raise NotImplementedError

    def send_schedule_approved(
        self,
        *,
        student_email: str | None,
        student_name: str | None,
        adviser_name: str | None,
        topic: str,
        scheduled_at: datetime | None,
        meet_link: str | None,
    ) -> None:
        raise NotImplementedError

    def send_schedule_rejected(
        self,
        *,
        student_email: str | None,
        student_name: str | None,
        adviser_name: str | None,
        topic: str,
        remarks: str | None,
    ) -> None:
        raise NotImplementedError

    def send_schedule_rescheduled(
        self,
        *,
        student_email: str | None,
        student_name: str | None,
        adviser_name: str | None,
        topic: str,
        scheduled_at: datetime | None,
    ) -> None:
        raise NotImplementedError


class SendGridEmailService(EmailService):
    """SendGrid-backed email service using dynamic templates only."""

    def __init__(self, settings: Settings | None = None) -> None:
        self._settings = settings or get_settings()

    def _deliver_payload(self, payload: dict[str, Any]) -> None:
        request = Request(
            SENDGRID_MAIL_SEND_URL,
            data=json.dumps(payload).encode("utf-8"),
            headers={
                "Authorization": f"Bearer {self._settings.sendgrid_api_key}",
                "Content-Type": "application/json",
            },
            method="POST",
        )

        try:
            with urlopen(request, timeout=15) as response:  # nosec B310
                if response.status not in {200, 202}:
                    raise RuntimeError(
                        f"SendGrid mail send returned unexpected status {response.status}."
                    )
        except HTTPError as exc:
            body = exc.read().decode("utf-8", errors="ignore").strip()
            raise RuntimeError(
                f"SendGrid mail send failed with {exc.code}: {body or exc.reason}"
            ) from exc
        except URLError as exc:
            raise RuntimeError("Unable to reach SendGrid mail send endpoint.") from exc

    def _send_dynamic_template(
        self,
        *,
        recipient_email: str | None,
        recipient_name: str | None,
        template_id: str | None,
        dynamic_template_data: dict[str, object],
    ) -> None:
        if recipient_email is None or not recipient_email.strip():
            return

        if not self._settings.sendgrid_api_key or not self._settings.sendgrid_from_email:
            _log_email_event(
                "delivery_skipped",
                reason="sendgrid_not_configured",
                recipient_email=recipient_email,
            )
            return

        if template_id is None or not template_id.strip():
            _log_email_event(
                "delivery_skipped",
                reason="template_not_configured",
                recipient_email=recipient_email,
            )
            return

        payload: dict[str, Any] = {
            "from": {"email": self._settings.sendgrid_from_email},
            "personalizations": [
                {
                    "to": [
                        {
                            "email": recipient_email.strip(),
                            **(
                                {"name": recipient_name}
                                if recipient_name is not None and recipient_name.strip()
                                else {}
                            ),
                        }
                    ],
                    "dynamic_template_data": dynamic_template_data,
                }
            ],
            "template_id": template_id.strip(),
        }
        if self._settings.sendgrid_from_name and self._settings.sendgrid_from_name.strip():
            payload["from"]["name"] = self._settings.sendgrid_from_name.strip()

        try:
            self._deliver_payload(payload)
        except Exception as exc:  # pragma: no cover - intentional containment boundary
            _log_email_event(
                "delivery_failed",
                recipient_email=recipient_email,
                template_id=template_id.strip(),
                reason=str(exc),
            )

    def send_schedule_submitted(
        self,
        *,
        adviser_email: str | None,
        adviser_name: str | None,
        student_name: str | None,
        schedule_type: str | None,
        topic: str,
        scheduled_at: datetime | None,
    ) -> None:
        self._send_dynamic_template(
            recipient_email=adviser_email,
            recipient_name=adviser_name,
            template_id=self._settings.sendgrid_template_schedule_submitted,
            dynamic_template_data={
                "adviser_name": adviser_name,
                "student_name": student_name,
                "schedule_type": schedule_type,
                "topic": topic,
                "scheduled_at": _format_datetime(scheduled_at),
                "requested_date": _format_display_date(scheduled_at),
                "requested_time": _format_display_time(scheduled_at),
                "status_name": "PENDING",
            },
        )

    def send_schedule_approved(
        self,
        *,
        student_email: str | None,
        student_name: str | None,
        adviser_name: str | None,
        topic: str,
        scheduled_at: datetime | None,
        meet_link: str | None,
    ) -> None:
        self._send_dynamic_template(
            recipient_email=student_email,
            recipient_name=student_name,
            template_id=self._settings.sendgrid_template_schedule_approved,
            dynamic_template_data={
                "student_name": student_name,
                "adviser_name": adviser_name,
                "topic": topic,
                "scheduled_at": _format_datetime(scheduled_at),
                "meet_link": meet_link,
            },
        )

    def send_schedule_rejected(
        self,
        *,
        student_email: str | None,
        student_name: str | None,
        adviser_name: str | None,
        topic: str,
        remarks: str | None,
    ) -> None:
        self._send_dynamic_template(
            recipient_email=student_email,
            recipient_name=student_name,
            template_id=self._settings.sendgrid_template_schedule_rejected,
            dynamic_template_data={
                "student_name": student_name,
                "adviser_name": adviser_name,
                "topic": topic,
                "remarks": remarks,
            },
        )

    def send_schedule_rescheduled(
        self,
        *,
        student_email: str | None,
        student_name: str | None,
        adviser_name: str | None,
        topic: str,
        scheduled_at: datetime | None,
    ) -> None:
        self._send_dynamic_template(
            recipient_email=student_email,
            recipient_name=student_name,
            template_id=self._settings.sendgrid_template_schedule_rescheduled,
            dynamic_template_data={
                "student_name": student_name,
                "adviser_name": adviser_name,
                "topic": topic,
                "scheduled_at": _format_datetime(scheduled_at),
            },
        )
