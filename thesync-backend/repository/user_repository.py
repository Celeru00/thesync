from __future__ import annotations

from collections import Counter
from datetime import UTC, date, datetime, time
from typing import Any
from uuid import UUID

from model.user import ReportsResult, User
from repository.supabase_client import get_supabase_admin_client

WEEKDAY_ORDER = (
    "Sunday",
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
)
REPORT_PAGE_SIZE = 1000


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


def _normalize_role_name(role_name: str) -> str:
    return role_name.strip().lower()


def _normalize_email(email: str) -> str:
    return email.strip().lower()


def _parse_datetime(value: str | None) -> datetime | None:
    if not value:
        return None

    normalized = value.replace("Z", "+00:00")
    parsed = datetime.fromisoformat(normalized)

    if parsed.tzinfo is None:
        return parsed.replace(tzinfo=UTC)

    return parsed.astimezone(UTC)


def _coerce_int(value: Any) -> int | None:
    try:
        return int(value)
    except (TypeError, ValueError):
        return None


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


def _extract_role_name(row: dict[str, Any]) -> str | None:
    roles = row.get("roles")

    if isinstance(roles, dict):
        role_name = roles.get("name")
        return role_name.strip() if isinstance(role_name, str) and role_name.strip() else None

    if isinstance(roles, list):
        for role in roles:
            if not isinstance(role, dict):
                continue

            role_name = role.get("name")
            if isinstance(role_name, str) and role_name.strip():
                return role_name.strip()

    return None


def _to_user(row: dict[str, Any]) -> User:
    return User.model_validate(
        {
            "id": row.get("id"),
            "role_id": row.get("role_id"),
            "role_name": _extract_role_name(row),
            "full_name": row.get("full_name"),
            "email": row.get("email"),
            "avatar_url": row.get("avatar_url"),
            "created_at": row.get("created_at"),
        }
    )


