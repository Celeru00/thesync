"use client";

import { useMemo, useState } from "react";
import { Check, LoaderCircle } from "lucide-react";

import {
  FilterBar,
  ListWrapper,
  PaginationPlaceholder,
  SearchInput,
} from "@/components/data-display";
import { NotificationItem } from "@/components/notifications/notification-item";
import { Button } from "@/components/ui/button";
import {
  useMarkAllNotificationsRead,
  useMarkNotificationRead,
  useNotifications,
} from "@/hooks/useNotifications";

const NOTIFICATIONS_PAGE_LIMIT = 100;
const NOTIFICATIONS_REFETCH_INTERVAL_MS = 30_000;

export function LiveNotificationsPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const notificationsQuery = useNotifications(
    { limit: NOTIFICATIONS_PAGE_LIMIT },
    {
      refetchInterval: NOTIFICATIONS_REFETCH_INTERVAL_MS,
      refetchIntervalInBackground: false,
    },
  );
  const markNotificationReadMutation = useMarkNotificationRead();
  const markAllNotificationsReadMutation = useMarkAllNotificationsRead();
  const unreadCount = notificationsQuery.data?.total_unread ?? 0;

  const filteredNotifications = useMemo(() => {
    const notifications = notificationsQuery.data?.items ?? [];
    const normalizedSearch = searchTerm.trim().toLowerCase();

    if (!normalizedSearch) {
      return notifications;
    }

    return notifications.filter((notification) =>
      [
        notification.message,
        notification.created_at,
        notification.schedule_id ?? "",
      ]
        .join(" ")
        .toLowerCase()
        .includes(normalizedSearch),
    );
  }, [notificationsQuery.data?.items, searchTerm]);

  return (
    <div className="flex flex-col gap-7">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-2">
          <h1 className="text-heading">Notifications</h1>
          <p className="text-body text-content-muted">
            Stay updated with your consultation activities
          </p>
        </div>
        {unreadCount > 0 ? (
          <Button
            type="button"
            variant="outline"
            className="rounded-lg"
            disabled={markAllNotificationsReadMutation.isPending}
            onClick={() => markAllNotificationsReadMutation.mutate()}
          >
            {markAllNotificationsReadMutation.isPending ? (
              <LoaderCircle
                data-icon="inline-start"
                className="size-4 animate-spin"
              />
            ) : (
              <Check data-icon="inline-start" className="size-4" />
            )}
            Mark All as Read
          </Button>
        ) : null}
      </header>

      <ListWrapper
        title="All Notifications"
        filters={
          <FilterBar>
            <SearchInput
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              placeholder="Search notifications"
              wrapperClassName="md:max-w-md"
            />
          </FilterBar>
        }
        footer={
          <PaginationPlaceholder totalItems={filteredNotifications.length} />
        }
      >
        {notificationsQuery.isLoading ? (
          <p className="rounded-lg border border-dashed border-control px-6 py-10 text-center text-body-sm text-content-muted">
            Loading notifications...
          </p>
        ) : notificationsQuery.error ? (
          <div className="rounded-[1rem] border border-destructive/25 bg-destructive/10 px-4 py-4 text-body text-destructive">
            We couldn&apos;t load notifications right now.
          </div>
        ) : filteredNotifications.length > 0 ? (
          <div className="overflow-hidden rounded-lg border border-surface bg-surface-card">
            <div className="divide-y divide-surface">
              {filteredNotifications.map((notification) => (
                <NotificationItem
                  key={notification.id}
                  notification={notification}
                  onMarkAsRead={
                    notification.is_read
                      ? undefined
                      : () =>
                          markNotificationReadMutation.mutate(notification.id)
                  }
                />
              ))}
            </div>
          </div>
        ) : (
          <p className="rounded-lg border border-dashed border-control px-6 py-10 text-center text-body-sm text-content-muted">
            No notifications match your search.
          </p>
        )}
      </ListWrapper>
    </div>
  );
}
