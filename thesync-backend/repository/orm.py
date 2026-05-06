from __future__ import annotations

from datetime import UTC, datetime
from typing import ClassVar
from uuid import UUID, uuid4

from sqlalchemy import (
    Boolean,
    CheckConstraint,
    DateTime,
    ForeignKey,
    Index,
    Integer,
    MetaData,
    Text,
    UniqueConstraint,
    Uuid,
    func,
    text,
)
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column, relationship


class Base(DeclarativeBase):
    """Shared SQLAlchemy declarative base for all persistence models."""

    metadata = MetaData(
        naming_convention={
            "ix": "ix_%(column_0_label)s",
            "uq": "uq_%(table_name)s_%(column_0_name)s",
            "ck": "ck_%(table_name)s_%(constraint_name)s",
            "fk": "fk_%(table_name)s_%(column_0_name)s_%(referred_table_name)s",
            "pk": "pk_%(table_name)s",
        }
    )


class UUIDPrimaryKeyMixin:
    id: Mapped[UUID] = mapped_column(Uuid, primary_key=True, default=uuid4)


class CreatedAtMixin:
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(UTC),
        nullable=False,
        server_default=func.now(),
    )


class RoleRecord(Base):
    __tablename__: ClassVar[str] = "roles"
    __table_args__ = (UniqueConstraint("name", name="uq_roles_name"),)

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    name: Mapped[str] = mapped_column(Text, nullable=False)

    users: Mapped[list[UserRecord]] = relationship(back_populates="role")


class ScheduleTypeRecord(Base):
    __tablename__: ClassVar[str] = "schedule_types"
    __table_args__ = (UniqueConstraint("name", name="uq_schedule_types_name"),)

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    name: Mapped[str] = mapped_column(Text, nullable=False)

    schedules: Mapped[list[ScheduleRecord]] = relationship(back_populates="schedule_type")


class ScheduleStatusRecord(Base):
    __tablename__: ClassVar[str] = "schedule_statuses"
    __table_args__ = (UniqueConstraint("name", name="uq_schedule_statuses_name"),)

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    name: Mapped[str] = mapped_column(Text, nullable=False)

    schedules: Mapped[list[ScheduleRecord]] = relationship(back_populates="schedule_status")
    previous_audit_logs: Mapped[list[AuditLogRecord]] = relationship(
        back_populates="previous_status",
        foreign_keys="AuditLogRecord.previous_status_id",
    )
    new_audit_logs: Mapped[list[AuditLogRecord]] = relationship(
        back_populates="new_status",
        foreign_keys="AuditLogRecord.new_status_id",
    )


class InviteStatusRecord(Base):
    __tablename__: ClassVar[str] = "invite_statuses"
    __table_args__ = (UniqueConstraint("name", name="uq_invite_statuses_name"),)

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    name: Mapped[str] = mapped_column(Text, nullable=False)

    panelist_assignments: Mapped[list[PanelistAssignmentRecord]] = relationship(
        back_populates="invite_status"
    )


class UserRecord(UUIDPrimaryKeyMixin, CreatedAtMixin, Base):
    __tablename__: ClassVar[str] = "users"
    __table_args__ = (
        Index("ix_users_role_id", "role_id"),
        Index("ix_users_email", "email"),
        UniqueConstraint("email", name="uq_users_email"),
    )

    role_id: Mapped[int] = mapped_column(ForeignKey("roles.id"), nullable=False)
    full_name: Mapped[str] = mapped_column(Text, nullable=False)
    email: Mapped[str] = mapped_column(Text, nullable=False)
    avatar_url: Mapped[str | None] = mapped_column(Text, nullable=True)
    registration_completed: Mapped[bool] = mapped_column(
        Boolean,
        nullable=False,
        default=False,
        server_default=text("false"),
    )

    role: Mapped[RoleRecord] = relationship(back_populates="users")
    student_schedules: Mapped[list[ScheduleRecord]] = relationship(
        back_populates="student",
        foreign_keys="ScheduleRecord.student_id",
    )
    adviser_schedules: Mapped[list[ScheduleRecord]] = relationship(
        back_populates="adviser",
        foreign_keys="ScheduleRecord.adviser_id",
    )
    panelist_assignments: Mapped[list[PanelistAssignmentRecord]] = relationship(
        back_populates="panelist",
        foreign_keys="PanelistAssignmentRecord.panelist_id",
    )
    availability_slots: Mapped[list[AvailabilitySlotRecord]] = relationship(
        back_populates="adviser",
        foreign_keys="AvailabilitySlotRecord.adviser_id",
    )
    notifications: Mapped[list[NotificationRecord]] = relationship(back_populates="user")
    audit_logs: Mapped[list[AuditLogRecord]] = relationship(
        back_populates="changed_by_user",
        foreign_keys="AuditLogRecord.changed_by",
    )


