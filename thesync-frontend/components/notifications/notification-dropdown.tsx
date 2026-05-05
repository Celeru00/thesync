"use client";

import * as React from "react";
import { Bell, CheckSquare } from "lucide-react";
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
  onMarkAsRead: (id: string) => void;
  onMarkAllAsRead: () => void;
  /** href of the full notifications page (e.g. "/student/notifications") */
  allNotificationsHref: string;
  className?: string;
}

export function NotificationDropdown({
  notifications,
  onMarkAsRead,
  onMarkAllAsRead,
  allNotificationsHref,
  className,
}: NotificationDropdownProps) {
  const unreadCount = notifications.filter((n) => !n.read).length;
  const preview = notifications.slice(0, DROPDOWN_LIMIT);

  return (
    <PopoverPrimitive.Root>
      <PopoverPrimitive.Trigger asChild>
        <button
          aria-label={`Notifications${unreadCount > 0 ? `, ${unreadCount} unread` : ""}`}
          className={cn(
            "relative flex size-9 items-center justify-center rounded-xl transition-colors hover:bg-surface focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/50",
            className,
          )}
        >
          <Bell className="size-5 text-content-muted" />
          <span className="absolute -right-0.5 -top-0.5">
            <NotificationCountBadge count={unreadCount} />
          </span>
        </button>
      </PopoverPrimitive.Trigger>

      <PopoverPrimitive.Portal>
        <PopoverPrimitive.Content
          align="end"
          sideOffset={8}
          className={cn(
            "z-50 w-80 overflow-hidden rounded-2xl border border-surface bg-surface-card shadow-lg",
            "data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95",
            "data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95",
            "data-[side=bottom]:slide-in-from-top-2 data-[side=top]:slide-in-from-bottom-2",
          )}
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b border-surface px-4 py-3">
            <p className="text-label">Notifications</p>
            {unreadCount > 0 && (
              <button
                onClick={onMarkAllAsRead}
                className="flex items-center gap-1.5 text-caption text-brand transition-colors hover:text-brand/80"
              >
                <CheckSquare className="size-3.5" />
                Mark all read
              </button>
            )}
          </div>

          {/* List */}
          {preview.length === 0 ? (
            <p className="px-4 py-8 text-center text-body-sm text-content-muted">
              No notifications yet.
            </p>
          ) : (
            <div className="divide-y divide-surface">
              {preview.map((n) => (
                <NotificationItem
                  key={n.id}
                  notification={n}
                  onMarkAsRead={() => onMarkAsRead(n.id)}
                  compact
                />
              ))}
            </div>
          )}

          {/* Footer */}
          <div className="border-t border-surface px-4 py-3">
            <Button
              asChild
              variant="ghost"
              className="w-full text-brand hover:text-brand/80"
            >
              <Link href={allNotificationsHref}>View all notifications</Link>
            </Button>
          </div>
        </PopoverPrimitive.Content>
      </PopoverPrimitive.Portal>
    </PopoverPrimitive.Root>
  );
}
