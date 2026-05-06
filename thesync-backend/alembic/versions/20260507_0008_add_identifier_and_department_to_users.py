"""Add identifier and department fields to users.

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


def upgrade() -> None:
    op.add_column("users", sa.Column("identifier", sa.Text(), nullable=True))
    op.add_column("users", sa.Column("department", sa.Text(), nullable=True))


def downgrade() -> None:
    op.drop_column("users", "department")
    op.drop_column("users", "identifier")
