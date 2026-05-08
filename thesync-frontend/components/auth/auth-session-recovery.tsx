"use client";

import { useEffect } from "react";

import { createClient } from "@/lib/supabase/client";
import { isRefreshTokenNotFoundError } from "@/lib/supabase/errors";

export function AuthSessionRecovery() {
  useEffect(() => {
    const supabase = createClient();

    async function recoverInvalidSession() {
      try {
        const { error } = await supabase.auth.getSession();

        if (!isRefreshTokenNotFoundError(error)) {
          return;
        }

        await supabase.auth.signOut({ scope: "local" });
      } catch (error) {
        if (process.env.NODE_ENV === "development") {
          console.warn("Supabase session recovery failed:", error);
          return;
        }

        throw error;
      }
    }

    void recoverInvalidSession();
  }, []);

  return null;
}
