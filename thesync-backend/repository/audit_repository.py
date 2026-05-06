from __future__ import annotations

from typing import Any
from uuid import UUID, uuid4

from model.audit import AuditLog
from repository.supabase_client import get_supabase_admin_client

AUDIT_LOG_SELECT = (
    "id, schedule_id, changed_by, previous_status_id, new_status_id, remarks, changed_at"
)


class AuditRepositoryNotFoundError(LookupError):
    """Raised when the requested audit log row does not exist."""


def _first_row(data: Any) -> dict[str, Any] | None:
    if isinstance(data, dict):
        return data

    if isinstance(data, list):
        for row in data:
            if isinstance(row, dict):
                return row

    return None


def _to_audit_log(row: dict[str, Any]) -> AuditLog:
    return AuditLog.model_validate(
        {
            "id": row.get("id"),
            "schedule_id": row.get("schedule_id"),
            "changed_by": row.get("changed_by"),
            "previous_status_id": row.get("previous_status_id"),
            "new_status_id": row.get("new_status_id"),
            "remarks": row.get("remarks"),
            "changed_at": row.get("changed_at"),
        }
    )


class AuditRepository:
    """Supabase-backed repository for raw audit log writes."""

    def __init__(self, client: Any | None = None) -> None:
        self._client = client or get_supabase_admin_client()

    def _get_by_id(self, audit_log_id: UUID | str) -> AuditLog | None:
        response = (
            self._client.table("audit_logs")
            .select(AUDIT_LOG_SELECT)
            .eq("id", str(audit_log_id))
            .execute()
        )
        row = _first_row(response.data)

        if row is None:
            return None

        return _to_audit_log(row)

    def create(
        self,
        *,
        schedule_id: UUID,
        changed_by: UUID,
        previous_status_id: int | None,
        new_status_id: int,
        remarks: str | None = None,
    ) -> AuditLog:
        audit_log_id = uuid4()
        payload = {
            "id": str(audit_log_id),
            "schedule_id": str(schedule_id),
            "changed_by": str(changed_by),
            "previous_status_id": previous_status_id,
            "new_status_id": new_status_id,
            "remarks": remarks,
        }
        response = self._client.table("audit_logs").insert(payload).execute()
        row = _first_row(response.data)

        if row is not None:
            return _to_audit_log(row)

        audit_log = self._get_by_id(audit_log_id)
        if audit_log is None:
            raise AuditRepositoryNotFoundError("Created audit log could not be reloaded.")

        return audit_log


def get_audit_repository() -> AuditRepository:
    return AuditRepository()
