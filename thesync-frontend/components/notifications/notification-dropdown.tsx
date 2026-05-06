"use client";

import * as React from "react";
import { Bell, CheckSquare, LoaderCircle } from "lucide-react";
import { Popover as PopoverPrimitive } from "radix-ui";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { NotificationCountBadge } from "@/components/notifications/notification-badge";
import { NotificationItem } from "@/components/notifications/notification-item";
import { cn } from "@/lib/utils";
import type { Notification } from "@/types/notification";

/** Max notifications shown in the dropdown before a "View all" link appears */
const DROPDOWN_LIMIT = 5;

interface NotificationDropdownProps {
  notifications: Notification[];
  unreadCount: number;
  onMarkAsRead: (id: string) => void;
  onMarkAllAsRead: () => void;
  onNotificationClick: (notification: Notification) => void;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  isLoading?: boolean;
  errorMessage?: string | null;
  isMarkingAllRead?: boolean;
  /** href of the full notifications page (e.g. "/student/notifications") */
  allNotificationsHref: string;
  className?: string;
}

export function NotificationDropdown({
  notifications,
  unreadCount,
  onMarkAsRead,
  onMarkAllAsRead,
  onNotificationClick,
  open,
  onOpenChange,
  isLoading = false,
  errorMessage = null,
  isMarkingAllRead = false,
  allNotificationsHref,
  className,
}: NotificationDropdownProps) {
  const preview = notifications.slice(0, DROPDOWN_LIMIT);

  return (
    <PopoverPrimitive.Root open={open} onOpenChange={onOpenChange}>
      <PopoverPrimitive.Trigger asChild>
        <button
          aria-label={`Notifications${unreadCount > 0 ? `, ${unreadCount} unread` : ""}`}
          className={cn(
            "relative flex size-11 items-center justify-center rounded-2xl border border-surface bg-surface-card text-content-muted shadow-soft transition-colors hover:bg-surface-muted-soft hover:text-content-strong focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/50",
            className,
          )}
        >
          <Bell className="size-5" />
          <span className="absolute -right-1 -top-1">
            <NotificationCountBadge count={unreadCount} />
          </span>
        </button>
      </PopoverPrimitive.Trigger>

      <PopoverPrimitive.Portal>
        <PopoverPrimitive.Content
          align="end"
          sideOffset={8}
          className={cn(
            "z-50 w-[min(calc(100vw-2rem),26rem)] overflow-hidden rounded-2xl border border-surface bg-surface-card shadow-lg",
            "data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95",
            "data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95",
            "data-[side=bottom]:slide-in-from-top-2 data-[side=top]:slide-in-from-bottom-2",
          )}
        >
          {/* Header */}
          <div className="flex items-center justify-between gap-3 border-b border-surface px-4 py-3">
            <div>
              <p className="text-label">Notifications</p>
              {unreadCount > 0 ? (
                <p className="text-caption text-content-muted">
                  {unreadCount} unread
                </p>
              ) : null}
            </div>
            {unreadCount > 0 && (
              <button
                onClick={onMarkAllAsRead}
                disabled={isMarkingAllRead}
                className="flex shrink-0 items-center gap-1.5 rounded-full px-2 py-1 text-caption text-brand transition-colors hover:bg-brand-soft hover:text-brand"
              >
                {isMarkingAllRead ? (
                  <LoaderCircle className="size-3.5 animate-spin" />
                ) : (
                  <CheckSquare className="size-3.5" />
                )}
                Mark all read
              </button>
            )}
          </div>

          {/* List */}
          {isLoading ? (
            <p className="px-4 py-8 text-center text-body-sm text-content-muted">
              Loading notifications...
            </p>
          ) : errorMessage ? (
            <p className="px-4 py-8 text-center text-body-sm text-destructive">
              {errorMessage}
            </p>
          ) : preview.length === 0 ? (
            <p className="px-4 py-8 text-center text-body-sm text-content-muted">
              No notifications yet.
            </p>
          ) : (
            <div className="max-h-[24rem] overflow-y-auto p-2">
              {preview.map((n) => (
                <NotificationItem
                  key={n.id}
                  notification={n}
                  onMarkAsRead={() => onMarkAsRead(n.id)}
                  onClick={() => onNotificationClick(n)}
                  compact
                />
              ))}
            </div>
          )}

          {/* Footer */}
          <div className="border-t border-surface bg-surface-card px-3 py-3">
            <Button
              asChild
              variant="ghost"
              className="h-10 w-full rounded-xl text-brand hover:text-brand/80"
            >
              <Link href={allNotificationsHref}>View all notifications</Link>
            </Button>
          </div>
        </PopoverPrimitive.Content>
      </PopoverPrimitive.Portal>
    </PopoverPrimitive.Root>
  );
}
