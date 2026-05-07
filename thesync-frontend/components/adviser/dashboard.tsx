"use client";

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
import { useAdviserDashboard } from "@/hooks/use-adviser-dashboard";

const activityDotClassName = {
  approved: "bg-success",
  notification: "bg-primary",
  completed: "bg-violet",
} as const;

function getFirstName(fullName: string) {
  const trimmed = fullName.trim();

  if (!trimmed) {
    return "there";
  }

  return trimmed.split(/\s+/)[0] ?? "there";
}

export function AdviserDashboard() {
  const { data, isLoading, error } = useAdviserDashboard();

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <p className="text-body-sm">Loading dashboard…</p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="flex h-64 items-center justify-center">
        <p className="text-body-sm text-content-muted">
          Unable to load the dashboard right now.
        </p>
      </div>
    );
  }

  const firstName = getFirstName(data.currentUserName);
  const summaryCards = [
    {
      label: "Pending Approvals",
      value: data.stats.pendingApprovals,
      icon: Clock3,
      iconClassName: "bg-orange-100 text-orange-600",
    },
    {
      label: "Today's Sessions",
      value: data.stats.todaysSessions,
      icon: CalendarDays,
      iconClassName: "bg-blue-100 text-blue-600",
    },
    {
      label: "Active Advisees",
      value: data.stats.activeAdvisees,
      icon: UsersRound,
      iconClassName: "bg-green-100 text-green-600",
    },
    {
      label: "This Month",
      value: data.stats.thisMonth,
      icon: FileText,
      iconClassName: "bg-purple-100 text-purple-600",
    },
  ] as const;

  return (
    <div className="flex flex-col gap-7">
      <header className="space-y-2">
        <h1 className="text-heading">Welcome back, {firstName}!</h1>
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
        <Card className="flex min-h-[24rem] flex-col rounded-xl py-6 shadow-elevated">
          <CardHeader className="px-6">
            <CardTitle>Upcoming Sessions</CardTitle>
            <CardDescription className="text-base">
              Your scheduled consultations and defenses
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-1 flex-col px-6">
            {data.upcomingSessions.length > 0 ? (
              <div className="space-y-4">
                {data.upcomingSessions.map((session) => (
                  <article
                    key={session.id}
                    className="flex flex-col gap-4 rounded-lg border border-surface p-4 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div className="flex min-w-0 gap-4">
                      <div
                        className={
                          session.type === "defense"
                            ? "flex size-12 shrink-0 items-center justify-center rounded-xl bg-purple-100 text-purple-600"
                            : "flex size-12 shrink-0 items-center justify-center rounded-xl bg-blue-100 text-blue-600"
                        }
                      >
                        {session.type === "defense" ? (
                          <UsersRound className="size-6" />
                        ) : (
                          <FileText className="size-6" />
                        )}
                      </div>
                      <div className="min-w-0">
                        <h2 className="text-card-title">{session.title}</h2>
                        <p className="text-body-sm text-content-muted">
                          {session.studentName}
                        </p>
                        <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-sm text-content-muted">
                          <span className="inline-flex items-center gap-1">
                            <CalendarDays className="size-4" />
                            {session.date}
                          </span>
                          <span className="inline-flex items-center gap-1">
                            <Clock3 className="size-4" />
                            {session.startTime} - {session.endTime}
                          </span>
                        </div>
                      </div>
                    </div>
                    <Badge
                      variant={getDashboardBadgeVariant(session.status)}
                      className="self-start capitalize sm:self-center"
                    >
                      {session.status}
                    </Badge>
                  </article>
                ))}
              </div>
            ) : (
              <div className="flex flex-1 items-center justify-center">
                <div className="flex w-full max-w-xl flex-col items-center rounded-[1.35rem] border border-dashed border-brand-subtle bg-linear-to-br from-primary-tint/35 via-white to-background px-6 py-10 text-center">
                  <div className="flex size-16 items-center justify-center rounded-2xl bg-info-soft text-info shadow-soft">
                    <CalendarDays className="size-8" />
                  </div>
                  <h3 className="mt-5 text-card-title text-content-strong">
                    No upcoming sessions scheduled
                  </h3>
                  <p className="mt-2 max-w-md text-body-sm text-content-muted">
                    When students book consultations or defenses with you,
                    approved sessions will appear here so you can review your
                    week at a glance.
                  </p>
                  <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                    <Button asChild className="rounded-xl">
                      <Link href="/adviser/availability">
                        Manage Availability
                      </Link>
                    </Button>
                    <Button asChild variant="outline" className="rounded-xl">
                      <Link href="/adviser/consultations">Review Requests</Link>
                    </Button>
                  </div>
                </div>
              </div>
            )}
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
              {data.recentActivity.length > 0 ? (
                data.recentActivity.map((activity) => (
                  <div key={activity.id} className="flex gap-3">
                    <span
                      className={`mt-1.5 size-2 shrink-0 rounded-full ${activityDotClassName[activity.type]}`}
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
                ))
              ) : (
                <p className="text-body-sm text-content-muted">
                  No recent activity yet.
                </p>
              )}
            </CardContent>
          </Card>
        </aside>
      </div>
    </div>
  );
}

function getDashboardBadgeVariant(status: string) {
  if (status === "approved") {
    return "success";
  }

  if (status === "rescheduled") {
    return "info";
  }

  if (status === "cancelled") {
    return "destructive";
  }

  return "warning";
}
