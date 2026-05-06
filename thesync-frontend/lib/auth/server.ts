import "server-only";

import { cache } from "react";
import { redirect } from "next/navigation";
import type { Session, User } from "@supabase/supabase-js";

import { fetchCurrentAppUser, type AppSessionUser } from "@/lib/auth/backend";
import { getDashboardPathForRole, type AppRole } from "@/lib/auth/profile";
import { createClient } from "@/lib/supabase/server";

type ServerAuthState = {
  authUser: User | null;
  session: Session | null;
  appUser: AppSessionUser | null;
};

export const getServerAuthState = cache(async (): Promise<ServerAuthState> => {
  const supabase = await createClient();
  const [
    {
      data: { user },
    },
    {
      data: { session },
    },
  ] = await Promise.all([supabase.auth.getUser(), supabase.auth.getSession()]);

  if (!user || !session?.access_token) {
    return {
      authUser: user ?? null,
      session: session ?? null,
      appUser: null,
    };
  }

  return {
    authUser: user,
    session,
    appUser: await fetchCurrentAppUser(session.access_token),
  };
});

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