class ScheduleRecord(UUIDPrimaryKeyMixin, CreatedAtMixin, Base):
    __tablename__: ClassVar[str] = "schedules"
    __table_args__ = (
        Index("ix_schedules_student_id", "student_id"),
        Index("ix_schedules_adviser_id", "adviser_id"),
        Index("ix_schedules_status_id", "status_id"),
        Index("ix_schedules_type_id", "type_id"),
        Index("ix_schedules_scheduled_at", "scheduled_at"),
    )

    student_id: Mapped[UUID] = mapped_column(ForeignKey("users.id"), nullable=False)
    adviser_id: Mapped[UUID] = mapped_column(ForeignKey("users.id"), nullable=False)
    type_id: Mapped[int] = mapped_column(ForeignKey("schedule_types.id"), nullable=False)
    status_id: Mapped[int] = mapped_column(ForeignKey("schedule_statuses.id"), nullable=False)
    topic: Mapped[str] = mapped_column(Text, nullable=False)
    requested_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(UTC),
        nullable=False,
        server_default=func.now(),
    )
    scheduled_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    google_calendar_event_id: Mapped[str | None] = mapped_column(Text, nullable=True)
    meet_link: Mapped[str | None] = mapped_column(Text, nullable=True)

    student: Mapped[UserRecord] = relationship(
        back_populates="student_schedules",
        foreign_keys=[student_id],
    )
    adviser: Mapped[UserRecord] = relationship(
        back_populates="adviser_schedules",
        foreign_keys=[adviser_id],
    )
    schedule_type: Mapped[ScheduleTypeRecord] = relationship(back_populates="schedules")
    schedule_status: Mapped[ScheduleStatusRecord] = relationship(back_populates="schedules")
    panelist_assignments: Mapped[list[PanelistAssignmentRecord]] = relationship(
        back_populates="schedule"
    )
    notifications: Mapped[list[NotificationRecord]] = relationship(back_populates="schedule")
    audit_logs: Mapped[list[AuditLogRecord]] = relationship(back_populates="schedule")


class PanelistAssignmentRecord(UUIDPrimaryKeyMixin, Base):
    __tablename__: ClassVar[str] = "panelist_assignments"
    __table_args__ = (
        Index("ix_panelist_assignments_schedule_id", "schedule_id"),
        Index("ix_panelist_assignments_panelist_id", "panelist_id"),
        UniqueConstraint(
            "schedule_id",
            "panelist_id",
            name="uq_panelist_assignments_schedule_id_panelist_id",
        ),
    )

    schedule_id: Mapped[UUID] = mapped_column(ForeignKey("schedules.id"), nullable=False)
    panelist_id: Mapped[UUID] = mapped_column(ForeignKey("users.id"), nullable=False)
    invite_status_id: Mapped[int] = mapped_column(ForeignKey("invite_statuses.id"), nullable=False)

    schedule: Mapped[ScheduleRecord] = relationship(back_populates="panelist_assignments")
    panelist: Mapped[UserRecord] = relationship(
        back_populates="panelist_assignments",
        foreign_keys=[panelist_id],
    )
    invite_status: Mapped[InviteStatusRecord] = relationship(back_populates="panelist_assignments")


class NotificationRecord(UUIDPrimaryKeyMixin, CreatedAtMixin, Base):
    __tablename__: ClassVar[str] = "notifications"
    __table_args__ = (
        Index("ix_notifications_user_id", "user_id"),
        Index("ix_notifications_is_read", "is_read"),
        Index("ix_notifications_created_at", "created_at"),
    )

    user_id: Mapped[UUID] = mapped_column(ForeignKey("users.id"), nullable=False)
    schedule_id: Mapped[UUID | None] = mapped_column(
        ForeignKey("schedules.id", ondelete="SET NULL"),
        nullable=True,
    )
    message: Mapped[str] = mapped_column(Text, nullable=False)
    is_read: Mapped[bool] = mapped_column(
        Boolean,
        nullable=False,
        default=False,
        server_default=text("false"),
    )

    user: Mapped[UserRecord] = relationship(back_populates="notifications")
    schedule: Mapped[ScheduleRecord] = relationship(back_populates="notifications")


class AvailabilitySlotRecord(UUIDPrimaryKeyMixin, Base):
    __tablename__: ClassVar[str] = "availability_slots"
    __table_args__ = (
        CheckConstraint("slot_end > slot_start", name="ck_availability_slots_slot_end_after_start"),
        Index("ix_availability_slots_adviser_id", "adviser_id"),
        Index("ix_availability_slots_slot_start", "slot_start"),
        Index("ix_availability_slots_adviser_id_slot_start", "adviser_id", "slot_start"),
    )

    adviser_id: Mapped[UUID] = mapped_column(ForeignKey("users.id"), nullable=False)
    slot_start: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    slot_end: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    is_blocked: Mapped[bool] = mapped_column(
        Boolean,
        nullable=False,
        default=False,
        server_default=text("false"),
    )

    adviser: Mapped[UserRecord] = relationship(
        back_populates="availability_slots",
        foreign_keys=[adviser_id],
    )


class AuditLogRecord(UUIDPrimaryKeyMixin, Base):
    __tablename__: ClassVar[str] = "audit_logs"
    __table_args__ = (
        Index("ix_audit_logs_schedule_id", "schedule_id"),
        Index("ix_audit_logs_changed_by", "changed_by"),
        Index("ix_audit_logs_changed_at", "changed_at"),
    )

    schedule_id: Mapped[UUID] = mapped_column(ForeignKey("schedules.id"), nullable=False)
    changed_by: Mapped[UUID] = mapped_column(ForeignKey("users.id"), nullable=False)
    previous_status_id: Mapped[int | None] = mapped_column(
        ForeignKey("schedule_statuses.id"),
        nullable=True,
    )
    new_status_id: Mapped[int] = mapped_column(ForeignKey("schedule_statuses.id"), nullable=False)
    remarks: Mapped[str | None] = mapped_column(Text, nullable=True)
    changed_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(UTC),
        nullable=False,
        server_default=func.now(),
    )

    schedule: Mapped[ScheduleRecord] = relationship(back_populates="audit_logs")
    changed_by_user: Mapped[UserRecord] = relationship(
        back_populates="audit_logs",
        foreign_keys=[changed_by],
    )
    previous_status: Mapped[ScheduleStatusRecord | None] = relationship(
        back_populates="previous_audit_logs",
        foreign_keys=[previous_status_id],
    )
    new_status: Mapped[ScheduleStatusRecord] = relationship(
        back_populates="new_audit_logs",
        foreign_keys=[new_status_id],
    )
