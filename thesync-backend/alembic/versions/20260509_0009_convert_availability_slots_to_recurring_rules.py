"""Convert dated availability slots into recurring weekly rules.

Revision ID: 202605090009
Revises: 202605070008
Create Date: 2026-05-09 18:30:00
"""

from __future__ import annotations

from datetime import UTC, date, datetime, timedelta
from zoneinfo import ZoneInfo

import sqlalchemy as sa
from alembic import op

# revision identifiers, used by Alembic.
revision = "202605090009"
down_revision = "202605070008"
branch_labels = None
depends_on = None

SCHEDULE_TIMEZONE = ZoneInfo("Asia/Manila")
REFERENCE_MONDAY = date(2026, 1, 5)


def _availability_columns() -> set[str]:
    bind = op.get_bind()
    inspector = sa.inspect(bind)
    return {column["name"] for column in inspector.get_columns("availability_slots")}


def _availability_indexes() -> set[str]:
    bind = op.get_bind()
    inspector = sa.inspect(bind)
    return {index["name"] for index in inspector.get_indexes("availability_slots")}


def _availability_check_constraints() -> set[str]:
    bind = op.get_bind()
    inspector = sa.inspect(bind)
    return {
        constraint["name"] for constraint in inspector.get_check_constraints("availability_slots")
    }


def _normalize_aware_datetime(value: datetime | None) -> datetime | None:
    if value is None:
        return None

    if value.tzinfo is None:
        return value.replace(tzinfo=UTC)

    return value.astimezone(UTC)


def upgrade() -> None:
    existing_columns = _availability_columns()

    with op.batch_alter_table("availability_slots") as batch_op:
        if "day_of_week" not in existing_columns:
            batch_op.add_column(sa.Column("day_of_week", sa.Integer(), nullable=True))
        if "start_time" not in existing_columns:
            batch_op.add_column(sa.Column("start_time", sa.Time(), nullable=True))
        if "end_time" not in existing_columns:
            batch_op.add_column(sa.Column("end_time", sa.Time(), nullable=True))

    if {"slot_start", "slot_end"}.issubset(existing_columns):
        bind = op.get_bind()
        table = sa.table(
            "availability_slots",
            sa.column("id", sa.Uuid()),
            sa.column("slot_start", sa.DateTime(timezone=True)),
            sa.column("slot_end", sa.DateTime(timezone=True)),
            sa.column("day_of_week", sa.Integer()),
            sa.column("start_time", sa.Time()),
            sa.column("end_time", sa.Time()),
        )

        rows = bind.execute(sa.select(table.c.id, table.c.slot_start, table.c.slot_end)).mappings()

        for row in rows:
            slot_start = _normalize_aware_datetime(row["slot_start"])
            slot_end = _normalize_aware_datetime(row["slot_end"])
            if slot_start is None or slot_end is None:
                continue

            local_start = slot_start.astimezone(SCHEDULE_TIMEZONE)
            local_end = slot_end.astimezone(SCHEDULE_TIMEZONE)
            bind.execute(
                table.update()
                .where(table.c.id == row["id"])
                .values(
                    day_of_week=local_start.weekday(),
                    start_time=local_start.time().replace(second=0, microsecond=0),
                    end_time=local_end.time().replace(second=0, microsecond=0),
                )
            )

    with op.batch_alter_table("availability_slots") as batch_op:
        batch_op.alter_column("day_of_week", nullable=False)
        batch_op.alter_column("start_time", nullable=False)
        batch_op.alter_column("end_time", nullable=False)

    with op.batch_alter_table("availability_slots") as batch_op:
        batch_op.create_check_constraint(
            "ck_day_of_week_range",
            "day_of_week >= 0 AND day_of_week <= 6",
        )
        batch_op.create_check_constraint(
            "ck_end_time_after_start_time",
            "end_time > start_time",
        )
        batch_op.create_index(
            "ix_availability_slots_day_of_week",
            ["day_of_week"],
            unique=False,
        )
        batch_op.create_index(
            "ix_availability_slots_adviser_id_day_of_week_start_time",
            ["adviser_id", "day_of_week", "start_time"],
            unique=False,
        )

        if {"slot_start", "slot_end"}.issubset(_availability_columns()):
            batch_op.drop_column("slot_start")
            batch_op.drop_column("slot_end")


def downgrade() -> None:
    existing_columns = _availability_columns()

    with op.batch_alter_table("availability_slots") as batch_op:
        if "slot_start" not in existing_columns:
            batch_op.add_column(sa.Column("slot_start", sa.DateTime(timezone=True), nullable=True))
        if "slot_end" not in existing_columns:
            batch_op.add_column(sa.Column("slot_end", sa.DateTime(timezone=True), nullable=True))

    if {"day_of_week", "start_time", "end_time"}.issubset(_availability_columns()):
        bind = op.get_bind()
        table = sa.table(
            "availability_slots",
            sa.column("id", sa.Uuid()),
            sa.column("day_of_week", sa.Integer()),
            sa.column("start_time", sa.Time()),
            sa.column("end_time", sa.Time()),
            sa.column("slot_start", sa.DateTime(timezone=True)),
            sa.column("slot_end", sa.DateTime(timezone=True)),
        )

        rows = bind.execute(
            sa.select(table.c.id, table.c.day_of_week, table.c.start_time, table.c.end_time)
        ).mappings()

        for row in rows:
            rule_day = REFERENCE_MONDAY + timedelta(days=int(row["day_of_week"]))
            local_start = datetime.combine(
                rule_day,
                row["start_time"],
                tzinfo=SCHEDULE_TIMEZONE,
            )
            local_end = datetime.combine(
                rule_day,
                row["end_time"],
                tzinfo=SCHEDULE_TIMEZONE,
            )
            bind.execute(
                table.update()
                .where(table.c.id == row["id"])
                .values(
                    slot_start=local_start.astimezone(UTC),
                    slot_end=local_end.astimezone(UTC),
                )
            )

    with op.batch_alter_table("availability_slots") as batch_op:
        batch_op.alter_column("slot_start", nullable=False)
        batch_op.alter_column("slot_end", nullable=False)

    existing_indexes = _availability_indexes()
    existing_checks = _availability_check_constraints()

    with op.batch_alter_table("availability_slots") as batch_op:
        if "ix_availability_slots_day_of_week" in existing_indexes:
            batch_op.drop_index("ix_availability_slots_day_of_week")
        if "ix_availability_slots_adviser_id_day_of_week_start_time" in existing_indexes:
            batch_op.drop_index("ix_availability_slots_adviser_id_day_of_week_start_time")
        if "ck_availability_slots_ck_day_of_week_range" in existing_checks:
            batch_op.drop_constraint("ck_availability_slots_ck_day_of_week_range", type_="check")
        if "ck_availability_slots_ck_end_time_after_start_time" in existing_checks:
            batch_op.drop_constraint(
                "ck_availability_slots_ck_end_time_after_start_time",
                type_="check",
            )

        batch_op.create_check_constraint(
            "ck_availability_slots_slot_end_after_start",
            "slot_end > slot_start",
        )
        batch_op.create_index(
            "ix_availability_slots_slot_start",
            ["slot_start"],
            unique=False,
        )
        batch_op.create_index(
            "ix_availability_slots_adviser_id_slot_start",
            ["adviser_id", "slot_start"],
            unique=False,
        )

        if {"day_of_week", "start_time", "end_time"}.issubset(_availability_columns()):
            batch_op.drop_column("day_of_week")
            batch_op.drop_column("start_time")
            batch_op.drop_column("end_time")
