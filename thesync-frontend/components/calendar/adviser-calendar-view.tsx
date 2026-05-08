"use client";

import { useMemo } from "react";

import { useMySlots } from "@/hooks/useAvailability";
import type { AvailabilitySlot } from "@/lib/api";
import {
  PortalCalendarView,
  type PortalCalendarEvent,
} from "@/components/calendar/portal-calendar-view";

function slotToCalendarEvent(slot: AvailabilitySlot): PortalCalendarEvent {
  const durationMs =
    new Date(slot.slot_end).getTime() - new Date(slot.slot_start).getTime();
  const durationHours = Math.max(0.5, durationMs / 3_600_000);

  return {
    id: `availability-${slot.id}`,
    startsAt: slot.slot_start,
    durationHours,
    status: "approved",
    title: slot.is_blocked ? "Blocked" : "Available",
    tone: slot.is_blocked ? "rose" : "teal",
    type: "consultation",
    ownerId: slot.adviser_id,
    ownerName: "My Availability",
    ownerRole: "adviser",
    isPrimaryCalendar: true,
  };
}

type AdviserCalendarViewProps = {
  initialEvents: PortalCalendarEvent[];
  primaryCalendarLabel: string;
  primaryCalendarOwnerId: string;
};

export function AdviserCalendarView({
  initialEvents,
  primaryCalendarLabel,
  primaryCalendarOwnerId,
}: AdviserCalendarViewProps) {
  const { data: mySlots = [] } = useMySlots();

  const availabilityEvents = useMemo(
    () => mySlots.map(slotToCalendarEvent),
    [mySlots],
  );

  const allEvents = useMemo(
    () => [...initialEvents, ...availabilityEvents],
    [initialEvents, availabilityEvents],
  );

  return (
    <PortalCalendarView
      portalRole="adviser"
      events={allEvents}
      primaryCalendarLabel={primaryCalendarLabel}
      primaryCalendarOwnerId={primaryCalendarOwnerId}
    />
  );
}
