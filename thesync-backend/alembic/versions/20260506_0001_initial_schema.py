"""Initial schema based on the scheduling ERD.

Revision ID: 202605060001
Revises:
Create Date: 2026-05-06 00:00:00

"""

from __future__ import annotations

import sqlalchemy as sa

from alembic import op

# revision identifiers, used by Alembic.
revision = "202605060001"
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "invite_statuses",
        sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column("name", sa.Text(), nullable=False),
        sa.PrimaryKeyConstraint("id", name=op.f("pk_invite_statuses")),
        sa.UniqueConstraint("name", name="uq_invite_statuses_name"),
    )

    op.create_table(
        "roles",
        sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column("name", sa.Text(), nullable=False),
        sa.PrimaryKeyConstraint("id", name=op.f("pk_roles")),
        sa.UniqueConstraint("name", name="uq_roles_name"),
    )

    op.create_table(
        "schedule_statuses",
        sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column("name", sa.Text(), nullable=False),
        sa.PrimaryKeyConstraint("id", name=op.f("pk_schedule_statuses")),
        sa.UniqueConstraint("name", name="uq_schedule_statuses_name"),
    )

    op.create_table(
        "schedule_types",
        sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column("name", sa.Text(), nullable=False),
        sa.PrimaryKeyConstraint("id", name=op.f("pk_schedule_types")),
        sa.UniqueConstraint("name", name="uq_schedule_types_name"),
    )

    op.create_table(
        "users",
        sa.Column("role_id", sa.Integer(), nullable=False),
        sa.Column("full_name", sa.Text(), nullable=False),
        sa.Column("email", sa.Text(), nullable=False),
        sa.Column("avatar_url", sa.Text(), nullable=True),
        sa.Column(
            "created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False
        ),
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.ForeignKeyConstraint(["role_id"], ["roles.id"], name=op.f("fk_users_role_id_roles")),
        sa.PrimaryKeyConstraint("id", name=op.f("pk_users")),
        sa.UniqueConstraint("email", name="uq_users_email"),
    )
    op.create_index("ix_users_role_id", "users", ["role_id"], unique=False)
    op.create_index("ix_users_email", "users", ["email"], unique=False)

    op.create_table(
        "availability_slots",
        sa.Column("adviser_id", sa.Uuid(), nullable=False),
        sa.Column("slot_start", sa.DateTime(timezone=True), nullable=False),
        sa.Column("slot_end", sa.DateTime(timezone=True), nullable=False),
        sa.Column("is_blocked", sa.Boolean(), server_default=sa.false(), nullable=False),
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.CheckConstraint(
            "slot_end > slot_start",
            name="ck_availability_slots_slot_end_after_start",
        ),
        sa.ForeignKeyConstraint(
            ["adviser_id"],
            ["users.id"],
            name=op.f("fk_availability_slots_adviser_id_users"),
        ),
        sa.PrimaryKeyConstraint("id", name=op.f("pk_availability_slots")),
    )
    op.create_index(
        "ix_availability_slots_adviser_id", "availability_slots", ["adviser_id"], unique=False
    )
    op.create_index(
        "ix_availability_slots_slot_start", "availability_slots", ["slot_start"], unique=False
    )
    op.create_index(
        "ix_availability_slots_adviser_id_slot_start",
        "availability_slots",
        ["adviser_id", "slot_start"],
        unique=False,
    )

    op.create_table(
        "schedules",
        sa.Column("student_id", sa.Uuid(), nullable=False),
        sa.Column("adviser_id", sa.Uuid(), nullable=False),
        sa.Column("type_id", sa.Integer(), nullable=False),
        sa.Column("status_id", sa.Integer(), nullable=False),
        sa.Column("topic", sa.Text(), nullable=False),
        sa.Column(
            "requested_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False
        ),
        sa.Column("scheduled_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("google_calendar_event_id", sa.Text(), nullable=True),
        sa.Column("meet_link", sa.Text(), nullable=True),
        sa.Column(
            "created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False
        ),
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.ForeignKeyConstraint(
            ["adviser_id"],
            ["users.id"],
            name=op.f("fk_schedules_adviser_id_users"),
        ),
        sa.ForeignKeyConstraint(
            ["status_id"],
            ["schedule_statuses.id"],
            name=op.f("fk_schedules_status_id_schedule_statuses"),
        ),
        sa.ForeignKeyConstraint(
            ["student_id"],
            ["users.id"],
            name=op.f("fk_schedules_student_id_users"),
        ),
        sa.ForeignKeyConstraint(
            ["type_id"],
            ["schedule_types.id"],
            name=op.f("fk_schedules_type_id_schedule_types"),
        ),
        sa.PrimaryKeyConstraint("id", name=op.f("pk_schedules")),
    )
    op.create_index("ix_schedules_student_id", "schedules", ["student_id"], unique=False)
    op.create_index("ix_schedules_adviser_id", "schedules", ["adviser_id"], unique=False)
    op.create_index("ix_schedules_status_id", "schedules", ["status_id"], unique=False)
    op.create_index("ix_schedules_type_id", "schedules", ["type_id"], unique=False)
    op.create_index("ix_schedules_scheduled_at", "schedules", ["scheduled_at"], unique=False)

    op.create_table(
        "audit_logs",
        sa.Column("schedule_id", sa.Uuid(), nullable=False),
        sa.Column("changed_by", sa.Uuid(), nullable=False),
        sa.Column("previous_status_id", sa.Integer(), nullable=True),
        sa.Column("new_status_id", sa.Integer(), nullable=False),
        sa.Column("remarks", sa.Text(), nullable=True),
        sa.Column(
            "changed_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False
        ),
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.ForeignKeyConstraint(
            ["changed_by"],
            ["users.id"],
            name=op.f("fk_audit_logs_changed_by_users"),
        ),
        sa.ForeignKeyConstraint(
            ["new_status_id"],
            ["schedule_statuses.id"],
            name=op.f("fk_audit_logs_new_status_id_schedule_statuses"),
        ),
        sa.ForeignKeyConstraint(
            ["previous_status_id"],
            ["schedule_statuses.id"],
            name=op.f("fk_audit_logs_previous_status_id_schedule_statuses"),
        ),
        sa.ForeignKeyConstraint(
            ["schedule_id"],
            ["schedules.id"],
            name=op.f("fk_audit_logs_schedule_id_schedules"),
        ),
        sa.PrimaryKeyConstraint("id", name=op.f("pk_audit_logs")),
    )
    op.create_index("ix_audit_logs_schedule_id", "audit_logs", ["schedule_id"], unique=False)
    op.create_index("ix_audit_logs_changed_by", "audit_logs", ["changed_by"], unique=False)
    op.create_index("ix_audit_logs_changed_at", "audit_logs", ["changed_at"], unique=False)

    op.create_table(
        "notifications",
        sa.Column("user_id", sa.Uuid(), nullable=False),
        sa.Column("schedule_id", sa.Uuid(), nullable=True),
        sa.Column("message", sa.Text(), nullable=False),
        sa.Column("is_read", sa.Boolean(), server_default=sa.false(), nullable=False),
        sa.Column(
            "created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False
        ),
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.ForeignKeyConstraint(
            ["schedule_id"],
            ["schedules.id"],
            ondelete="SET NULL",
            name=op.f("fk_notifications_schedule_id_schedules"),
        ),
        sa.ForeignKeyConstraint(
            ["user_id"],
            ["users.id"],
            name=op.f("fk_notifications_user_id_users"),
        ),
        sa.PrimaryKeyConstraint("id", name=op.f("pk_notifications")),
    )
    op.create_index("ix_notifications_user_id", "notifications", ["user_id"], unique=False)
    op.create_index("ix_notifications_is_read", "notifications", ["is_read"], unique=False)
    op.create_index("ix_notifications_created_at", "notifications", ["created_at"], unique=False)

    op.create_table(
        "panelist_assignments",
        sa.Column("schedule_id", sa.Uuid(), nullable=False),
        sa.Column("panelist_id", sa.Uuid(), nullable=False),
        sa.Column("invite_status_id", sa.Integer(), nullable=False),
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.ForeignKeyConstraint(
            ["invite_status_id"],
            ["invite_statuses.id"],
            name=op.f("fk_panelist_assignments_invite_status_id_invite_statuses"),
        ),
        sa.ForeignKeyConstraint(
            ["panelist_id"],
            ["users.id"],
            name=op.f("fk_panelist_assignments_panelist_id_users"),
        ),
        sa.ForeignKeyConstraint(
            ["schedule_id"],
            ["schedules.id"],
            name=op.f("fk_panelist_assignments_schedule_id_schedules"),
        ),
        sa.PrimaryKeyConstraint("id", name=op.f("pk_panelist_assignments")),
        sa.UniqueConstraint(
            "schedule_id",
            "panelist_id",
            name="uq_panelist_assignments_schedule_id_panelist_id",
        ),
    )
    op.create_index(
        "ix_panelist_assignments_schedule_id",
        "panelist_assignments",
        ["schedule_id"],
        unique=False,
    )
    op.create_index(
        "ix_panelist_assignments_panelist_id",
        "panelist_assignments",
        ["panelist_id"],
        unique=False,
    )


def downgrade() -> None:
    op.drop_index("ix_panelist_assignments_panelist_id", table_name="panelist_assignments")
    op.drop_index("ix_panelist_assignments_schedule_id", table_name="panelist_assignments")
    op.drop_index("ix_notifications_created_at", table_name="notifications")
    op.drop_index("ix_notifications_is_read", table_name="notifications")
    op.drop_index("ix_notifications_user_id", table_name="notifications")
    op.drop_index("ix_audit_logs_changed_at", table_name="audit_logs")
    op.drop_index("ix_audit_logs_changed_by", table_name="audit_logs")
    op.drop_index("ix_audit_logs_schedule_id", table_name="audit_logs")
    op.drop_index("ix_schedules_scheduled_at", table_name="schedules")
    op.drop_index("ix_schedules_type_id", table_name="schedules")
    op.drop_index("ix_schedules_status_id", table_name="schedules")
    op.drop_index("ix_schedules_adviser_id", table_name="schedules")
    op.drop_index("ix_schedules_student_id", table_name="schedules")
    op.drop_index(
        "ix_availability_slots_adviser_id_slot_start",
        table_name="availability_slots",
    )
    op.drop_index("ix_availability_slots_slot_start", table_name="availability_slots")
    op.drop_index("ix_availability_slots_adviser_id", table_name="availability_slots")
    op.drop_index("ix_users_email", table_name="users")
    op.drop_index("ix_users_role_id", table_name="users")
    op.drop_table("panelist_assignments")
    op.drop_table("notifications")
    op.drop_table("audit_logs")
    op.drop_table("schedules")
    op.drop_table("availability_slots")
    op.drop_table("users")
    op.drop_table("schedule_types")
    op.drop_table("schedule_statuses")
    op.drop_table("roles")
    op.drop_table("invite_statuses")
