from __future__ import annotations

import unittest
from datetime import UTC, datetime
from typing import Literal
from uuid import UUID, uuid4

from model.auth import AuthenticatedUser
from model.base import PaginatedResult
from model.panelist import PanelistAssignment
from model.schedule import Schedule, ScheduleListFilters, ScheduleListItem
from usecase.schedule_service import DefaultScheduleService


def _build_user(*, role_name: Literal["student", "adviser", "admin"]) -> AuthenticatedUser:
    return AuthenticatedUser(
        id=uuid4(),
        role_id=1,
        role_name=role_name,
        full_name=f"{role_name.title()} User",
        email=f"{role_name}@example.com",
        created_at=datetime(2026, 5, 6, 10, 0, tzinfo=UTC),
        app_role=role_name,
    )


def _build_schedule(
    *,
    student_id: UUID,
    adviser_id: UUID,
    topic: str = "CMSC 200A Proposal Defense",
) -> Schedule:
    return Schedule(
        id=uuid4(),
        student_id=student_id,
        adviser_id=adviser_id,
        type_id=1,
        status_id=1,
        topic=topic,
        requested_at=datetime(2026, 5, 6, 10, 0, tzinfo=UTC),
        scheduled_at=datetime(2026, 5, 10, 10, 30, tzinfo=UTC),
        created_at=datetime(2026, 5, 6, 10, 0, tzinfo=UTC),
    )


def _build_schedule_list_item(
    *,
    schedule: Schedule,
    student_full_name: str = "Student User",
    adviser_full_name: str = "Adviser User",
    type_name: str = "defense",
    status_name: str = "pending",
) -> ScheduleListItem:
    return ScheduleListItem(
        **schedule.model_dump(),
        student_full_name=student_full_name,
        adviser_full_name=adviser_full_name,
        type_name=type_name,
        status_name=status_name,
    )


def _build_panelist_assignment(*, schedule_id: UUID, panelist_id: UUID) -> PanelistAssignment:
    return PanelistAssignment(
        id=uuid4(),
        schedule_id=schedule_id,
        panelist_id=panelist_id,
        invite_status_id=1,
    )


class _FakeScheduleRepository:
    def __init__(
        self,
        *,
        student_page: PaginatedResult[ScheduleListItem],
        adviser_page: PaginatedResult[ScheduleListItem],
        admin_page: PaginatedResult[ScheduleListItem],
        schedules: list[Schedule],
    ) -> None:
        self.student_page = student_page
        self.adviser_page = adviser_page
        self.admin_page = admin_page
        self.schedules = {schedule.id: schedule for schedule in schedules}
        self.calls: list[tuple[object, ...]] = []

    def list_by_student(
        self,
        student_id: UUID | str,
        filters: ScheduleListFilters,
    ) -> PaginatedResult[ScheduleListItem]:
        self.calls.append(("student", student_id, filters))
        return self.student_page

    def list_by_adviser_or_panelist(
        self,
        adviser_id: UUID | str,
        panelist_schedule_ids: list[UUID],
        filters: ScheduleListFilters,
    ) -> PaginatedResult[ScheduleListItem]:
        self.calls.append(("adviser", adviser_id, tuple(panelist_schedule_ids), filters))
        return self.adviser_page

    def list_all(self, filters: ScheduleListFilters) -> PaginatedResult[ScheduleListItem]:
        self.calls.append(("admin", filters))
        return self.admin_page

    def get_by_id(self, schedule_id: UUID) -> Schedule | None:
        return self.schedules.get(schedule_id)

    def get_status_id_by_name(self, status_name: str) -> int | None:
        if status_name == "pending":
            return 1
        return None

    def get_status_name_by_id(self, status_id: int) -> str | None:
        if status_id == 1:
            return "pending"
        return None

    def get_type_id_by_name(self, type_name: str) -> int | None:
        if type_name == "defense":
            return 1
        return None

    def get_type_name_by_id(self, type_id: int) -> str | None:
        if type_id == 1:
            return "defense"
        return None


class _FakePanelistRepository:
    def __init__(
        self,
        *,
        schedule_ids_by_panelist: list[UUID] | None = None,
        assignments: list[PanelistAssignment] | None = None,
    ) -> None:
        self.schedule_ids_by_panelist = schedule_ids_by_panelist or []
        self.assignments = assignments or []
        self.calls: list[tuple[object, ...]] = []

    def list_schedule_ids_by_panelist(self, panelist_id: UUID | str) -> list[UUID]:
        self.calls.append(("list", panelist_id))
        return list(self.schedule_ids_by_panelist)

    def get(self, schedule_id: UUID | str, panelist_id: UUID | str) -> PanelistAssignment | None:
        self.calls.append(("get", schedule_id, panelist_id))
        schedule_id_as_str = str(schedule_id)
        panelist_id_as_str = str(panelist_id)
        for assignment in self.assignments:
            if (
                str(assignment.schedule_id) == schedule_id_as_str
                and str(assignment.panelist_id) == panelist_id_as_str
            ):
                return assignment
        return None


