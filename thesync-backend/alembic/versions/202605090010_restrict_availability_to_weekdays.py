"""Restrict recurring availability to weekdays only.

Revision ID: 202605090010
Revises: 202605090009
Create Date: 2026-05-09 20:10:00
"""

from __future__ import annotations

from alembic import op

# revision identifiers, used by Alembic.
revision = "202605090010"
down_revision = "202605090009"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.execute("DELETE FROM availability_slots WHERE day_of_week > 4")
    op.execute(
        "ALTER TABLE availability_slots "
        "DROP CONSTRAINT IF EXISTS ck_availability_slots_ck_day_of_week_range"
    )
    op.execute(
        "ALTER TABLE availability_slots "
        "DROP CONSTRAINT IF EXISTS ck_availability_slots_ck_availability_slots_ck_day_of_w_9923"
    )
    op.execute(
        "ALTER TABLE availability_slots "
        "ADD CONSTRAINT ck_availability_slots_ck_day_of_week_range "
        "CHECK (day_of_week >= 0 AND day_of_week <= 4)"
    )


def downgrade() -> None:
    op.execute(
        "ALTER TABLE availability_slots "
        "DROP CONSTRAINT IF EXISTS ck_availability_slots_ck_day_of_week_range"
    )
    op.execute(
        "ALTER TABLE availability_slots "
        "DROP CONSTRAINT IF EXISTS ck_availability_slots_ck_availability_slots_ck_day_of_w_9923"
    )
    op.execute(
        "ALTER TABLE availability_slots "
        "ADD CONSTRAINT ck_availability_slots_ck_day_of_week_range "
        "CHECK (day_of_week >= 0 AND day_of_week <= 6)"
    )
