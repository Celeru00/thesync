from __future__ import annotations

from datetime import datetime
from uuid import UUID

from sqlalchemy import select
from sqlalchemy.orm import Session

from repository.orm import AvailabilitySlotRecord


def create_availability_slot(
    session: Session,
    *,
    adviser_id: UUID,
    slot_start: datetime,
    slot_end: datetime,
) -> AvailabilitySlotRecord:
    slot = AvailabilitySlotRecord(
        adviser_id=adviser_id,
        slot_start=slot_start,
        slot_end=slot_end,
        is_blocked=False,
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
        .order_by(AvailabilitySlotRecord.slot_start)
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
