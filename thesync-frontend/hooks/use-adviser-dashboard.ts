"use client";

import { useQuery, type UseQueryResult } from "@tanstack/react-query";

import { getAdviserDashboard } from "@/lib/api";
import type { AdviserDashboardData } from "@/types/dashboard";

export const adviserDashboardQueryKeys = {
  all: ["adviser-dashboard"] as const,
};

export function useAdviserDashboard(): UseQueryResult<
  AdviserDashboardData,
  Error
> {
  return useQuery({
    queryKey: adviserDashboardQueryKeys.all,
    queryFn: getAdviserDashboard,
  });
}
