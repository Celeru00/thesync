"use client";

import { useState } from "react";
import { usePathname, useRouter } from "next/navigation";

import { NotificationDropdown } from "@/components/notifications/notification-dropdown";
import {
  useMarkAllNotificationsRead,
  useMarkNotificationRead,
  useNotifications,
} from "@/hooks/useNotifications";
import type { AppSessionUser } from "@/lib/auth/backend";
import type { Notification } from "@/types/notification";

const NOTIFICATION_PREVIEW_LIMIT = 5;
const NOTIFICATION_REFETCH_INTERVAL_MS = 30_000;

type PortalNotificationBellProps = {
  currentUser: AppSessionUser;
};

export function PortalNotificationBell({
  currentUser,
}: PortalNotificationBellProps) {
  const router = useRouter();
  const pathname = usePathname();
  const isHiddenRoute =
    pathname.endsWith("/notifications") || pathname.endsWith("/settings");
  const [open, setOpen] = useState(false);
  const notificationsQuery = useNotifications(
    { limit: NOTIFICATION_PREVIEW_LIMIT },
    {
      enabled: !isHiddenRoute,
      refetchInterval: NOTIFICATION_REFETCH_INTERVAL_MS,
      refetchIntervalInBackground: false,
    },
  );
  const markNotificationReadMutation = useMarkNotificationRead();
  const markAllNotificationsReadMutation = useMarkAllNotificationsRead();
  const notifications = notificationsQuery.data?.items ?? [];
  const unreadCount = notificationsQuery.data?.total_unread ?? 0;
  const notificationsHref = `/${currentUser.app_role}/notifications`;

  if (isHiddenRoute) {
    return null;
  }

  async function handleOpenChange(nextOpen: boolean) {
    setOpen(nextOpen);

    if (nextOpen) {
      await notificationsQuery.refetch();
    }
  }

  async function handleNotificationClick(notification: Notification) {
    if (!notification.is_read) {
      try {
        await markNotificationReadMutation.mutateAsync(notification.id);
      } catch {
        // Keep navigation responsive even if the read update needs a retry later.
      }
    }

    setOpen(false);
    router.push(getNotificationHref(currentUser.app_role, notification));
  }

  return (
    <NotificationDropdown
      notifications={notifications}
      unreadCount={unreadCount}
      open={open}
      onOpenChange={(nextOpen) => {
        void handleOpenChange(nextOpen);
      }}
      onMarkAsRead={(id) => markNotificationReadMutation.mutate(id)}
      onMarkAllAsRead={() => markAllNotificationsReadMutation.mutate()}
      onNotificationClick={(notification) => {
        void handleNotificationClick(notification);
      }}
      isLoading={notificationsQuery.isLoading}
      errorMessage={
        notificationsQuery.error
          ? "We couldn't load notifications right now."
          : null
      }
      isMarkingAllRead={markAllNotificationsReadMutation.isPending}
      allNotificationsHref={notificationsHref}
    />
  );
}

function getNotificationHref(
  role: AppSessionUser["app_role"],
  notification: Notification,
) {
  if (!notification.schedule_id) {
    return `/${role}/notifications`;
  }

  return `/${role}/consultations?scheduleId=${notification.schedule_id}`;
}
