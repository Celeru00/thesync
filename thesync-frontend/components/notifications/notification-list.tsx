"use client";

import { CheckSquare } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { NotificationItem } from "@/components/notifications/notification-item";
import type { Notification } from "@/types/notification";

interface NotificationListProps {
  notifications: Notification[];
  onMarkAsRead: (id: string) => void;
  onMarkAllAsRead: () => void;
  onDelete: (id: string) => void;
}

export function NotificationList({
  notifications,
  onMarkAsRead,
  onMarkAllAsRead,
  onDelete,
}: NotificationListProps) {
  const unreadCount = notifications.filter((n) => !n.is_read).length;

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-subheading">Notifications</h1>
          <p className="text-body-sm text-content-muted">
            Stay updated with your consultation activities
          </p>
        </div>
        {unreadCount > 0 && (
          <Button variant="outline" onClick={onMarkAllAsRead}>
            <CheckSquare className="size-4" />
            Mark All as Read
          </Button>
        )}
      </div>

      {/* List card */}
      <Card>
        <CardHeader className="pb-2">
          <p className="text-label">All Notifications</p>
        </CardHeader>
        <CardContent className="p-0">
          {notifications.length === 0 ? (
            <p className="px-6 py-10 text-center text-body-sm text-content-muted">
              No notifications yet.
            </p>
          ) : (
            <div className="divide-y divide-surface">
              {notifications.map((n) => (
                <NotificationItem
                  key={n.id}
                  notification={n}
                  onMarkAsRead={() => onMarkAsRead(n.id)}
                  onDelete={() => onDelete(n.id)}
                />
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
