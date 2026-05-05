"use client";

import { useState } from "react";
import {
  AlertCircle,
  CheckCircle2,
  CheckSquare,
  Info,
  Trash2,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { Notification, NotificationType } from "@/types/notification";

// ── Mock data (swap for API call when backend is ready) ──────────────────────
const MOCK_NOTIFICATIONS: Notification[] = [
  {
    id: "1",
    type: "approved",
    title: "Consultation Request Approved",
    message:
      "Your consultation request for 'Chapter 1 Review' has been approved by Dr. Vicente Calag",
    timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    read: false,
    relatedConsultationId: "1",
  },
  {
    id: "2",
    type: "reminder",
    title: "Upcoming Session Reminder",
    message: "You have a consultation scheduled for tomorrow at 2:00 PM",
    timestamp: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
    read: false,
    relatedConsultationId: "1",
  },
  {
    id: "3",
    type: "reschedule",
    title: "Reschedule Request",
    message:
      "Dr. Maria Santos has requested to reschedule your consultation to May 10, 2026",
    timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
    read: true,
    relatedConsultationId: "2",
  },
  {
    id: "4",
    type: "approved",
    title: "Defense Scheduled",
    message:
      "Your thesis defense has been scheduled for May 15, 2026 at 1:00 PM",
    timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    read: true,
    relatedConsultationId: "4",
  },
  {
    id: "5",
    type: "info",
    title: "Session Completed",
    message:
      "Your consultation 'Literature Review' has been marked as completed",
    timestamp: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    read: true,
    relatedConsultationId: "3",
  },
];

// ── Helpers ──────────────────────────────────────────────────────────────────
function formatRelativeTime(isoString: string): string {
  const diffMs = Date.now() - new Date(isoString).getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 60)
    return `${diffMins} minute${diffMins !== 1 ? "s" : ""} ago`;
  if (diffHours < 24)
    return `${diffHours} hour${diffHours !== 1 ? "s" : ""} ago`;
  if (diffDays === 1) return "1 day ago";
  return `${diffDays} days ago`;
}

function getIconConfig(type: NotificationType) {
  switch (type) {
    case "approved":
      return { Icon: CheckCircle2, bg: "bg-success/10", color: "text-success" };
    case "reminder":
      return { Icon: Info, bg: "bg-info-soft", color: "text-info" };
    case "reschedule":
      return {
        Icon: AlertCircle,
        bg: "bg-warning-soft",
        color: "text-warning",
      };
    case "completed":
      return { Icon: CheckCircle2, bg: "bg-success/10", color: "text-success" };
    case "info":
      return { Icon: Info, bg: "bg-info-soft", color: "text-info" };
  }
}

// ── Main component ───────────────────────────────────────────────────────────
export function StudentNotifications() {
  const [notifications, setNotifications] =
    useState<Notification[]>(MOCK_NOTIFICATIONS);

  const unreadCount = notifications.filter((n) => !n.read).length;

  function markAsRead(id: string) {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n)),
    );
  }

  function markAllAsRead() {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  }

  function deleteNotification(id: string) {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  }

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
          <Button variant="outline" onClick={markAllAsRead}>
            <CheckSquare className="size-4" />
            Mark All as Read
          </Button>
        )}
      </div>

      {/* Notifications card */}
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
                  onMarkAsRead={() => markAsRead(n.id)}
                  onDelete={() => deleteNotification(n.id)}
                />
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// ── Notification item ────────────────────────────────────────────────────────
function NotificationItem({
  notification: n,
  onMarkAsRead,
  onDelete,
}: {
  notification: Notification;
  onMarkAsRead: () => void;
  onDelete: () => void;
}) {
  const { Icon, bg, color } = getIconConfig(n.type);

  return (
    <div
      className={cn(
        "px-6 py-4 transition-colors",
        !n.read && "bg-info-soft/20",
      )}
    >
      <div className="flex gap-4">
        {/* Icon */}
        <div
          className={cn(
            "flex size-9 shrink-0 items-center justify-center rounded-full",
            bg,
          )}
        >
          <Icon className={cn("size-4", color)} />
        </div>

        {/* Content */}
        <div className="min-w-0 flex-1">
          <div className="mb-0.5 flex items-start justify-between gap-4">
            <p className="text-label">{n.title}</p>
            <span className="shrink-0 text-caption text-content-muted">
              {formatRelativeTime(n.timestamp)}
            </span>
          </div>
          <p className="mb-3 text-body-sm text-content-muted">{n.message}</p>

          {/* Actions */}
          <div className="flex flex-wrap items-center gap-2">
            {!n.read && (
              <Button variant="outline" size="sm" onClick={onMarkAsRead}>
                Mark as Read
              </Button>
            )}
            <button
              onClick={onDelete}
              className="flex items-center gap-1.5 text-body-sm text-error transition-colors hover:text-error/80"
            >
              <Trash2 className="size-3.5" />
              Delete
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
