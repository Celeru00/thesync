import type { StudentDashboardData } from "@/types/dashboard";

const BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8000";

async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    ...init,
  });
  if (!res.ok) throw new Error(`API error ${res.status}: ${path}`);
  return res.json() as Promise<T>;
}

export const studentApi = {
  getDashboard: (): Promise<StudentDashboardData> =>
    apiFetch<StudentDashboardData>("/api/v1/student/dashboard"),
};
