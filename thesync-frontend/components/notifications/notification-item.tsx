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
  onClick?: () => void;
  /** Compact mode for use inside the dropdown — hides action buttons, clips message */
  compact?: boolean;
}

export function NotificationItem({
  notification: n,
  onMarkAsRead,
  onDelete,
  onClick,
  compact = false,
}: NotificationItemProps) {
  // Default to 'info' type if not provided
  const notificationType = n.type || "info";
  const { Icon, bg, color } = getIconConfig(notificationType);

  // Extract title from message or use provided title, default to first line
  const title = n.title || n.message.split("\n")[0] || "Notification";

  if (compact) {
    return (
      <div
        role={onClick ? "button" : undefined}
        tabIndex={onClick ? 0 : undefined}
        onClick={onClick}
        onKeyDown={(event) => {
          if (!onClick || (event.key !== "Enter" && event.key !== " ")) {
            return;
          }

          event.preventDefault();
          onClick();
        }}
        className={cn(
          "group relative rounded-xl px-3 py-3 transition-colors outline-none focus-visible:ring-2 focus-visible:ring-brand/50",
          onClick && "cursor-pointer",
          n.is_read
            ? "hover:bg-surface-muted-soft"
            : "bg-info-soft/45 hover:bg-info-soft/70",
        )}
      >
        {!n.is_read ? (
          <span className="absolute left-0 top-3 h-10 w-1 rounded-r-full bg-info" />
        ) : null}

        <div className="flex gap-3">
          <div
            className={cn(
              "mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-full",
              bg,
            )}
          >
            <Icon className={cn("size-4", color)} />
          </div>

          <div className="min-w-0 flex-1 space-y-1">
            <div className="flex min-w-0 items-start justify-between gap-3">
              <p className="line-clamp-1 text-sm font-semibold leading-5 text-content-strong">
                {title}
              </p>
              <span className="shrink-0 whitespace-nowrap text-xs leading-5 text-content-muted">
                {formatRelativeTime(n.created_at)}
              </span>
            </div>

            <p className="line-clamp-2 text-sm leading-5 text-content-muted">
              {getPreviewMessage(n.message, title)}
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      role={onClick ? "button" : undefined}
      tabIndex={onClick ? 0 : undefined}
      onClick={onClick}
      onKeyDown={(event) => {
        if (!onClick || (event.key !== "Enter" && event.key !== " ")) {
          return;
        }

        event.preventDefault();
        onClick();
      }}
      className={cn(
        "transition-colors",
        onClick &&
          "cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-brand/50",
        !n.is_read && "bg-info-soft/20",
        "px-6 py-4",
      )}
    >
      <div className="flex gap-3">
        {/* Icon */}
        <div
          className={cn(
            "flex shrink-0 items-center justify-center rounded-full",
            "size-9",
            bg,
          )}
        >
          <Icon className={cn("size-4", color)} />
        </div>

        {/* Content */}
        <div className="min-w-0 flex-1">
          <div className="mb-0.5 flex items-start justify-between gap-3">
            <p className="text-label">{title}</p>
            <span className="shrink-0 text-caption text-content-muted">
              {formatRelativeTime(n.created_at)}
            </span>
          </div>

          <p className={cn("text-body-sm text-content-muted", "mb-3")}>
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

function getPreviewMessage(message: string, title: string) {
  const normalizedMessage = message.trim();
  const normalizedTitle = title.trim();

  if (
    normalizedMessage.toLowerCase().startsWith(normalizedTitle.toLowerCase())
  ) {
    return normalizedMessage.slice(normalizedTitle.length).trim() || message;
  }

  return message;
}