class ScheduleServiceListingTests(unittest.TestCase):
    def test_students_only_receive_their_own_paginated_schedules(self) -> None:
        student = _build_user(role_name="student")
        adviser = _build_user(role_name="adviser")
        schedule = _build_schedule(student_id=student.id, adviser_id=adviser.id)
        student_item = _build_schedule_list_item(schedule=schedule)
        repository = _FakeScheduleRepository(
            student_page=PaginatedResult[ScheduleListItem](
                items=[student_item],
                total=1,
                page=2,
                page_size=5,
            ),
            adviser_page=PaginatedResult[ScheduleListItem](
                items=[],
                total=0,
                page=1,
                page_size=20,
            ),
            admin_page=PaginatedResult[ScheduleListItem](
                items=[],
                total=0,
                page=1,
                page_size=20,
            ),
            schedules=[schedule],
        )
        service = DefaultScheduleService(
            schedule_repository=repository,
            panelist_repository=_FakePanelistRepository(),
        )

        response = service.list_schedules(student, ScheduleListFilters(page=2, limit=5))

        self.assertEqual(response.total, 1)
        self.assertEqual(response.page, 2)
        self.assertEqual(response.limit, 5)
        self.assertEqual(response.items[0].student_id, student.id)
        self.assertEqual(repository.calls[0][0], "student")
        self.assertEqual(repository.calls[0][1], student.id)

    def test_advisers_receive_primary_and_panelist_schedule_scope(self) -> None:
        student = _build_user(role_name="student")
        adviser = _build_user(role_name="adviser")
        primary_schedule = _build_schedule(student_id=student.id, adviser_id=adviser.id)
        panelist_schedule = _build_schedule(
            student_id=student.id, adviser_id=uuid4(), topic="Panelist View"
        )
        adviser_items = [
            _build_schedule_list_item(schedule=primary_schedule),
            _build_schedule_list_item(
                schedule=panelist_schedule,
                adviser_full_name="Another Adviser",
            ),
        ]
        repository = _FakeScheduleRepository(
            student_page=PaginatedResult[ScheduleListItem](
                items=[],
                total=0,
                page=1,
                page_size=20,
            ),
            adviser_page=PaginatedResult[ScheduleListItem](
                items=adviser_items,
                total=2,
                page=1,
                page_size=20,
            ),
            admin_page=PaginatedResult[ScheduleListItem](
                items=[],
                total=0,
                page=1,
                page_size=20,
            ),
            schedules=[primary_schedule, panelist_schedule],
        )
        panelist_repository = _FakePanelistRepository(
            schedule_ids_by_panelist=[panelist_schedule.id],
            assignments=[
                _build_panelist_assignment(schedule_id=panelist_schedule.id, panelist_id=adviser.id)
            ],
        )
        service = DefaultScheduleService(
            schedule_repository=repository,
            panelist_repository=panelist_repository,
        )

        response = service.list_schedules(adviser, ScheduleListFilters())

        self.assertEqual(response.total, 2)
        self.assertEqual(len(response.items), 2)
        self.assertEqual(panelist_repository.calls[0], ("list", adviser.id))
        self.assertEqual(repository.calls[0][0], "adviser")
        self.assertEqual(repository.calls[0][1], adviser.id)
        self.assertEqual(repository.calls[0][2], (panelist_schedule.id,))

    def test_admins_receive_global_schedule_page(self) -> None:
        admin = _build_user(role_name="admin")
        student = _build_user(role_name="student")
        adviser = _build_user(role_name="adviser")
        schedule = _build_schedule(student_id=student.id, adviser_id=adviser.id)
        repository = _FakeScheduleRepository(
            student_page=PaginatedResult[ScheduleListItem](
                items=[],
                total=0,
                page=1,
                page_size=20,
            ),
            adviser_page=PaginatedResult[ScheduleListItem](
                items=[],
                total=0,
                page=1,
                page_size=20,
            ),
            admin_page=PaginatedResult[ScheduleListItem](
                items=[_build_schedule_list_item(schedule=schedule)],
                total=1,
                page=1,
                page_size=20,
            ),
            schedules=[schedule],
        )
        service = DefaultScheduleService(
            schedule_repository=repository,
            panelist_repository=_FakePanelistRepository(),
        )

        response = service.list_schedules(admin, ScheduleListFilters())

        self.assertEqual(response.total, 1)
        self.assertEqual(len(response.items), 1)
        self.assertEqual(repository.calls[0][0], "admin")

    def test_panelist_adviser_can_access_schedule_details(self) -> None:
        student = _build_user(role_name="student")
        primary_adviser = _build_user(role_name="adviser")
        panelist = _build_user(role_name="adviser")
        schedule = _build_schedule(student_id=student.id, adviser_id=primary_adviser.id)
        repository = _FakeScheduleRepository(
            student_page=PaginatedResult[ScheduleListItem](
                items=[],
                total=0,
                page=1,
                page_size=20,
            ),
            adviser_page=PaginatedResult[ScheduleListItem](
                items=[],
                total=0,
                page=1,
                page_size=20,
            ),
            admin_page=PaginatedResult[ScheduleListItem](
                items=[],
                total=0,
                page=1,
                page_size=20,
            ),
            schedules=[schedule],
        )
        panelist_repository = _FakePanelistRepository(
            assignments=[
                _build_panelist_assignment(schedule_id=schedule.id, panelist_id=panelist.id)
            ]
        )
        service = DefaultScheduleService(
            schedule_repository=repository,
            panelist_repository=panelist_repository,
        )

        resolved_schedule = service.get_schedule(panelist, schedule.id)

        self.assertEqual(resolved_schedule.id, schedule.id)
        self.assertEqual(panelist_repository.calls[0], ("get", schedule.id, panelist.id))


if __name__ == "__main__":
    unittest.main()
