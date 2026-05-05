"use client";

import { useState } from "react";
import {
  Bell,
  Check,
  CheckCircle2,
  Info,
  Trash2,
  AlertCircle,
} from "lucide-react";

import {
  FilterBar,
  ListItem,
  ListWrapper,
  PaginationPlaceholder,
  SearchInput,
} from "@/components/data-display";
import { Button } from "@/components/ui/button";

const initialNotifications = [
  {
    title: "Consultation Request Approved",
    description:
      "Your consultation request for 'Chapter 1 Review' has been approved by Dr. Vicente Calag",
    time: "2 hours ago",
    icon: CheckCircle2,
    iconClassName: "bg-success-soft text-success",
    unread: true,
  },
  {
    title: "Consultation Invitation",
    description:
      "You have been invited to join a consultation session on May 12, 2026 at 10:00 AM",
    time: "30 minutes ago",
    icon: Bell,
    iconClassName: "bg-purple-100 text-purple-600",
    unread: true,
  },
  {
    title: "Upcoming Session Reminder",
    description: "You have a consultation scheduled for tomorrow at 2:00 PM",
    time: "5 hours ago",
    icon: Info,
    iconClassName: "bg-blue-100 text-blue-600",
    unread: true,
  },
  {
    title: "Reschedule Request",
    description:
      "Dr. Maria Santos has requested to reschedule your consultation to May 10, 2026",
    time: "1 day ago",
    icon: AlertCircle,
    iconClassName: "bg-orange-100 text-orange-600",
    unread: false,
  },
  {
    title: "Defense Scheduled",
    description:
      "Your thesis defense has been scheduled for May 15, 2026 at 1:00 PM",
    time: "2 days ago",
    icon: CheckCircle2,
    iconClassName: "bg-success-soft text-success",
    unread: false,
  },
  {
    title: "Session Completed",
    description:
      "Your consultation 'Literature Review' has been marked as completed",
    time: "3 days ago",
    icon: Info,
    iconClassName: "bg-blue-100 text-blue-600",
    unread: false,
  },
];

export default function AdviserNotificationsPage() {
  const [notifications, setNotifications] = useState(initialNotifications);
  const [searchTerm, setSearchTerm] = useState("");

  const toggleReadState = (title: string) => {
    setNotifications((prev) =>
      prev.map((notification) =>
        notification.title === title
          ? { ...notification, unread: !notification.unread }
          : notification,
      ),
    );
  };

  const markAllAsRead = () => {
    setNotifications((prev) =>
      prev.map((notification) => ({ ...notification, unread: false })),
    );
  };

  const filteredNotifications = notifications.filter((notification) => {
    const normalizedSearch = searchTerm.trim().toLowerCase();

    if (normalizedSearch.length === 0) {
      return true;
    }

    return [notification.title, notification.description, notification.time]
      .join(" ")
      .toLowerCase()
      .includes(normalizedSearch);
  });

  return (
    <div className="flex flex-col gap-7">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-2">
          <h1 className="text-heading">Notifications</h1>
          <p className="text-body text-content-muted">
            Stay updated with your consultation activities
          </p>
        </div>
        <Button
          type="button"
          variant="outline"
          className="rounded-lg"
          onClick={markAllAsRead}
        >
          <Check data-icon="inline-start" className="size-4" />
          Mark All as Read
        </Button>
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
        {filteredNotifications.length > 0 ? (
          filteredNotifications.map((notification) => {
            const Icon = notification.icon;

            return (
              <ListItem
                key={notification.title}
                unread={notification.unread}
              >
                <div className="grid gap-4 sm:grid-cols-[auto_minmax(0,1fr)_auto]">
                  <div
                    className={`flex size-10 items-center justify-center rounded-full ${notification.iconClassName}`}
                  >
                    <Icon className="size-5" />
                  </div>

                  <div className="min-w-0">
                    <h2 className="text-card-title">{notification.title}</h2>
                    <p className="mt-1 text-body-sm text-content-muted">
                      {notification.description}
                    </p>
                    <div className="mt-3 flex flex-wrap gap-3">
                      <Button
                        type="button"
                        variant="outline"
                        size="xs"
                        className="rounded-lg"
                        onClick={() => toggleReadState(notification.title)}
                      >
                        {notification.unread
                          ? "Mark as Read"
                          : "Mark as Unread"}
                      </Button>

                      <Button
                        type="button"
                        variant="ghost"
                        size="xs"
                        className="rounded-lg text-red-600 hover:bg-red-50 hover:text-red-700"
                      >
                        <Trash2 data-icon="inline-start" className="size-3" />
                        Delete
                      </Button>
                    </div>
                  </div>

                  <time className="text-sm text-content-muted">
                    {notification.time}
                  </time>
                </div>
              </ListItem>
            );
          })
        ) : (
          <p className="rounded-lg border border-dashed border-control px-6 py-10 text-center text-body-sm text-content-muted">
            No notifications match your search.
          </p>
        )}
      </ListWrapper>
    </div>
  );
}
