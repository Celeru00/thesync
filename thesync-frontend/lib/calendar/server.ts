import "server-only";

import { cache } from "react";

import {
  BackendCalendarError,
  fetchGoogleCalendarConnection,
  fetchGoogleCalendarEvents,
  type GoogleCalendarConnectionStatus,
  type GoogleCalendarEvent,
} from "@/lib/calendar/backend";
import { getServerAuthState } from "@/lib/auth/server";

const disconnectedConnection: GoogleCalendarConnectionStatus = {
  connected: false,
  google_email: null,
  calendar_id: null,
  connected_at: null,
  updated_at: null,
};

export const getServerGoogleCalendarConnection = cache(
  async (): Promise<GoogleCalendarConnectionStatus> => {
    const { session, appUser } = await getServerAuthState();

    if (!session?.access_token || !appUser) {
      return disconnectedConnection;
    }

    return fetchGoogleCalendarConnection(session.access_token);
  },
);

export async function getServerGoogleCalendarEvents(params?: {
  timeMin?: string;
  timeMax?: string;
}): Promise<GoogleCalendarEvent[]> {
  const { session, appUser } = await getServerAuthState();

  if (!session?.access_token || !appUser) {
    return [];
  }

  return fetchGoogleCalendarEvents(session.access_token, params);
}

export async function getServerGoogleCalendarEventsSafe(params?: {
  timeMin?: string;
  timeMax?: string;
}): Promise<{
  events: GoogleCalendarEvent[];
  errorMessage: string | null;
}> {
  try {
    return {
      events: await getServerGoogleCalendarEvents(params),
      errorMessage: null,
    };
  } catch (error) {
    if (error instanceof BackendCalendarError) {
      return {
        events: [],
        errorMessage: error.message,
      };
    }

    throw error;
  }
}
