import { NextResponse } from "next/server";

import {
  BackendCalendarError,
  disconnectGoogleCalendar,
} from "@/lib/calendar/backend";
import { createClient } from "@/lib/supabase/server";

export async function POST() {
  const supabase = await createClient();
  const {
    data: { session },
    error: sessionError,
  } = await supabase.auth.getSession();

  if (sessionError || !session?.access_token) {
    return NextResponse.json(
      {
        message:
          "Your sign-in session could not be found. Please sign in again.",
      },
      { status: 401 },
    );
  }

  try {
    const status = await disconnectGoogleCalendar(session.access_token);
    return NextResponse.json(status);
  } catch (error) {
    if (error instanceof BackendCalendarError) {
      return NextResponse.json(
        {
          message: error.message,
        },
        { status: error.status },
      );
    }

    throw error;
  }
}
