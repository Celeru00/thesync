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
  try {
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session?.access_token) {
      throw new Error("Authentication required.");
    }

    return session.access_token;
  } catch (error) {
    if (process.env.NODE_ENV === "development") {
      console.warn("Unable to retrieve Supabase access token:", error);
      throw new Error("Authentication unavailable.");
    }

    throw error;
  }
}

export const calendarOverlayQueryKeys = {
  sources: ["calendar-overlay-sources"] as const,
  events: (
    userIds: string[],
    params?: { timeMin?: string; timeMax?: string },
  ) =>
    [
      "calendar-overlay-events",
      [...userIds].sort(),
      params?.timeMin ?? null,
      params?.timeMax ?? null,
    ] as const,
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
  params?: { timeMin?: string; timeMax?: string },
  enabled = true,
): UseQueryResult<GoogleCalendarOverlayEvent[], Error> {
  const normalizedUserIds = [...userIds].sort();

  return useQuery({
    queryKey: calendarOverlayQueryKeys.events(normalizedUserIds, params),
    queryFn: async () =>
      fetchGoogleCalendarOverlayEvents(
        await getAccessToken(),
        normalizedUserIds,
        params,
      ),
    enabled: enabled && normalizedUserIds.length > 0,
  });
}
