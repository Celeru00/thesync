import { AdviserCalendarView } from "@/components/calendar/adviser-calendar-view";
import { type PortalCalendarEvent } from "@/components/calendar/portal-calendar-view";
import { CalendarConnectionGate } from "@/components/calendar/calendar-connection-gate";
import { getCalendarStatusMessage } from "@/lib/calendar/messages";
import {
  getServerGoogleCalendarConnection,
  getServerGoogleCalendarEvents,
  getServerGoogleCalendarEventsSafe,
} from "@/lib/calendar/server";
import { requireAppRole } from "@/lib/auth/server";

type AdviserCalendarPageProps = {
  searchParams: Promise<{
    calendar?: string | string[];
  }>;
};

function mapGoogleEventsToPortalEvents(
  events: Awaited<ReturnType<typeof getServerGoogleCalendarEvents>>,
  source: {
    ownerId: string;
    ownerName: string;
    ownerRole: "adviser";
  },
): PortalCalendarEvent[] {
  return events.map((event) => {
    const startsAt = event.starts_at ?? new Date().toISOString();
    const endsAt = event.ends_at ?? startsAt;
    const durationMs =
      new Date(endsAt).getTime() - new Date(startsAt).getTime();
    const durationHours = Math.max(
      0.5,
      Math.round(durationMs / (1000 * 60 * 30) || 2) / 2,
    );
    const title = event.summary?.trim() || "Google Calendar Event";
    const isDefense = title.toLowerCase().includes("defense");

    return {
      id: event.event_id,
      startsAt,
      durationHours,
      status: event.status === "confirmed" ? "approved" : "pending",
      title,
      tone: isDefense ? "violet" : "brand",
      type: isDefense ? "defense" : "consultation",
      ownerId: source.ownerId,
      ownerName: source.ownerName,
      ownerRole: source.ownerRole,
      isPrimaryCalendar: true,
    };
  });
}

export default async function AdviserCalendarPage({
  searchParams,
}: AdviserCalendarPageProps) {
  const currentUser = await requireAppRole("adviser");
  const connection = await getServerGoogleCalendarConnection();
  const params = await searchParams;
  const calendarStatus = Array.isArray(params.calendar)
    ? params.calendar[0]
    : params.calendar;

  if (!connection.connected) {
    return (
      <CalendarConnectionGate
        role="adviser"
        nextPath="/adviser/calendar"
        statusMessage={getCalendarStatusMessage(calendarStatus)}
      />
    );
  }

  const { events: googleEvents, errorMessage } =
    await getServerGoogleCalendarEventsSafe();

  if (errorMessage) {
    return (
      <CalendarConnectionGate
        role="adviser"
        nextPath="/adviser/calendar"
        statusMessage={errorMessage}
      />
    );
  }

  const events = mapGoogleEventsToPortalEvents(googleEvents, {
    ownerId: currentUser.id,
    ownerName: currentUser.full_name,
    ownerRole: "adviser",
  });

  return (
    <AdviserCalendarView
      initialEvents={events}
      primaryCalendarLabel={currentUser.full_name}
      primaryCalendarOwnerId={currentUser.id}
    />
  );
}
