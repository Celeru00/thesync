"use client";

import {
  useMutation,
  useQuery,
  useQueryClient,
  type UseMutationResult,
  type UseQueryResult,
} from "@tanstack/react-query";

import {
  createSlot,
  deleteSlot,
  getCommonFreeSlots,
  getFreeSlots,
  listMySlots,
  toggleSlotBlocked,
  type AvailabilityRule,
  type AvailabilitySlot,
  type CreateAvailabilityRuleRequest,
} from "@/lib/api";

export const availabilityQueryKeys = {
  all: ["availability"] as const,
  mySlots: () => ["availability", "my-slots"] as const,
  freeSlots: (adviserIds: string[], date?: string) =>
    ["availability", "free-slots", adviserIds, date ?? null] as const,
};

function normalizeAdviserIds(adviserIds?: string[]): string[] {
  return Array.from(
    new Set(
      adviserIds?.map((adviserId) => adviserId.trim()).filter(Boolean) ?? [],
    ),
  ).sort();
}

export function useMySlots(): UseQueryResult<AvailabilityRule[], Error> {
  return useQuery({
    queryKey: availabilityQueryKeys.mySlots(),
    queryFn: listMySlots,
  });
}

export function useFreeSlots(
  adviserIds?: string[],
  date?: string,
): UseQueryResult<AvailabilitySlot[], Error> {
  const normalizedAdviserIds = normalizeAdviserIds(adviserIds);

  return useQuery({
    queryKey: availabilityQueryKeys.freeSlots(normalizedAdviserIds, date),
    queryFn: () =>
      normalizedAdviserIds.length === 1
        ? getFreeSlots(normalizedAdviserIds[0], date)
        : getCommonFreeSlots(normalizedAdviserIds, date),
    enabled: Boolean(normalizedAdviserIds.length > 0 && date),
  });
}

export function useCreateSlot(): UseMutationResult<
  AvailabilityRule,
  Error,
  CreateAvailabilityRuleRequest
> {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createSlot,
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: availabilityQueryKeys.mySlots(),
      });
    },
  });
}

export function useToggleSlotBlocked(): UseMutationResult<
  AvailabilityRule,
  Error,
  { id: string; is_blocked: boolean },
  AvailabilityMutationContext
> {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, is_blocked }) => toggleSlotBlocked(id, is_blocked),
    onMutate: async ({ id, is_blocked }) => {
      await queryClient.cancelQueries({
        queryKey: availabilityQueryKeys.mySlots(),
      });

      const previousSlots = queryClient.getQueryData<AvailabilityRule[]>(
        availabilityQueryKeys.mySlots(),
      );

      queryClient.setQueryData<AvailabilityRule[]>(
        availabilityQueryKeys.mySlots(),
        (current) =>
          current?.map((slot) =>
            slot.id === id ? { ...slot, is_blocked } : slot,
          ) ?? [],
      );

      return { previousSlots };
    },
    onError: (_error, _variables, context) => {
      if (!context) {
        return;
      }

      queryClient.setQueryData(
        availabilityQueryKeys.mySlots(),
        context.previousSlots,
      );
    },
    onSuccess: (slot) => {
      queryClient.setQueryData<AvailabilityRule[]>(
        availabilityQueryKeys.mySlots(),
        (current) =>
          current?.map((item) => (item.id === slot.id ? slot : item)) ?? [slot],
      );
    },
    onSettled: async () => {
      await queryClient.invalidateQueries({
        queryKey: availabilityQueryKeys.mySlots(),
      });
    },
  });
}

export function useDeleteSlot(): UseMutationResult<void, Error, string> {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteSlot,
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: availabilityQueryKeys.mySlots(),
      });
    },
  });
}

type AvailabilityMutationContext = {
  previousSlots: AvailabilityRule[] | undefined;
};
