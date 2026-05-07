"use client";

import Link from "next/link";
import { Calendar, CheckCircle, Clock, FileText } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useStudentDashboard } from "@/hooks/use-student-dashboard";

import { QuickActions } from "./quick-actions";
import { RecentActivity } from "./recent-activity";
import { SessionItem } from "./session-item";
import { StatCard } from "./stat-card";

function getFirstName(fullName: string) {
  const trimmed = fullName.trim();

  if (!trimmed) {
    return "there";
  }

  return trimmed.split(/\s+/)[0] ?? "there";
}

export function StudentDashboard() {
  const { data, isLoading, error } = useStudentDashboard();

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

  const { stats, upcomingSessions, recentActivity } = data;
  const firstName = getFirstName(data.currentUserName);

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="space-y-1">
        <h1 className="text-subheading">Welcome back, {firstName}! 👋</h1>
        <p className="text-body-sm">
          Here&apos;s an overview of your thesis consultation schedule
        </p>
      </div>

      {/* Stat cards — 2-up on mobile, 4-up on md+ (per design system grid pattern) */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <StatCard
          label="Upcoming Sessions"
          value={stats.upcomingSessions}
          icon={Calendar}
          iconBgClassName="bg-info-soft"
          iconClassName="text-info"
        />
        <StatCard
          label="Pending Requests"
          value={stats.pendingRequests}
          icon={Clock}
          iconBgClassName="bg-warning-soft"
          iconClassName="text-warning"
        />
        <StatCard
          label="Completed"
          value={stats.completed}
          icon={CheckCircle}
          iconBgClassName="bg-success-soft"
          iconClassName="text-success"
        />
        <StatCard
          label="Total Hours"
          value={stats.totalHours}
          icon={FileText}
          iconBgClassName="bg-violet-soft"
          iconClassName="text-violet"
        />
      </div>

      {/* Main content — single column on mobile, sidebar on lg+ */}
      <div className="grid gap-6 lg:grid-cols-[1fr_300px]">
        <Card className="flex min-h-[24rem] flex-col">
          <CardHeader className="pb-2">
            <CardTitle>Upcoming Sessions</CardTitle>
            <CardDescription>
              Your scheduled consultations and defenses
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-1 flex-col">
            {upcomingSessions.length > 0 ? (
              <div className="space-y-3">
                {upcomingSessions.map((session) => (
                  <SessionItem key={session.id} session={session} />
                ))}
              </div>
            ) : (
              <div className="flex flex-1 items-center justify-center">
                <div className="flex w-full max-w-xl flex-col items-center rounded-[1.35rem] border border-dashed border-brand-subtle bg-linear-to-br from-primary-tint/35 via-white to-background px-6 py-10 text-center">
                  <div className="flex size-16 items-center justify-center rounded-2xl bg-info-soft text-info shadow-soft">
                    <Calendar className="size-8" />
                  </div>
                  <h3 className="mt-5 text-card-title text-content-strong">
                    No upcoming sessions yet
                  </h3>
                  <p className="mt-2 max-w-md text-body-sm text-content-muted">
                    Once an adviser approves your request, your next
                    consultation or defense will appear here with its exact date
                    and time.
                  </p>
                  <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                    <Button asChild className="rounded-xl">
                      <Link href="/student/consultations/request">
                        Request Consultation
                      </Link>
                    </Button>
                    <Button asChild variant="outline" className="rounded-xl">
                      <Link href="/student/calendar">Open Calendar</Link>
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <div className="space-y-6">
          <QuickActions />
          <RecentActivity items={recentActivity} />
        </div>
      </div>
    </div>
  );
}
