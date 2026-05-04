import Link from "next/link";
import { Bell, CalendarDays, Clock3, FileText, UsersRound } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

const summaryCards = [
  {
    label: "Pending Approvals",
    value: "8",
    icon: Clock3,
    iconClassName: "bg-orange-100 text-orange-600",
  },
  {
    label: "Today's Sessions",
    value: "4",
    icon: CalendarDays,
    iconClassName: "bg-blue-100 text-blue-600",
  },
  {
    label: "Active Advisees",
    value: "15",
    icon: UsersRound,
    iconClassName: "bg-green-100 text-green-600",
  },
  {
    label: "This Month",
    value: "32",
    icon: FileText,
    iconClassName: "bg-purple-100 text-purple-600",
  },
];

const upcomingSessions = [
  {
    title: "Chapter 1 Review",
    student: "Dr. Vicente Calag",
    date: "May 5, 2026",
    time: "2:00 PM - 3:00 PM",
    status: "Approved",
    tone: "document",
    badge: "success",
  },
  {
    title: "Methodology Discussion",
    student: "Dr. Maria Santos",
    date: "May 8, 2026",
    time: "10:00 AM - 11:00 AM",
    status: "Pending",
    tone: "document",
    badge: "warning",
  },
  {
    title: "Thesis Defense",
    student: "Dr. Vicente Calag",
    date: "May 15, 2026",
    time: "1:00 PM - 3:00 PM",
    status: "Approved",
    tone: "defense",
    badge: "success",
  },
] as const;

const recentActivities = [
  {
    title: "Request Approved",
    description: "Chapter 1 Review - 2 hours ago",
    dotClassName: "bg-success",
  },
  {
    title: "New Notification",
    description: "Reminder: Session tomorrow - 5 hours ago",
    dotClassName: "bg-primary",
  },
  {
    title: "Session Completed",
    description: "Literature Review - Yesterday",
    dotClassName: "bg-violet",
  },
];

export default function AdviserDashboardPage() {
  return (
    <div className="flex flex-col gap-7">
      <header className="space-y-2">
        <h1 className="text-heading">Welcome back!</h1>
        <p className="text-body text-content-muted">
          Manage your consultation requests and upcoming sessions
        </p>
      </header>

      <section className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
        {summaryCards.map((card) => {
          const Icon = card.icon;

          return (
            <Card key={card.label} className="rounded-xl py-6 shadow-elevated">
              <CardContent className="flex items-center justify-between gap-4 px-6">
                <div>
                  <p className="text-body-sm text-content-muted">
                    {card.label}
                  </p>
                  <p className="mt-1 text-3xl font-semibold text-content-strong">
                    {card.value}
                  </p>
                </div>
                <div
                  className={`flex size-12 items-center justify-center rounded-xl ${card.iconClassName}`}
                >
                  <Icon className="size-6" />
                </div>
              </CardContent>
            </Card>
          );
        })}
      </section>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_24rem]">
        <Card className="rounded-xl py-6 shadow-elevated">
          <CardHeader className="px-6">
            <CardTitle>Upcoming Sessions</CardTitle>
            <CardDescription className="text-base">
              Your scheduled consultations and defenses
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 px-6">
            {upcomingSessions.map((session) => (
              <article
                key={session.title}
                className="flex flex-col gap-4 rounded-lg border border-surface p-4 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="flex min-w-0 gap-4">
                  <div
                    className={
                      session.tone === "defense"
                        ? "flex size-12 shrink-0 items-center justify-center rounded-xl bg-purple-100 text-purple-600"
                        : "flex size-12 shrink-0 items-center justify-center rounded-xl bg-blue-100 text-blue-600"
                    }
                  >
                    {session.tone === "defense" ? (
                      <UsersRound className="size-6" />
                    ) : (
                      <FileText className="size-6" />
                    )}
                  </div>
                  <div className="min-w-0">
                    <h2 className="text-card-title">{session.title}</h2>
                    <p className="text-body-sm text-content-muted">
                      {session.student}
                    </p>
                    <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-sm text-content-muted">
                      <span className="inline-flex items-center gap-1">
                        <CalendarDays className="size-4" />
                        {session.date}
                      </span>
                      <span className="inline-flex items-center gap-1">
                        <Clock3 className="size-4" />
                        {session.time}
                      </span>
                    </div>
                  </div>
                </div>
                <Badge
                  variant={session.badge}
                  className="self-start sm:self-center"
                >
                  {session.status}
                </Badge>
              </article>
            ))}
          </CardContent>
        </Card>

        <aside className="flex flex-col gap-6">
          <Card className="rounded-xl py-6 shadow-elevated">
            <CardHeader className="px-6">
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 px-6">
              <Button asChild className="w-full rounded-lg">
                <Link href="/adviser/consultations">
                  <Bell data-icon="inline-start" className="size-4" />
                  Review Requests
                </Link>
              </Button>
              <Button asChild variant="outline" className="w-full rounded-lg">
                <Link href="/adviser/availability">
                  <CalendarDays data-icon="inline-start" className="size-4" />
                  Manage Availability
                </Link>
              </Button>
            </CardContent>
          </Card>

          <Card className="rounded-xl py-6 shadow-elevated">
            <CardHeader className="px-6">
              <CardTitle>Recent Activity</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 px-6">
              {recentActivities.map((activity) => (
                <div key={activity.title} className="flex gap-3">
                  <span
                    className={`mt-1.5 size-2 shrink-0 rounded-full ${activity.dotClassName}`}
                  />
                  <div>
                    <p className="text-sm font-semibold text-content-strong">
                      {activity.title}
                    </p>
                    <p className="text-xs text-content-muted">
                      {activity.description}
                    </p>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </aside>
      </div>
    </div>
  );
}
