from __future__ import annotations

from datetime import time
from uuid import UUID

from sqlalchemy import select
from sqlalchemy.orm import Session

from repository.orm import AvailabilitySlotRecord


def create_availability_slot(
    session: Session,
    *,
    adviser_id: UUID,
    day_of_week: int,
    start_time: time,
    end_time: time,
    is_blocked: bool = False,
) -> AvailabilitySlotRecord:
    slot = AvailabilitySlotRecord(
        adviser_id=adviser_id,
        day_of_week=day_of_week,
        start_time=start_time,
        end_time=end_time,
        is_blocked=is_blocked,
    )

    session.add(slot)
    session.commit()
    session.refresh(slot)

    return slot


def list_availability_slots(
    session: Session,
    *,
    adviser_id: UUID,
) -> list[AvailabilitySlotRecord]:
    statement = (
        select(AvailabilitySlotRecord)
        .where(AvailabilitySlotRecord.adviser_id == adviser_id)
        .order_by(AvailabilitySlotRecord.day_of_week, AvailabilitySlotRecord.start_time)
    )

    return list(session.execute(statement).scalars().all())


def get_availability_slot(
    session: Session,
    *,
    slot_id: UUID,
) -> AvailabilitySlotRecord | None:
    statement = select(AvailabilitySlotRecord).where(AvailabilitySlotRecord.id == slot_id)

    return session.execute(statement).scalar_one_or_none()


def update_availability_slot_blocked_status(
    session: Session,
    *,
    slot: AvailabilitySlotRecord,
    is_blocked: bool,
) -> AvailabilitySlotRecord:
    slot.is_blocked = is_blocked

    session.add(slot)
    session.commit()
    session.refresh(slot)

    return slot


def delete_availability_slot(
    session: Session,
    *,
    slot: AvailabilitySlotRecord,
) -> None:
    session.delete(slot)
    session.commit()
