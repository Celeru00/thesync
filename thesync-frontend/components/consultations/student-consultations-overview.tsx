"use client";

import Link from "next/link";
import { useState } from "react";
import {
  CalendarDays,
  Clock3,
  FileText,
  Plus,
  RefreshCcw,
  UserRound,
  Video,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import {
  studentAdvisers,
  studentConsultationRecords,
  type ConsultationRequestStatus,
  type StudentConsultationRecord,
} from "@/lib/mock/student-consultations";
import { cn } from "@/lib/utils";

const statusOptions: Array<{
  value: ConsultationRequestStatus | "all";
  label: string;
}> = [
  { value: "all", label: "All Status" },
  { value: "approved", label: "Approved" },
  { value: "pending", label: "Pending" },
  { value: "completed", label: "Completed" },
  { value: "rejected", label: "Rejected" },
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

  const filteredRecords = studentConsultationRecords.filter((record) => {
    if (statusFilter === "all") {
      return true;
    }

    return record.status === statusFilter;
  });

  return (
    <section className="flex w-full flex-col gap-8">
      <header className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
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
          {filteredRecords.map((record) => (
            <ConsultationRecordCard key={record.id} record={record} />
          ))}
        </CardContent>
      </Card>
    </section>
  );
}

function ConsultationRecordCard({
  record,
}: {
  record: StudentConsultationRecord;
}) {
  const adviser = studentAdvisers.find((item) => item.id === record.adviserId);

  return (
    <article className="rounded-[1.45rem] border border-surface bg-surface-card px-6 py-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="space-y-3">
          <div className="flex flex-wrap items-center gap-3">
            <h3 className="text-subheading">{record.title}</h3>
            <Badge
              className={cn(
                "border text-xs",
                record.type === "consultation"
                  ? "border-brand-subtle bg-primary-tint text-brand-strong"
                  : "border-[#E4D4FF] bg-[#F4EAFF] text-[#7C3AED]",
              )}
            >
              {record.type === "consultation" ? "Consultation" : "Defense"}
            </Badge>
          </div>
          <p className="text-[1.05rem] leading-7 text-content-muted">
            {record.summary}
          </p>
        </div>

        <Badge variant={getStatusVariant(record.status)} className="self-start">
          {capitalize(record.status)}
        </Badge>
      </div>

      <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetadataBlock
          icon={UserRound}
          label="Adviser"
          value={adviser?.name ?? "Not assigned"}
        />
        <MetadataBlock
          icon={CalendarDays}
          label="Date"
          value={dateFormatter.format(parseDate(record.date))}
        />
        <MetadataBlock icon={Clock3} label="Time" value={record.timeLabel} />
        <MetadataBlock
          icon={FileText}
          label="Type"
          value={record.type === "consultation" ? "Consultation" : "Defense"}
        />
      </div>

      {record.status === "approved" ? (
        <>
          <Separator className="my-6" />
          <div className="flex flex-wrap gap-3">
            <Button variant="outline" size="sm">
              <Video />
              Join Meeting
            </Button>
            <Button variant="outline" size="sm">
              <RefreshCcw />
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
    case "completed":
      return "outline";
    case "rejected":
      return "destructive";
  }
}

function capitalize(value: string) {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

function parseDate(value: string) {
  const [year, month, day] = value.split("-").map(Number);

  return new Date(year, month - 1, day);
}
