from __future__ import annotations

from model.base import LookupModel


class Role(LookupModel):
    """System role assigned to a user."""


class ScheduleType(LookupModel):
    """Lookup entry describing the type of academic schedule."""


class ScheduleStatus(LookupModel):
    """Lookup entry describing the state of a schedule."""


class InviteStatus(LookupModel):
    """Lookup entry describing the panelist invite state."""
