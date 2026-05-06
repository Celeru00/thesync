"use client";

import {
  useMutation,
  useQuery,
  useQueryClient,
  type UseMutationResult,
  type UseQueryResult,
} from "@tanstack/react-query";

import {
  approveSchedule,
  cancelSchedule,
  createSchedule,
  getSchedule,
  listSchedules,
  rejectSchedule,
  rescheduleSchedule,
  type CreateScheduleRequest,
  type ListSchedulesFilters,
  type Schedule,
  type ScheduleListResponse,
} from "@/lib/api";

export const scheduleQueryKeys = {
  all: ["schedules"] as const,
  list: (filters?: ListSchedulesFilters) =>
    ["schedules", normalizeScheduleFilters(filters)] as const,
  detail: (id: string) => ["schedule", id] as const,
};

export function useSchedules(
  filters?: ListSchedulesFilters,
): UseQueryResult<ScheduleListResponse, Error> {
  return useQuery({
    queryKey: scheduleQueryKeys.list(filters),
    queryFn: () => listSchedules(filters),
  });
}

export function useSchedule(id: string): UseQueryResult<Schedule, Error> {
  return useQuery({
    queryKey: scheduleQueryKeys.detail(id),
    queryFn: () => getSchedule(id),
    enabled: Boolean(id),
  });
}

export function useCreateSchedule(): UseMutationResult<
  Schedule,
  Error,
  CreateScheduleRequest
> {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createSchedule,
    onSuccess: async (schedule) => {
      await queryClient.invalidateQueries({
        queryKey: scheduleQueryKeys.all,
      });
      queryClient.setQueryData(scheduleQueryKeys.detail(schedule.id), schedule);
    },
  });
}

export function useCancelSchedule(): UseMutationResult<
  Schedule,
  Error,
  string
> {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: cancelSchedule,
    onSuccess: async (schedule, scheduleId) => {
      queryClient.setQueryData(scheduleQueryKeys.detail(scheduleId), schedule);
      await queryClient.invalidateQueries({
        queryKey: scheduleQueryKeys.all,
      });
    },
  });
}

export function useApproveSchedule(): UseMutationResult<
  Schedule,
  Error,
  string
> {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: approveSchedule,
    onSuccess: async (schedule, scheduleId) => {
      queryClient.setQueryData(scheduleQueryKeys.detail(scheduleId), schedule);
      await queryClient.invalidateQueries({
        queryKey: scheduleQueryKeys.all,
      });
    },
  });
}

export function useRejectSchedule(): UseMutationResult<
  Schedule,
  Error,
  { id: string; remarks?: string }
> {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, remarks }) => rejectSchedule(id, remarks),
    onSuccess: async (schedule, variables) => {
      queryClient.setQueryData(
        scheduleQueryKeys.detail(variables.id),
        schedule,
      );
      await queryClient.invalidateQueries({
        queryKey: scheduleQueryKeys.all,
      });
    },
  });
}

export function useRescheduleSchedule(): UseMutationResult<
  Schedule,
  Error,
  { id: string; new_scheduled_at: string }
> {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, new_scheduled_at }) =>
      rescheduleSchedule(id, new_scheduled_at),
    onSuccess: async (schedule, variables) => {
      queryClient.setQueryData(
        scheduleQueryKeys.detail(variables.id),
        schedule,
      );
      await queryClient.invalidateQueries({
        queryKey: scheduleQueryKeys.all,
      });
    },
  });
}

function normalizeScheduleFilters(filters?: ListSchedulesFilters) {
  return {
    status: filters?.status,
    type: filters?.type,
    from: filters?.from,
    to: filters?.to,
    page: filters?.page,
    limit: filters?.limit,
  };
}
