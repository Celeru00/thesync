from __future__ import annotations

from datetime import UTC, date, datetime, time
from typing import Any
from uuid import UUID, uuid4

from model.base import PaginatedResult
from model.schedule import Schedule, ScheduleListFilters
from repository.supabase_client import get_supabase_admin_client

SCHEDULE_SELECT = (
    "id, student_id, adviser_id, type_id, status_id, topic, requested_at, "
    "scheduled_at, google_calendar_event_id, meet_link, created_at"
)


class ScheduleRepositoryNotFoundError(LookupError):
    """Raised when the requested schedule row does not exist."""


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


def _normalize_filter_datetime(
    value: date | datetime | None,
    *,
    is_end: bool,
) -> datetime | None:
    if value is None:
        return None

    if isinstance(value, datetime):
        if value.tzinfo is None:
            return value.replace(tzinfo=UTC)

        return value.astimezone(UTC)

    if is_end:
        return datetime.combine(value, time.max, tzinfo=UTC)

    return datetime.combine(value, time.min, tzinfo=UTC)


def _to_schedule(row: dict[str, Any]) -> Schedule:
    return Schedule.model_validate(
        {
            "id": row.get("id"),
            "student_id": row.get("student_id"),
            "adviser_id": row.get("adviser_id"),
            "type_id": row.get("type_id"),
            "status_id": row.get("status_id"),
            "topic": row.get("topic"),
            "requested_at": row.get("requested_at"),
            "scheduled_at": row.get("scheduled_at"),
            "google_calendar_event_id": row.get("google_calendar_event_id"),
            "meet_link": row.get("meet_link"),
            "created_at": row.get("created_at"),
        }
    )


