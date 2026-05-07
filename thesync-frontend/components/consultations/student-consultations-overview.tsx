"use client";

import Link from "next/link";
import { useState } from "react";
import {
  CalendarDays,
  Clock3,
  FileText,
  LoaderCircle,
  Plus,
  RefreshCcw,
  UserRound,
  Video,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { useRescheduleSchedule, useSchedules } from "@/hooks/useSchedules";
import {
  studentAdvisers,
  type ConsultationRequestStatus,
} from "@/lib/mock/student-consultations";
import type { ScheduleListItem } from "@/lib/api";
import { cn } from "@/lib/utils";

const statusOptions: Array<{
  value: ConsultationRequestStatus | "all";
  label: string;
}> = [
  { value: "all", label: "All Status" },
  { value: "approved", label: "Approved" },
  { value: "pending", label: "Pending" },
  { value: "rescheduled", label: "Rescheduled" },
  { value: "completed", label: "Completed" },
  { value: "rejected", label: "Rejected" },
  { value: "cancelled", label: "Cancelled" },
];

const dateFormatter = new Intl.DateTimeFormat("en-US", {
  month: "long",
  day: "numeric",
  year: "numeric",
});

export function StudentConsultationsOverview() {
  const [statusFilter, setStatusFilter] = useState<
    ConsultationRequestStatus | "all"
  >("all");
  const [rescheduleTarget, setRescheduleTarget] =
    useState<ScheduleListItem | null>(null);
  const [rescheduleAt, setRescheduleAt] = useState("");
  const [rescheduleError, setRescheduleError] = useState<string | null>(null);
  const { data, isLoading, error } = useSchedules(
    statusFilter === "all" ? undefined : { status: statusFilter },
  );
  const rescheduleScheduleMutation = useRescheduleSchedule();

  const records = data?.items ?? [];

  return (
    <section className="flex w-full flex-col gap-8">
      <header className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between lg:pr-16">
        <div className="space-y-2">
          <h1 className="text-heading">My Consultations</h1>
          <p className="max-w-3xl text-[1.05rem] leading-8 text-content-muted">
            View and manage your consultation schedule
          </p>
        </div>

        <Button asChild size="lg" className="self-start shadow-elevated">
          <Link href="/student/consultations/request">
            <Plus />
            Request Consultation
          </Link>
        </Button>
      </header>

      <Card className="gap-0 rounded-[2rem] border-brand-subtle py-0 shadow-elevated">
        <CardHeader className="flex flex-col gap-4 border-b border-surface px-6 py-6 sm:px-7 lg:flex-row lg:items-center lg:justify-between">
          <h2 className="text-section-title">All Requests</h2>
          <div className="w-full max-w-[13.5rem]">
            <Select
              value={statusFilter}
              onValueChange={(value) =>
                setStatusFilter(value as ConsultationRequestStatus | "all")
              }
            >
              <SelectTrigger className="h-11 rounded-[1rem]">
                <SelectValue placeholder="Filter status" />
              </SelectTrigger>
              <SelectContent>
                {statusOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardHeader>

        <CardContent className="space-y-4 px-6 py-6 sm:px-7">
          {isLoading ? (
            <div className="py-8 text-center text-body text-content-muted">
              Loading consultations...
            </div>
          ) : error ? (
            <div className="rounded-[1rem] border border-destructive/25 bg-destructive/10 px-4 py-4 text-body text-destructive">
              We couldn&apos;t load your consultations right now.
            </div>
          ) : records.length === 0 ? (
            <div className="py-8 text-center text-body text-content-muted">
              No consultations found.
            </div>
          ) : (
            records.map((record) => (
              <ConsultationRecordCard
                key={record.id}
                record={record}
                isRescheduling={
                  rescheduleScheduleMutation.isPending &&
                  rescheduleScheduleMutation.variables?.id === record.id
                }
                onReschedule={() => {
                  setRescheduleTarget(record);
                  setRescheduleAt(toDateTimeLocalValue(record.scheduled_at));
                  setRescheduleError(null);
                }}
              />
            ))
          )}
        </CardContent>
      </Card>

      <Dialog
        open={rescheduleTarget !== null}
        onOpenChange={(open) => {
          if (!open) {
            setRescheduleTarget(null);
            setRescheduleAt("");
            setRescheduleError(null);
          }
        }}
      >
        <DialogContent className="max-w-lg border border-brand-subtle bg-surface-card">
          <DialogHeader>
            <DialogTitle>Request Reschedule</DialogTitle>
            <DialogDescription className="text-content-muted">
              Choose a new date and time for this approved consultation. Your
              adviser will review the change.
            </DialogDescription>
          </DialogHeader>

          <DialogBody className="space-y-4">
            {rescheduleTarget ? (
              <div className="rounded-[1rem] border border-surface bg-surface-muted-soft px-4 py-4">
                <div className="text-body-sm text-content-muted">
                  Consultation
                </div>
                <div className="mt-1 text-card-title">
                  {rescheduleTarget.topic}
                </div>
                <div className="mt-1 text-body text-content-muted">
                  {rescheduleTarget.adviser_full_name}
                </div>
              </div>
            ) : null}

            <div className="space-y-2">
              <label className="text-body font-medium text-content-strong">
                New Date & Time
              </label>
              <Input
                type="datetime-local"
                value={rescheduleAt}
                onChange={(event) => {
                  setRescheduleAt(event.target.value);
                  setRescheduleError(null);
                }}
                className="h-11 rounded-[0.95rem]"
              />
            </div>

            {rescheduleError ? (
              <div className="rounded-[1rem] border border-destructive/25 bg-destructive/10 px-4 py-3 text-body text-destructive">
                {rescheduleError}
              </div>
            ) : null}
          </DialogBody>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setRescheduleTarget(null)}
            >
              Cancel
            </Button>
            <Button
              type="button"
              disabled={!rescheduleAt || rescheduleScheduleMutation.isPending}
              onClick={async () => {
                if (!rescheduleTarget || !rescheduleAt) {
                  setRescheduleError("Please choose a new date and time.");
                  return;
                }

                setRescheduleError(null);

                try {
                  await rescheduleScheduleMutation.mutateAsync({
                    id: rescheduleTarget.id,
                    new_scheduled_at: new Date(rescheduleAt).toISOString(),
                  });
                  setRescheduleTarget(null);
                  setRescheduleAt("");
                } catch (error) {
                  setRescheduleError(
                    error instanceof Error
                      ? error.message
                      : "We couldn't send your reschedule request right now.",
                  );
                }
              }}
            >
              {rescheduleScheduleMutation.isPending ? (
                <>
                  <LoaderCircle className="animate-spin" />
                  Sending...
                </>
              ) : (
                "Send Request"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </section>
  );
}

function ConsultationRecordCard({
  isRescheduling,
  onReschedule,
  record,
}: {
  isRescheduling: boolean;
  onReschedule: () => void;
  record: ScheduleListItem;
}) {
  const adviser = studentAdvisers.find(
    (item) => item.name === record.adviser_full_name,
  );
  const scheduleDate = parseIsoDate(record.scheduled_at ?? record.requested_at);
  const scheduleTimeLabel = formatTimeRange(record.scheduled_at);
  const typeName = normalizeRequestType(record.type_name);
  const statusName = normalizeRequestStatus(record.status_name);

  return (
    <article className="rounded-[1.45rem] border border-surface bg-surface-card px-6 py-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="space-y-3">
          <div className="flex flex-wrap items-center gap-3">
            <h3 className="text-subheading">{record.topic}</h3>
            <Badge
              className={cn(
                "border text-xs",
                typeName === "consultation"
                  ? "border-brand-subtle bg-primary-tint text-brand-strong"
                  : "border-[#E4D4FF] bg-[#F4EAFF] text-[#7C3AED]",
              )}
            >
              {typeName === "consultation" ? "Consultation" : "Defense"}
            </Badge>
          </div>
          <p className="text-[1.05rem] leading-7 text-content-muted">
            {record.topic}
          </p>
        </div>

        <Badge variant={getStatusVariant(statusName)} className="self-start">
          {capitalize(statusName)}
        </Badge>
      </div>

      <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetadataBlock
          icon={UserRound}
          label="Adviser"
          value={adviser?.name ?? record.adviser_full_name ?? "Not assigned"}
        />
        <MetadataBlock
          icon={CalendarDays}
          label="Date"
          value={dateFormatter.format(scheduleDate)}
        />
        <MetadataBlock icon={Clock3} label="Time" value={scheduleTimeLabel} />
        <MetadataBlock
          icon={FileText}
          label="Type"
          value={typeName === "consultation" ? "Consultation" : "Defense"}
        />
      </div>

      {statusName === "approved" ? (
        <>
          <Separator className="my-6" />
          <div className="flex flex-wrap gap-3">
            {record.meet_link ? (
              <Button asChild variant="outline" size="sm">
                <Link href={record.meet_link} target="_blank" rel="noreferrer">
                  <Video />
                  Join Meeting
                </Link>
              </Button>
            ) : (
              <Button variant="outline" size="sm" disabled>
                <Video />
                Join Meeting
              </Button>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={onReschedule}
              disabled={isRescheduling}
            >
              {isRescheduling ? (
                <LoaderCircle className="animate-spin" />
              ) : (
                <RefreshCcw />
              )}
              Request Reschedule
            </Button>
          </div>
        </>
      ) : null}
    </article>
  );
}

function MetadataBlock({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof UserRound;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-start gap-3">
      <Icon className="mt-1 size-4 text-content-muted" />
      <div className="space-y-0.5">
        <div className="text-body-sm text-content-muted">{label}</div>
        <div className="text-body font-medium text-content-strong">{value}</div>
      </div>
    </div>
  );
}

function getStatusVariant(status: ConsultationRequestStatus) {
  switch (status) {
    case "approved":
      return "success";
    case "pending":
      return "warning";
    case "rescheduled":
      return "info";
    case "completed":
      return "outline";
    case "rejected":
      return "destructive";
    case "cancelled":
      return "secondary";
  }
}

function capitalize(value: string) {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

function parseIsoDate(value: string) {
  const date = new Date(value);

  return Number.isNaN(date.getTime()) ? new Date() : date;
}

function normalizeRequestStatus(value: string): ConsultationRequestStatus {
  if (
    value === "approved" ||
    value === "pending" ||
    value === "rescheduled" ||
    value === "completed" ||
    value === "rejected" ||
    value === "cancelled"
  ) {
    return value;
  }

  return "pending";
}

function normalizeRequestType(value: string) {
  return value === "defense" ? "defense" : "consultation";
}

function formatTimeRange(scheduledAt: string | null) {
  if (!scheduledAt) {
    return "Not scheduled";
  }

  const start = new Date(scheduledAt);

  if (Number.isNaN(start.getTime())) {
    return "Not scheduled";
  }

  const end = new Date(start.getTime() + 60 * 60 * 1000);
  const timeFormatter = new Intl.DateTimeFormat("en-US", {
    hour: "numeric",
    minute: "2-digit",
  });

  return `${timeFormatter.format(start)} - ${timeFormatter.format(end)}`;
}

function toDateTimeLocalValue(value: string | null) {
  if (!value) {
    return "";
  }

  const parsed = new Date(value);

  if (Number.isNaN(parsed.getTime())) {
    return "";
  }

  const year = parsed.getFullYear();
  const month = String(parsed.getMonth() + 1).padStart(2, "0");
  const day = String(parsed.getDate()).padStart(2, "0");
  const hours = String(parsed.getHours()).padStart(2, "0");
  const minutes = String(parsed.getMinutes()).padStart(2, "0");

  return `${year}-${month}-${day}T${hours}:${minutes}`;
}
