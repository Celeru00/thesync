"""Seed schedule statuses required for calendar sync.

Revision ID: 202605060006
Revises: 202605060005
Create Date: 2026-05-06 14:55:00
"""

from __future__ import annotations

from alembic import op

# revision identifiers, used by Alembic.
revision = "202605060006"
down_revision = "202605060005"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.execute("""
        INSERT INTO public.schedule_statuses (name)
        VALUES
          ('pending'),
          ('approved'),
          ('rejected'),
          ('rescheduled'),
          ('completed'),
          ('cancelled')
        ON CONFLICT (name) DO NOTHING;
        """)


def downgrade() -> None:
    op.execute("""
        DELETE FROM public.schedule_statuses
        WHERE lower(name) IN (
          'pending',
          'approved',
          'rejected',
          'rescheduled',
          'completed',
          'cancelled'
        )
        AND id NOT IN (
          SELECT status_id FROM public.schedules
          UNION
          SELECT new_status_id FROM public.audit_logs
          UNION
          SELECT previous_status_id
          FROM public.audit_logs
          WHERE previous_status_id IS NOT NULL
        );
        """)