class UserRepository:
    """Supabase-backed repository for user lookups and admin report queries."""

    def __init__(self, client: Any | None = None) -> None:
        self._client = client or get_supabase_admin_client()

    def _get_role_id(self, role_name: str) -> int | None:
        response = (
            self._client.table("roles")
            .select("id")
            .eq("name", _normalize_role_name(role_name))
            .execute()
        )
        row = _first_row(response.data)

        if row is None:
            return None

        role_id = row.get("id")
        return _coerce_int(role_id)

    def _get_lookup_name_by_id(self, table_name: str) -> dict[int, str]:
        response = self._client.table(table_name).select("id, name").execute()
        result: dict[int, str] = {}

        for row in _rows(response.data):
            lookup_id = row.get("id")
            lookup_name = row.get("name")

            if not isinstance(lookup_name, str) or not lookup_name.strip():
                continue

            normalized_id = _coerce_int(lookup_id)
            if normalized_id is None:
                continue

            result[normalized_id] = lookup_name.strip()

        return result

    def _fetch_all_rows(
        self,
        table_name: str,
        select_clause: str,
        *,
        apply_filters: Any | None = None,
    ) -> list[dict[str, Any]]:
        page_start = 0
        collected_rows: list[dict[str, Any]] = []

        while True:
            query = self._client.table(table_name).select(select_clause)
            if apply_filters is not None:
                query = apply_filters(query)

            response = query.range(page_start, page_start + REPORT_PAGE_SIZE - 1).execute()
            batch = _rows(response.data)
            collected_rows.extend(batch)

            if len(batch) < REPORT_PAGE_SIZE:
                break

            page_start += REPORT_PAGE_SIZE

        return collected_rows

    def get_by_id(self, user_id: UUID | str) -> User | None:
        response = (
            self._client.table("users")
            .select("id, role_id, full_name, email, avatar_url, created_at, roles(name)")
            .eq("id", str(user_id))
            .execute()
        )
        row = _first_row(response.data)

        if row is None:
            return None

        return _to_user(row)

    def get_by_email(self, email: str) -> User | None:
        response = (
            self._client.table("users")
            .select("id, role_id, full_name, email, avatar_url, created_at, roles(name)")
            .eq("email", _normalize_email(email))
            .execute()
        )
        row = _first_row(response.data)

        if row is None:
            return None

        return _to_user(row)

    def list_by_role(self, role_name: str) -> list[User]:
        role_id = self._get_role_id(role_name)

        if role_id is None:
            return []

        response = (
            self._client.table("users")
            .select("id, role_id, full_name, email, avatar_url, created_at, roles(name)")
            .eq("role_id", role_id)
            .order("full_name")
            .execute()
        )

        return [_to_user(row) for row in _rows(response.data)]

    def get_reports(
        self,
        from_date: date | datetime | None = None,
        to_date: date | datetime | None = None,
    ) -> ReportsResult:
        from_dt = _normalize_filter_datetime(from_date, is_end=False)
        to_dt = _normalize_filter_datetime(to_date, is_end=True)
        type_names = self._get_lookup_name_by_id("schedule_types")
        status_names = self._get_lookup_name_by_id("schedule_statuses")
        approved_status_id = next(
            (
                status_id
                for status_id, status_name in status_names.items()
                if status_name.lower() == "approved"
            ),
            None,
        )

        def apply_schedule_filters(query: Any) -> Any:
            if from_dt is not None:
                query = query.gte("requested_at", from_dt.isoformat())
            if to_dt is not None:
                query = query.lte("requested_at", to_dt.isoformat())
            return query

        schedules = self._fetch_all_rows(
            "schedules",
            "id, type_id, status_id, requested_at",
            apply_filters=apply_schedule_filters,
        )

        total_consultations = 0
        total_defenses = 0
        approved_count = 0
        by_status_counter: Counter[str] = Counter()
        by_day_counter: Counter[str] = Counter()
        requested_at_by_schedule_id: dict[str, datetime] = {}

        for row in schedules:
            schedule_id = row.get("id")
            requested_at = _parse_datetime(row.get("requested_at"))
            type_name = (
                type_names.get(int(row["type_id"])) if row.get("type_id") is not None else None
            )
            status_name = (
                status_names.get(int(row["status_id"]))
                if row.get("status_id") is not None
                else None
            )

            if isinstance(schedule_id, str) and requested_at is not None:
                requested_at_by_schedule_id[schedule_id] = requested_at
                by_day_counter[requested_at.strftime("%A")] += 1

            if type_name == "consultation":
                total_consultations += 1
            elif type_name == "defense":
                total_defenses += 1

            if status_name:
                by_status_counter[status_name] += 1
                if status_name.lower() == "approved":
                    approved_count += 1

        avg_time_to_approval_hours: float | None = None
        if approved_status_id is not None and requested_at_by_schedule_id:
            schedule_ids = list(requested_at_by_schedule_id.keys())

            def apply_audit_filters(query: Any) -> Any:
                query = query.eq("new_status_id", approved_status_id)
                return query.in_("schedule_id", schedule_ids)

            approval_audit_logs = self._fetch_all_rows(
                "audit_logs",
                "schedule_id, changed_at",
                apply_filters=apply_audit_filters,
            )
            earliest_approval_by_schedule: dict[str, datetime] = {}

            for row in approval_audit_logs:
                schedule_id = row.get("schedule_id")
                changed_at = _parse_datetime(row.get("changed_at"))
                if not isinstance(schedule_id, str) or changed_at is None:
                    continue

                existing = earliest_approval_by_schedule.get(schedule_id)
                if existing is None or changed_at < existing:
                    earliest_approval_by_schedule[schedule_id] = changed_at

            approval_durations_hours: list[float] = []
            for schedule_id, approved_at in earliest_approval_by_schedule.items():
                requested_at = requested_at_by_schedule_id.get(schedule_id)
                if requested_at is None:
                    continue

                duration_hours = (approved_at - requested_at).total_seconds() / 3600
                if duration_hours >= 0:
                    approval_durations_hours.append(duration_hours)

            if approval_durations_hours:
                avg_time_to_approval_hours = round(
                    sum(approval_durations_hours) / len(approval_durations_hours),
                    2,
                )

        total_schedules = len(schedules)
        approval_rate = (
            round((approved_count / total_schedules) * 100, 2) if total_schedules else 0.0
        )

        by_day_of_week = {weekday: by_day_counter.get(weekday, 0) for weekday in WEEKDAY_ORDER}

        return ReportsResult(
            total_consultations=total_consultations,
            total_defenses=total_defenses,
            approval_rate=approval_rate,
            avg_time_to_approval_hours=avg_time_to_approval_hours,
            by_status=dict(sorted(by_status_counter.items())),
            by_day_of_week=by_day_of_week,
        )


def get_user_repository() -> UserRepository:
    return UserRepository()
