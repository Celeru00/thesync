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
  getFreeSlots,
  listMySlots,
  toggleSlotBlocked,
  type AvailabilitySlot,
  type CreateAvailabilitySlotRequest,
} from "@/lib/api";

export const availabilityQueryKeys = {
  all: ["availability"] as const,
  mySlots: () => ["availability", "my-slots"] as const,
  freeSlots: (adviserId?: string, date?: string) =>
    ["availability", "free-slots", adviserId ?? null, date ?? null] as const,
};

export function useMySlots(): UseQueryResult<AvailabilitySlot[], Error> {
  return useQuery({
    queryKey: availabilityQueryKeys.mySlots(),
    queryFn: listMySlots,
  });
}

export function useFreeSlots(
  adviserId?: string,
  date?: string,
): UseQueryResult<AvailabilitySlot[], Error> {
  return useQuery({
    queryKey: availabilityQueryKeys.freeSlots(adviserId, date),
    queryFn: () => getFreeSlots(adviserId!, date),
    enabled: Boolean(adviserId),
  });
}

export function useCreateSlot(): UseMutationResult<
  AvailabilitySlot,
  Error,
  CreateAvailabilitySlotRequest
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
  AvailabilitySlot,
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

      const previousSlots = queryClient.getQueryData<AvailabilitySlot[]>(
        availabilityQueryKeys.mySlots(),
      );

      queryClient.setQueryData<AvailabilitySlot[]>(
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
      queryClient.setQueryData<AvailabilitySlot[]>(
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
  previousSlots: AvailabilitySlot[] | undefined;
};
