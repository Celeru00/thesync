"use client";

import {
  useMutation,
  useQuery,
  useQueryClient,
  type UseQueryOptions,
  type UseMutationResult,
  type UseQueryResult,
} from "@tanstack/react-query";

import {
  listNotifications,
  markAllNotificationsRead,
  markNotificationRead,
  type ListNotificationsParams,
  type MarkAllNotificationsReadResult,
  type Notification,
  type NotificationListResponse,
} from "@/lib/api";

export const notificationQueryKeys = {
  all: ["notifications"] as const,
  list: (params?: ListNotificationsParams) =>
    ["notifications", normalizeNotificationParams(params)] as const,
};

export function useNotifications(
  params?: ListNotificationsParams,
  options?: Omit<
    UseQueryOptions<NotificationListResponse, Error>,
    "queryKey" | "queryFn"
  >,
): UseQueryResult<NotificationListResponse, Error> {
  return useQuery({
    queryKey: notificationQueryKeys.list(params),
    queryFn: () => listNotifications(params),
    ...options,
  });
}

export function useMarkNotificationRead(): UseMutationResult<
  Notification,
  Error,
  string,
  NotificationMutationContext
> {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: markNotificationRead,
    onMutate: async (notificationId) => {
      await queryClient.cancelQueries({
        queryKey: notificationQueryKeys.all,
      });

      const previousLists =
        queryClient.getQueriesData<NotificationListResponse>({
          queryKey: notificationQueryKeys.all,
        });

      for (const [queryKey, response] of previousLists) {
        if (!response) {
          continue;
        }

        queryClient.setQueryData<NotificationListResponse>(queryKey, {
          ...response,
          items: response.items.map((item) =>
            item.id === notificationId ? { ...item, is_read: true } : item,
          ),
          total_unread: Math.max(
            0,
            response.items.some(
              (item) => item.id === notificationId && item.is_read === false,
            )
              ? response.total_unread - 1
              : response.total_unread,
          ),
        });
      }

      return { previousLists };
    },
    onError: (_error, _notificationId, context) => {
      if (!context) {
        return;
      }

      for (const [queryKey, data] of context.previousLists) {
        queryClient.setQueryData(queryKey, data);
      }
    },
    onSuccess: (notification) => {
      const currentLists = queryClient.getQueriesData<NotificationListResponse>(
        {
          queryKey: notificationQueryKeys.all,
        },
      );

      for (const [queryKey, response] of currentLists) {
        if (!response) {
          continue;
        }

        queryClient.setQueryData<NotificationListResponse>(queryKey, {
          ...response,
          items: response.items.map((item) =>
            item.id === notification.id ? notification : item,
          ),
        });
      }
    },
    onSettled: async () => {
      await queryClient.invalidateQueries({
        queryKey: notificationQueryKeys.all,
      });
    },
  });
}

export function useMarkAllNotificationsRead(): UseMutationResult<
  MarkAllNotificationsReadResult,
  Error,
  void,
  NotificationMutationContext
> {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => markAllNotificationsRead(),
    onMutate: async () => {
      await queryClient.cancelQueries({
        queryKey: notificationQueryKeys.all,
      });

      const previousLists =
        queryClient.getQueriesData<NotificationListResponse>({
          queryKey: notificationQueryKeys.all,
        });

      for (const [queryKey, response] of previousLists) {
        if (!response) {
          continue;
        }

        queryClient.setQueryData<NotificationListResponse>(queryKey, {
          ...response,
          items: response.items.map((item) => ({ ...item, is_read: true })),
          total_unread: 0,
        });
      }

      return { previousLists };
    },
    onError: (_error, _variables, context) => {
      if (!context) {
        return;
      }

      for (const [queryKey, data] of context.previousLists) {
        queryClient.setQueryData(queryKey, data);
      }
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: notificationQueryKeys.all,
      });
    },
  });
}

type NotificationMutationContext = {
  previousLists: Array<
    readonly [readonly unknown[], NotificationListResponse | undefined]
  >;
};

function normalizeNotificationParams(params?: ListNotificationsParams) {
  return {
    limit: params?.limit,
    offset: params?.offset,
  };
}
