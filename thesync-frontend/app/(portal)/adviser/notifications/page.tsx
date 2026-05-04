import {
  Bell,
  CalendarDays,
  Check,
  CheckCircle2,
  Info,
  Trash2,
  AlertCircle,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const notificationStats = [
  {
    label: "Total",
    value: "5",
    icon: Bell,
    iconClassName: "bg-blue-100 text-blue-600",
  },
  {
    label: "Unread",
    value: "2",
    icon: AlertCircle,
    iconClassName: "bg-orange-100 text-orange-600",
  },
  {
    label: "This Week",
    value: "2",
    icon: CalendarDays,
    iconClassName: "bg-green-100 text-green-600",
  },
  {
    label: "Important",
    value: "1",
    icon: AlertCircle,
    iconClassName: "bg-purple-100 text-purple-600",
  },
];

const notifications = [
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
    description: "Your thesis defense has been scheduled for May 15, 2026 at 1:00 PM",
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
  return (
    <div className="flex flex-col gap-7">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-2">
          <h1 className="text-heading">Notifications</h1>
          <p className="text-body text-content-muted">
            Stay updated with your consultation activities
          </p>
        </div>
        <Button type="button" variant="outline" className="rounded-lg">
          <Check data-icon="inline-start" className="size-4" />
          Mark All as Read
        </Button>
      </header>

      <section className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
        {notificationStats.map((stat) => {
          const Icon = stat.icon;

          return (
            <Card key={stat.label} className="rounded-xl py-6 shadow-elevated">
              <CardContent className="flex items-center justify-between gap-4 px-6">
                <div>
                  <p className="text-body-sm text-content-muted">{stat.label}</p>
                  <p className="mt-1 text-3xl font-semibold text-content-strong">
                    {stat.value}
                  </p>
                </div>
                <div
                  className={`flex size-12 items-center justify-center rounded-xl ${stat.iconClassName}`}
                >
                  <Icon className="size-6" />
                </div>
              </CardContent>
            </Card>
          );
        })}
      </section>

      <Card className="rounded-xl py-6 shadow-elevated">
        <CardHeader className="px-6">
          <CardTitle>All Notifications</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 px-6">
          {notifications.map((notification) => {
            const Icon = notification.icon;

            return (
              <article
                key={notification.title}
                className={
                  notification.unread
                    ? "rounded-lg border border-blue-200 bg-blue-50 p-4"
                    : "rounded-lg border border-surface bg-surface-card p-4"
                }
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
                      {notification.unread ? (
                        <Button
                          type="button"
                          variant="outline"
                          size="xs"
                          className="rounded-lg"
                        >
                          Mark as Read
                        </Button>
                      ) : null}
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
              </article>
            );
          })}
        </CardContent>
      </Card>
    </div>
  );
}