class ScheduleRepository:
    """Supabase-backed repository for raw schedule table reads and writes."""

    def __init__(self, client: Any | None = None) -> None:
        self._client = client or get_supabase_admin_client()

    def _build_list_query(
        self,
        *,
        filters: ScheduleListFilters,
        select_clause: str = SCHEDULE_SELECT,
    ) -> Any:
        query = self._client.table("schedules").select(select_clause, count="exact")

        if filters.status_id is not None:
            query = query.eq("status_id", filters.status_id)

        if filters.type_id is not None:
            query = query.eq("type_id", filters.type_id)

        from_dt = _normalize_filter_datetime(filters.from_date, is_end=False)
        to_dt = _normalize_filter_datetime(filters.to_date, is_end=True)

        if from_dt is not None:
            query = query.gte("scheduled_at", from_dt.isoformat())

        if to_dt is not None:
            query = query.lte("scheduled_at", to_dt.isoformat())

        start = (filters.page - 1) * filters.page_size
        end = start + filters.page_size - 1

        return query.order("scheduled_at").order("requested_at").range(start, end)

    def _list_with_filters(
        self,
        *,
        filters: ScheduleListFilters,
        scope_column: str | None = None,
        scope_value: UUID | str | None = None,
    ) -> PaginatedResult[Schedule]:
        query = self._build_list_query(filters=filters)

        if scope_column is not None and scope_value is not None:
            query = query.eq(scope_column, str(scope_value))

        response = query.execute()
        rows = _rows(response.data)
        total = getattr(response, "count", None)

        return PaginatedResult[Schedule](
            items=[_to_schedule(row) for row in rows],
            total=total if isinstance(total, int) and total >= 0 else len(rows),
            page=filters.page,
            page_size=filters.page_size,
        )

    def create(
        self,
        student_id: UUID,
        adviser_id: UUID,
        type_id: int,
        topic: str,
        scheduled_at: datetime | None,
    ) -> Schedule:
        schedule_id = uuid4()
        payload: dict[str, Any] = {
            "id": str(schedule_id),
            "student_id": str(student_id),
            "adviser_id": str(adviser_id),
            "type_id": type_id,
            "status_id": 1,
            "topic": topic,
        }

        if scheduled_at is not None:
            payload["scheduled_at"] = scheduled_at.isoformat()

        response = self._client.table("schedules").insert(payload).execute()
        row = _first_row(response.data)

        if row is not None:
            return _to_schedule(row)

        schedule = self.get_by_id(schedule_id)
        if schedule is None:
            raise ScheduleRepositoryNotFoundError("Created schedule could not be reloaded.")

        return schedule

    def get_by_id(self, schedule_id: UUID | str) -> Schedule | None:
        response = (
            self._client.table("schedules")
            .select(SCHEDULE_SELECT)
            .eq("id", str(schedule_id))
            .execute()
        )
        row = _first_row(response.data)

        if row is None:
            return None

        return _to_schedule(row)

    def get_status_id_by_name(self, status_name: str) -> int | None:
        response = (
            self._client.table("schedule_statuses")
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

    def get_type_name_by_id(self, type_id: int) -> str | None:
        response = self._client.table("schedule_types").select("name").eq("id", type_id).execute()
        row = _first_row(response.data)

        if row is None:
            return None

        type_name = row.get("name")
        if not isinstance(type_name, str):
            return None

        normalized_type_name = type_name.strip().lower()
        return normalized_type_name or None

    def list_by_student(
        self,
        student_id: UUID | str,
        filters: ScheduleListFilters,
    ) -> PaginatedResult[Schedule]:
        return self._list_with_filters(
            filters=filters,
            scope_column="student_id",
            scope_value=student_id,
        )

    def list_by_adviser(
        self,
        adviser_id: UUID | str,
        filters: ScheduleListFilters,
    ) -> PaginatedResult[Schedule]:
        return self._list_with_filters(
            filters=filters,
            scope_column="adviser_id",
            scope_value=adviser_id,
        )

    def list_all(self, filters: ScheduleListFilters) -> PaginatedResult[Schedule]:
        return self._list_with_filters(filters=filters)

    def adviser_has_schedule_conflict(
        self,
        *,
        adviser_id: UUID | str,
        scheduled_at: datetime,
        excluded_schedule_id: UUID | str | None = None,
        status_ids: list[int] | None = None,
    ) -> bool:
        query = (
            self._client.table("schedules")
            .select("id", count="exact")
            .eq("adviser_id", str(adviser_id))
            .eq("scheduled_at", scheduled_at.isoformat())
        )

        if excluded_schedule_id is not None:
            query = query.neq("id", str(excluded_schedule_id))

        if status_ids:
            query = query.in_("status_id", status_ids)

        response = query.execute()
        total = getattr(response, "count", None)
        if isinstance(total, int):
            return total > 0

        return bool(_rows(response.data))

    def update_status(
        self,
        schedule_id: UUID | str,
        status_id: int,
        scheduled_at: datetime | None = None,
    ) -> Schedule:
        payload: dict[str, Any] = {"status_id": status_id}

        if scheduled_at is not None:
            payload["scheduled_at"] = scheduled_at.isoformat()

        response = (
            self._client.table("schedules").update(payload).eq("id", str(schedule_id)).execute()
        )
        row = _first_row(response.data)

        if row is not None:
            return _to_schedule(row)

        schedule = self.get_by_id(schedule_id)
        if schedule is None:
            raise ScheduleRepositoryNotFoundError("Schedule was not found.")

        return schedule

    def set_calendar_event(
        self,
        schedule_id: UUID | str,
        google_event_id: str | None,
        meet_link: str | None,
    ) -> Schedule:
        response = (
            self._client.table("schedules")
            .update(
                {
                    "google_calendar_event_id": google_event_id,
                    "meet_link": meet_link,
                }
            )
            .eq("id", str(schedule_id))
            .execute()
        )
        row = _first_row(response.data)

        if row is not None:
            return _to_schedule(row)

        schedule = self.get_by_id(schedule_id)
        if schedule is None:
            raise ScheduleRepositoryNotFoundError("Schedule was not found.")

        return schedule

    def delete(self, schedule_id: UUID | str) -> None:
        if self.get_by_id(schedule_id) is None:
            raise ScheduleRepositoryNotFoundError("Schedule was not found.")

        self._client.table("schedules").delete().eq("id", str(schedule_id)).execute()


def get_schedule_repository() -> ScheduleRepository:
    return ScheduleRepository()
