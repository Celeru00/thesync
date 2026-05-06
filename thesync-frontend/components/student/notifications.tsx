"use client";

import { useState } from "react";

import { NotificationList } from "@/components/notifications/notification-list";
import type { Notification } from "@/types/notification";

// ── Mock data (swap for API call when backend is ready) ──────────────────────
const MOCK_NOTIFICATIONS: Notification[] = [
  {
    id: "1",
    user_id: "user1",
    schedule_id: "sch1",
    message:
      "Your consultation request for 'Chapter 1 Review' has been approved by Dr. Vicente Calag",
    created_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    is_read: false,
    type: "approved",
    title: "Consultation Request Approved",
  },
  {
    id: "2",
    user_id: "user1",
    schedule_id: "sch1",
    message: "You have a consultation scheduled for tomorrow at 2:00 PM",
    created_at: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
    is_read: false,
    type: "reminder",
    title: "Upcoming Session Reminder",
  },
  {
    id: "3",
    user_id: "user1",
    schedule_id: "sch2",
    message:
      "Dr. Maria Santos has requested to reschedule your consultation to May 10, 2026",
    created_at: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
    is_read: true,
    type: "reschedule",
    title: "Reschedule Request",
  },
  {
    id: "4",
    user_id: "user1",
    schedule_id: "sch4",
    message:
      "Your thesis defense has been scheduled for May 15, 2026 at 1:00 PM",
    created_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    is_read: true,
    type: "approved",
    title: "Defense Scheduled",
  },
  {
    id: "5",
    user_id: "user1",
    schedule_id: "sch3",
    message:
      "Your consultation 'Literature Review' has been marked as completed",
    created_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    is_read: true,
    type: "info",
    title: "Session Completed",
  },
];

export function StudentNotifications() {
  const [notifications, setNotifications] =
    useState<Notification[]>(MOCK_NOTIFICATIONS);

  function markAsRead(id: string) {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, is_read: true } : n)),
    );
  }

  function markAllAsRead() {
    setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
  }

  function deleteNotification(id: string) {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  }

  return (
    <NotificationList
      notifications={notifications}
      onMarkAsRead={markAsRead}
      onMarkAllAsRead={markAllAsRead}
      onDelete={deleteNotification}
    />
  );
}
