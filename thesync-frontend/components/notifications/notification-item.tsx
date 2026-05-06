import { AlertCircle, CheckCircle2, Info, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { Notification, NotificationType } from "@/types/notification";

export function getIconConfig(type: NotificationType) {
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

export function formatRelativeTime(isoString: string): string {
  const diffMs = Date.now() - new Date(isoString).getTime();
  const mins = Math.floor(diffMs / 60000);
  const hours = Math.floor(diffMs / 3600000);
  const days = Math.floor(diffMs / 86400000);
  if (mins < 60) return `${mins} minute${mins !== 1 ? "s" : ""} ago`;
  if (hours < 24) return `${hours} hour${hours !== 1 ? "s" : ""} ago`;
  if (days === 1) return "1 day ago";
  return `${days} days ago`;
}

interface NotificationItemProps {
  notification: Notification;
  onMarkAsRead?: () => void;
  onDelete?: () => void;
  /** Compact mode for use inside the dropdown — hides action buttons, clips message */
  compact?: boolean;
}

export function NotificationItem({
  notification: n,
  onMarkAsRead,
  onDelete,
  compact = false,
}: NotificationItemProps) {
  // Default to 'info' type if not provided
  const notificationType = n.type || "info";
  const { Icon, bg, color } = getIconConfig(notificationType);
  
  // Extract title from message or use provided title, default to first line
  const title = n.title || n.message.split("\n")[0] || "Notification";

  return (
    <div
      className={cn(
        "transition-colors",
        !n.is_read && "bg-info-soft/20",
        compact ? "px-4 py-3" : "px-6 py-4",
      )}
    >
      <div className="flex gap-3">
        {/* Icon */}
        <div
          className={cn(
            "flex shrink-0 items-center justify-center rounded-full",
            compact ? "size-8" : "size-9",
            bg,
          )}
        >
          <Icon className={cn(compact ? "size-3.5" : "size-4", color)} />
        </div>

        {/* Content */}
        <div className="min-w-0 flex-1">
          <div className="mb-0.5 flex items-start justify-between gap-3">
            <p className="text-label">{title}</p>
            <span className="shrink-0 text-caption text-content-muted">
              {formatRelativeTime(n.created_at)}
            </span>
          </div>

          <p
            className={cn(
              "text-body-sm text-content-muted",
              compact ? "line-clamp-2" : "mb-3",
            )}
          >
            {n.message}
          </p>

          {/* Full-mode actions */}
          {!compact && (
            <div className="mt-3 flex flex-wrap items-center gap-2">
              {!n.is_read && onMarkAsRead && (
                <Button variant="outline" size="sm" onClick={onMarkAsRead}>
                  Mark as Read
                </Button>
              )}
              {onDelete && (
                <button
                  onClick={onDelete}
                  className="flex items-center gap-1.5 text-body-sm text-error transition-colors hover:text-error/80"
                >
                  <Trash2 className="size-3.5" />
                  Delete
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
