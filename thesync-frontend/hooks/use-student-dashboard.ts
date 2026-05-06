"use client";

import { useQuery, type UseQueryResult } from "@tanstack/react-query";

import { getStudentDashboard } from "@/lib/api";
import type { StudentDashboardData } from "@/types/dashboard";

export const studentDashboardQueryKeys = {
  all: ["student-dashboard"] as const,
};

export function useStudentDashboard(): UseQueryResult<
  StudentDashboardData,
  Error
> {
  return useQuery({
    queryKey: studentDashboardQueryKeys.all,
    queryFn: getStudentDashboard,
  });
}
