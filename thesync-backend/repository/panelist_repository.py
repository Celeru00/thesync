from __future__ import annotations

from typing import Any
from uuid import UUID, uuid4

from model.panelist import PanelistAssignment
from repository.supabase_client import get_supabase_admin_client

PANELIST_SELECT = "id, schedule_id, panelist_id, invite_status_id"


class PanelistRepositoryNotFoundError(LookupError):
    """Raised when the requested panelist assignment does not exist."""


def _first_row(data: Any) -> dict[str, Any] | None:
    if isinstance(data, dict):
        return data

    if isinstance(data, list):
        for row in data:
            if isinstance(row, dict):
                return row

    return None


def _rows(data: Any) -> list[dict[str, Any]]:
    if isinstance(data, dict):
        return [data]

    if isinstance(data, list):
        return [row for row in data if isinstance(row, dict)]

    return []


def _to_panelist_assignment(row: dict[str, Any]) -> PanelistAssignment:
    return PanelistAssignment.model_validate(
        {
            "id": row.get("id"),
            "schedule_id": row.get("schedule_id"),
            "panelist_id": row.get("panelist_id"),
            "invite_status_id": row.get("invite_status_id"),
        }
    )


class PanelistRepository:
    """Supabase-backed repository for raw panelist assignment queries."""

    def __init__(self, client: Any | None = None) -> None:
        self._client = client or get_supabase_admin_client()

    def _get_by_assignment_id(self, assignment_id: UUID | str) -> PanelistAssignment | None:
        response = (
            self._client.table("panelist_assignments")
            .select(PANELIST_SELECT)
            .eq("id", str(assignment_id))
            .execute()
        )
        row = _first_row(response.data)

        if row is None:
            return None

        return _to_panelist_assignment(row)

    def _get_invite_status_id(self, status_name: str) -> int | None:
        response = (
            self._client.table("invite_statuses")
            .select("id")
            .eq("name", status_name.strip().lower())
            .execute()
        )
        row = _first_row(response.data)

        if row is None:
            return None

        try:
            return int(row["id"])
        except (KeyError, TypeError, ValueError):
            return None

    def create(self, schedule_id: UUID, panelist_id: UUID) -> PanelistAssignment:
        assignment_id = uuid4()
        pending_status_id = self._get_invite_status_id("pending")

        if pending_status_id is None:
            raise PanelistRepositoryNotFoundError("Pending invite status lookup was not found.")

        payload = {
            "id": str(assignment_id),
            "schedule_id": str(schedule_id),
            "panelist_id": str(panelist_id),
            "invite_status_id": pending_status_id,
        }
        response = self._client.table("panelist_assignments").insert(payload).execute()
        row = _first_row(response.data)

        if row is not None:
            return _to_panelist_assignment(row)

        assignment = self.get(schedule_id, panelist_id)
        if assignment is None:
            raise PanelistRepositoryNotFoundError(
                "Created panelist assignment could not be reloaded."
            )

        return assignment

    def list_by_schedule(self, schedule_id: UUID | str) -> list[PanelistAssignment]:
        response = (
            self._client.table("panelist_assignments")
            .select(PANELIST_SELECT)
            .eq("schedule_id", str(schedule_id))
            .order("panelist_id")
            .execute()
        )

        return [_to_panelist_assignment(row) for row in _rows(response.data)]

    def get(self, schedule_id: UUID | str, panelist_id: UUID | str) -> PanelistAssignment | None:
        response = (
            self._client.table("panelist_assignments")
            .select(PANELIST_SELECT)
            .eq("schedule_id", str(schedule_id))
            .eq("panelist_id", str(panelist_id))
            .execute()
        )
        row = _first_row(response.data)

        if row is None:
            return None

        return _to_panelist_assignment(row)

    def update_status(
        self,
        assignment_id: UUID | str,
        invite_status_id: int,
    ) -> PanelistAssignment:
        if self._get_by_assignment_id(assignment_id) is None:
            raise PanelistRepositoryNotFoundError("Panelist assignment was not found.")

        response = (
            self._client.table("panelist_assignments")
            .update({"invite_status_id": invite_status_id})
            .eq("id", str(assignment_id))
            .execute()
        )
        row = _first_row(response.data)

        if row is not None:
            return _to_panelist_assignment(row)

        assignment = self._get_by_assignment_id(assignment_id)
        if assignment is None:
            raise PanelistRepositoryNotFoundError("Panelist assignment was not found.")

        return assignment

    def delete(self, assignment_id: UUID | str) -> None:
        if self._get_by_assignment_id(assignment_id) is None:
            raise PanelistRepositoryNotFoundError("Panelist assignment was not found.")

        self._client.table("panelist_assignments").delete().eq("id", str(assignment_id)).execute()


def get_panelist_repository() -> PanelistRepository:
    return PanelistRepository()
