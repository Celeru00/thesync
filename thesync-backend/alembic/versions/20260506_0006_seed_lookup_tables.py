"""Seed schedule_statuses, schedule_types, and invite_statuses lookup tables.

Revision ID: 202605060004
Revises: 202605060003
Create Date: 2026-05-06 01:00:00

"""

from __future__ import annotations

from alembic import op

revision = "202605060006"
down_revision = "202605060005"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.execute("""
        INSERT INTO public.schedule_statuses (id, name)
        VALUES
            (1, 'pending'),
            (2, 'approved'),
            (3, 'rejected'),
            (4, 'rescheduled')
        ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name;

        SELECT setval(
            pg_get_serial_sequence('public.schedule_statuses', 'id'),
            COALESCE((SELECT MAX(id) FROM public.schedule_statuses), 1),
            true
        );
    """)

    op.execute("""
        INSERT INTO public.schedule_types (id, name)
        VALUES
            (1, 'consultation'),
            (2, 'defense')
        ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name;

        SELECT setval(
            pg_get_serial_sequence('public.schedule_types', 'id'),
            COALESCE((SELECT MAX(id) FROM public.schedule_types), 1),
            true
        );
    """)

    op.execute("""
        INSERT INTO public.invite_statuses (id, name)
        VALUES
            (1, 'pending'),
            (2, 'accepted'),
            (3, 'declined')
        ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name;

        SELECT setval(
            pg_get_serial_sequence('public.invite_statuses', 'id'),
            COALESCE((SELECT MAX(id) FROM public.invite_statuses), 1),
            true
        );
    """)


def downgrade() -> None:
    op.execute("DELETE FROM public.invite_statuses WHERE id IN (1, 2, 3);")
    op.execute("DELETE FROM public.schedule_types WHERE id IN (1, 2);")
    op.execute("DELETE FROM public.schedule_statuses WHERE id IN (1, 2, 3, 4);")
