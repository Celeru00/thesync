import "server-only";

import { cache } from "react";
import { redirect } from "next/navigation";
import type { Session, User } from "@supabase/supabase-js";

import { getDashboardPathForRole, type AppRole } from "@/lib/auth/profile";
import { createClient } from "@/lib/supabase/server";

const DEFAULT_BACKEND_URL = "http://localhost:8000";

export type AppSessionUser = {
  id: string;
  role_id: number;
  full_name: string;
  email: string;
  avatar_url: string | null;
  created_at: string;
  app_role: AppRole;
};

type ServerAuthState = {
  authUser: User | null;
  session: Session | null;
  appUser: AppSessionUser | null;
};

function getApiBaseUrl() {
  return (
    process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/+$/, "") ??
    DEFAULT_BACKEND_URL
  );
}

async function fetchCurrentAppUser(
  accessToken: string,
): Promise<AppSessionUser | null> {
  const response = await fetch(`${getApiBaseUrl()}/api/v1/auth/me`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
    cache: "no-store",
  });

  if (response.status === 401) {
    return null;
  }

  if (!response.ok) {
    throw new Error(
      `Backend auth lookup failed with status ${response.status}.`,
    );
  }

  return (await response.json()) as AppSessionUser;
}

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
