import "server-only";

import { cache } from "react";
import { redirect } from "next/navigation";
import type { Session, User } from "@supabase/supabase-js";

import {
  BackendAuthError,
  fetchCurrentAppUser,
  type AppSessionUser,
} from "@/lib/auth/backend";
import { getDashboardPathForRole, type AppRole } from "@/lib/auth/profile";
import { isRecoverableSessionError } from "@/lib/supabase/errors";
import { createClient } from "@/lib/supabase/server";

type ServerAuthState = {
  authUser: User | null;
  session: Session | null;
  appUser: AppSessionUser | null;
};

const resolveSupabaseAuthState = cache(
  async (): Promise<{
    authUser: User | null;
    session: Session | null;
  }> => {
    const supabase = await createClient();
    let user: User | null = null;
    let session: Session | null = null;

    try {
      const {
        data: { user: resolvedUser },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError) {
        throw userError;
      }

      user = resolvedUser;
      const {
        data: { session: resolvedSession },
        error: sessionError,
      } = await supabase.auth.getSession();

      if (sessionError) {
        throw sessionError;
      }

      session = resolvedSession;
    } catch (error) {
      if (isRecoverableSessionError(error)) {
        return {
          authUser: null,
          session: null,
        };
      }

      throw error;
    }

    if (!user || !session?.access_token) {
      return {
        authUser: user ?? null,
        session: session ?? null,
      };
    }

    return {
      authUser: user,
      session,
    };
  },
);

export const getServerAuthState = cache(async (): Promise<ServerAuthState> => {
  const { authUser, session } = await resolveSupabaseAuthState();

  if (!authUser || !session?.access_token) {
    return {
      authUser,
      session,
      appUser: null,
    };
  }

  return {
    authUser,
    session,
    appUser: await fetchCurrentAppUser(session.access_token),
  };
});

export const getPublicServerAuthState = cache(
  async (): Promise<ServerAuthState> => {
    const { authUser, session } = await resolveSupabaseAuthState();

    if (!authUser || !session?.access_token) {
      return {
        authUser,
        session,
        appUser: null,
      };
    }

    try {
      return await getServerAuthState();
    } catch (error) {
      if (!(error instanceof BackendAuthError)) {
        throw error;
      }

      console.error("[frontend-auth] public_auth_state_fallback", error);
      return {
        authUser,
        session,
        appUser: null,
      };
    }
  },
);

export async function getRequiredAppUser() {
  const { appUser, authUser } = await getServerAuthState();

  if (!authUser) {
    redirect("/login");
  }

  if (!appUser) {
    redirect("/register?flow=signup");
  }

  return appUser;
}

export async function requireAppRole(role: AppRole) {
  const currentUser = await getRequiredAppUser();

  if (currentUser.app_role !== role) {
    redirect(getDashboardPathForRole(currentUser.app_role));
  }

  return currentUser;
}
