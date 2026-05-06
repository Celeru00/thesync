"use client";

import { useQuery, type UseQueryResult } from "@tanstack/react-query";

import {
  fetchGoogleCalendarOverlayEvents,
  fetchGoogleCalendarOverlaySources,
  type GoogleCalendarOverlayEvent,
  type GoogleCalendarOverlaySource,
} from "@/lib/calendar/backend";
import { createClient } from "@/lib/supabase/client";

const supabase = createClient();

async function getAccessToken() {
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session?.access_token) {
    throw new Error("Authentication required.");
  }

  return session.access_token;
}

export const calendarOverlayQueryKeys = {
  sources: ["calendar-overlay-sources"] as const,
  events: (userIds: string[]) =>
    ["calendar-overlay-events", [...userIds].sort()] as const,
};

export function useCalendarOverlaySources(
  enabled = true,
): UseQueryResult<GoogleCalendarOverlaySource[], Error> {
  return useQuery({
    queryKey: calendarOverlayQueryKeys.sources,
    queryFn: async () =>
      fetchGoogleCalendarOverlaySources(await getAccessToken()),
    enabled,
  });
}

export function useCalendarOverlayEvents(
  userIds: string[],
  enabled = true,
): UseQueryResult<GoogleCalendarOverlayEvent[], Error> {
  const normalizedUserIds = [...userIds].sort();

  return useQuery({
    queryKey: calendarOverlayQueryKeys.events(normalizedUserIds),
    queryFn: async () =>
      fetchGoogleCalendarOverlayEvents(
        await getAccessToken(),
        normalizedUserIds,
      ),
    enabled: enabled && normalizedUserIds.length > 0,
  });
}
