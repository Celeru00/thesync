"""Create per-user Google Calendar connections.

Revision ID: 202605060007
Revises: 202605060006
Create Date: 2026-05-06 15:35:00
"""

from __future__ import annotations

import sqlalchemy as sa
from alembic import op

# revision identifiers, used by Alembic.
revision = "202605060007"
down_revision = "202605060006"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "google_calendar_connections",
        sa.Column("user_id", sa.Uuid(), nullable=False),
        sa.Column("google_email", sa.Text(), nullable=False),
        sa.Column(
            "calendar_id",
            sa.Text(),
            nullable=False,
            server_default=sa.text("'primary'"),
        ),
        sa.Column("access_token", sa.Text(), nullable=False),
        sa.Column("refresh_token", sa.Text(), nullable=False),
        sa.Column("token_type", sa.Text(), nullable=True),
        sa.Column("scopes", sa.Text(), nullable=True),
        sa.Column("token_expires_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column(
            "connected_at",
            sa.DateTime(timezone=True),
            nullable=False,
            server_default=sa.func.now(),
        ),
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            nullable=False,
            server_default=sa.func.now(),
        ),
        sa.ForeignKeyConstraint(
            ["user_id"],
            ["users.id"],
            name=op.f("fk_google_calendar_connections_user_id_users"),
        ),
        sa.PrimaryKeyConstraint("user_id", name=op.f("pk_google_calendar_connections")),
        sa.UniqueConstraint("user_id", name="uq_google_calendar_connections_user_id"),
    )


def downgrade() -> None:
    op.drop_table("google_calendar_connections")
