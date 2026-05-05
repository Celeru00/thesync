import type { StudentDashboardData } from "@/types/dashboard";

import { createClient } from "@/lib/supabase/client";

const BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8000";

let supabaseClient: ReturnType<typeof createClient> | null = null;

function getSupabaseClient() {
  if (typeof window === "undefined") {
    return null;
  }

  supabaseClient ??= createClient();
  return supabaseClient;
}

async function buildHeaders(initHeaders?: HeadersInit) {
  const headers = new Headers(initHeaders);

  if (!headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  const supabase = getSupabaseClient();

  if (!supabase) {
    return headers;
  }

  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (session?.access_token) {
    headers.set("Authorization", `Bearer ${session.access_token}`);
  }

  return headers;
}

async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const headers = await buildHeaders(init?.headers);
  const res = await fetch(`${BASE_URL}${path}`, {
    credentials: "include",
    ...init,
    headers,
  });
  if (!res.ok) throw new Error(`API error ${res.status}: ${path}`);
  return res.json() as Promise<T>;
}

export const studentApi = {
  getDashboard: (): Promise<StudentDashboardData> =>
    apiFetch<StudentDashboardData>("/api/v1/student/dashboard"),
};
