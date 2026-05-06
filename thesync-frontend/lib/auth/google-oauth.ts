"use client";

import { createClient } from "@/lib/supabase/client";
import { buildAuthCallbackUrl, getBrowserAppOrigin } from "@/lib/auth/app-url";
import type { AppRole } from "@/lib/auth/profile";

export type GoogleAuthFlow = "login" | "signup";

export async function startGoogleAuth({
  flow,
  role,
}: {
  flow: GoogleAuthFlow;
  role?: AppRole;
}) {
  const supabase = createClient();
  const redirectUrl = buildAuthCallbackUrl(getBrowserAppOrigin(), {
    flow,
    role: role ?? null,
  });

  return supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: redirectUrl.toString(),
    },
  });
}

export async function startGoogleCalendarConnect({
  nextPath,
}: {
  nextPath: string;
}) {
  const supabase = createClient();
  const redirectUrl = buildAuthCallbackUrl(getBrowserAppOrigin(), {
    flow: "login",
  });

  redirectUrl.searchParams.set("intent", "calendar-connect");
  redirectUrl.searchParams.set("next", nextPath);

  return supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: redirectUrl.toString(),
      scopes: "https://www.googleapis.com/auth/calendar",
      queryParams: {
        access_type: "offline",
        include_granted_scopes: "true",
        prompt: "consent",
      },
    },
  });
}
