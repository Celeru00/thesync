"use client";

import { useState } from "react";

import { NotificationList } from "@/components/notifications/notification-list";
import type { Notification } from "@/types/notification";

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

export function StudentNotifications() {
  const [notifications, setNotifications] =
    useState<Notification[]>(MOCK_NOTIFICATIONS);

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
    <NotificationList
      notifications={notifications}
      onMarkAsRead={markAsRead}
      onMarkAllAsRead={markAllAsRead}
      onDelete={deleteNotification}
    />
  );
}
