import { getApiBaseUrl } from "@/lib/api/env";

export type GoogleCalendarConnectionStatus = {
  connected: boolean;
  google_email: string | null;
  calendar_id: string | null;
  connected_at: string | null;
  updated_at: string | null;
};

export type GoogleCalendarEvent = {
  event_id: string;
  summary: string | null;
  status: string;
  starts_at: string | null;
  ends_at: string | null;
  html_link: string | null;
  meet_link: string | null;
};

export class BackendCalendarError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = "BackendCalendarError";
    this.status = status;
  }
}

async function parseBackendCalendarError(response: Response) {
  let message =
    "We couldn't complete the Google Calendar request. Please try again.";

  try {
    const payload = (await response.json()) as {
      detail?: string;
    };

    if (typeof payload.detail === "string" && payload.detail) {
      message = payload.detail;
    }
  } catch {
    // Ignore parse failures and fall back to the generic message.
  }

  return new BackendCalendarError(message, response.status);
}

function authorizedHeaders(accessToken: string) {
  return {
    Authorization: `Bearer ${accessToken}`,
  };
}

export async function fetchGoogleCalendarConnection(
  accessToken: string,
): Promise<GoogleCalendarConnectionStatus> {
  const response = await fetch(
    `${getApiBaseUrl()}/api/calendar/google/connection`,
    {
      headers: authorizedHeaders(accessToken),
      cache: "no-store",
    },
  );

  if (!response.ok) {
    throw await parseBackendCalendarError(response);
  }

  return (await response.json()) as GoogleCalendarConnectionStatus;
}

export async function connectGoogleCalendar(
  accessToken: string,
  payload: {
    provider_access_token: string;
    provider_refresh_token: string;
    google_email: string;
    calendar_id?: string;
    token_type?: string | null;
    scopes?: string | null;
  },
): Promise<GoogleCalendarConnectionStatus> {
  const response = await fetch(
    `${getApiBaseUrl()}/api/calendar/google/connect`,
    {
      method: "POST",
      headers: {
        ...authorizedHeaders(accessToken),
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    },
  );

  if (!response.ok) {
    throw await parseBackendCalendarError(response);
  }

  return (await response.json()) as GoogleCalendarConnectionStatus;
}

export async function disconnectGoogleCalendar(
  accessToken: string,
): Promise<GoogleCalendarConnectionStatus> {
  const response = await fetch(
    `${getApiBaseUrl()}/api/calendar/google/connection`,
    {
      method: "DELETE",
      headers: authorizedHeaders(accessToken),
    },
  );

  if (!response.ok) {
    throw await parseBackendCalendarError(response);
  }

  return (await response.json()) as GoogleCalendarConnectionStatus;
}

export async function fetchGoogleCalendarEvents(
  accessToken: string,
  params?: {
    timeMin?: string;
    timeMax?: string;
  },
): Promise<GoogleCalendarEvent[]> {
  const search = new URLSearchParams();
  if (params?.timeMin) {
    search.set("time_min", params.timeMin);
  }
  if (params?.timeMax) {
    search.set("time_max", params.timeMax);
  }

  const query = search.size ? `?${search.toString()}` : "";
  const response = await fetch(
    `${getApiBaseUrl()}/api/calendar/google/events${query}`,
    {
      headers: authorizedHeaders(accessToken),
      cache: "no-store",
    },
  );

  if (!response.ok) {
    throw await parseBackendCalendarError(response);
  }

  return (await response.json()) as GoogleCalendarEvent[];
}
