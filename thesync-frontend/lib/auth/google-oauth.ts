"use client";

import { createClient } from "@/lib/supabase/client";
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
  const redirectUrl = new URL("/auth/callback", window.location.origin);

  redirectUrl.searchParams.set("flow", flow);

  if (role) {
    redirectUrl.searchParams.set("role", role);
  }

  return supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: redirectUrl.toString(),
    },
  });
}
