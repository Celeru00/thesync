"""Add identifier, degree program, and department fields to users.

Revision ID: 202605070008
Revises: 202605060007
Create Date: 2026-05-07 15:10:00
"""

from __future__ import annotations

import sqlalchemy as sa
from alembic import op

# revision identifiers, used by Alembic.
revision = "202605070008"
down_revision = "202605060007"
branch_labels = None
depends_on = None


def _existing_user_columns() -> set[str]:
    bind = op.get_bind()
    inspector = sa.inspect(bind)
    return {column["name"] for column in inspector.get_columns("users")}


def upgrade() -> None:
    existing_columns = _existing_user_columns()

    if "identifier" not in existing_columns:
        op.add_column("users", sa.Column("identifier", sa.Text(), nullable=True))

    if "degree_program" not in existing_columns:
        op.add_column("users", sa.Column("degree_program", sa.Text(), nullable=True))

    if "department" not in existing_columns:
        op.add_column("users", sa.Column("department", sa.Text(), nullable=True))


def downgrade() -> None:
    existing_columns = _existing_user_columns()

    if "department" in existing_columns:
        op.drop_column("users", "department")

    if "degree_program" in existing_columns:
        op.drop_column("users", "degree_program")

    if "identifier" in existing_columns:
        op.drop_column("users", "identifier")
