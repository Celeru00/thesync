"use client";

import { Calendar, CheckCircle, Clock, FileText } from "lucide-react";

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

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="space-y-1">
        <h1 className="text-subheading">
          Welcome back, {data.currentUserName}! 👋
        </h1>
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
        <Card>
          <CardHeader className="pb-2">
            <CardTitle>Upcoming Sessions</CardTitle>
            <CardDescription>
              Your scheduled consultations and defenses
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {upcomingSessions.length > 0 ? (
              upcomingSessions.map((session) => (
                <SessionItem key={session.id} session={session} />
              ))
            ) : (
              <p className="text-body-sm text-content-muted">
                No upcoming sessions yet.
              </p>
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
