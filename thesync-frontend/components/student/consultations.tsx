"use client";

import { useState } from "react";
import {
  CalendarDays,
  Clock,
  FileText,
  Plus,
  RefreshCw,
  UserRound,
  Video,
} from "lucide-react";
import Link from "next/link";

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
import { ConfirmationModal } from "@/components/modals/confirmation-modal";
import { ScheduleDetailsModal } from "@/components/modals/schedule-details-modal";
import type { Consultation, ConsultationStatus } from "@/types/consultation";
import type { ScheduleDetail } from "@/types/modal";

// ── Mock data (swap for API call when backend is ready) ──────────────────────
const MOCK_CONSULTATIONS: Consultation[] = [
  {
    id: "1",
    title: "Chapter 1 Review",
    description: "Introduction and Background",
    category: "Consultation",
    status: "approved",
    adviser: "Dr. Proceso L. Fernandez",
    adviserId: "2",
    date: "May 5, 2026",
    startTime: "2:00 PM",
    endTime: "3:00 PM",
    type: "Regular",
    meetLink: "https://meet.google.com/abc-defg-hij",
  },
  {
    id: "2",
    title: "Methodology Discussion",
    description: "Research Design and Methods",
    category: "Consultation",
    status: "pending",
    adviser: "Dr. Jasmine A. Malin",
    adviserId: "1",
    date: "May 8, 2026",
    startTime: "10:00 AM",
    endTime: "11:00 AM",
    type: "Regular",
  },
  {
    id: "3",
    title: "Literature Review Feedback",
    description: "Related Studies and Theoretical Framework",
    category: "Consultation",
    status: "completed",
    adviser: "Dr. Proceso L. Fernandez",
    adviserId: "2",
    date: "April 28, 2026",
    startTime: "3:00 PM",
    endTime: "4:00 PM",
    type: "Regular",
  },
  {
    id: "4",
    title: "Thesis Defense",
    description: "Final Defense Presentation",
    category: "Defense",
    status: "approved",
    adviser: "Dr. Lemuel Clark P. Velasco",
    adviserId: "3",
    date: "May 15, 2026",
    startTime: "1:00 PM",
    endTime: "3:00 PM",
    type: "Final Defense",
    meetLink: "https://meet.google.com/xyz-abcd-efg",
  },
  {
    id: "5",
    title: "Data Analysis Review",
    description: "Statistical Analysis Methods",
    category: "Consultation",
    status: "rejected",
    adviser: "Dr. Jasmine A. Malin",
    adviserId: "1",
    date: "May 3, 2026",
    startTime: "11:00 AM",
    endTime: "12:00 PM",
    type: "Regular",
  },
];

// ── Helpers ──────────────────────────────────────────────────────────────────
function toScheduleDetail(c: Consultation): ScheduleDetail {
  return {
    id: c.id,
    title: c.title,
    type: c.type as ScheduleDetail["type"],
    status: c.status,
    date: c.date,
    startTime: c.startTime,
    endTime: c.endTime,
    participants: [
      { id: "adviser", name: c.adviser, role: "Adviser" },
      {
        id: "student",
        name: "John Doe",
        role: "Student",
        email: "john.doe@up.edu.ph",
      },
    ],
    topic: c.title,
    description: c.description,
    meetLink: c.meetLink,
    location: c.location,
  };
}

function statusBadgeVariant(status: ConsultationStatus) {
  switch (status) {
    case "approved":
      return "success" as const;
    case "pending":
      return "warning" as const;
    case "completed":
      return "outline" as const;
    case "rejected":
      return "destructive" as const;
  }
}

// ── Main component ───────────────────────────────────────────────────────────
export function StudentConsultations() {
  const [statusFilter, setStatusFilter] = useState<"all" | ConsultationStatus>(
    "all",
  );
  const [selected, setSelected] = useState<Consultation | null>(null);
  const [rescheduleTarget, setRescheduleTarget] =
    useState<Consultation | null>(null);

  const filtered =
    statusFilter === "all"
      ? MOCK_CONSULTATIONS
      : MOCK_CONSULTATIONS.filter((c) => c.status === statusFilter);

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-subheading">My Consultations</h1>
          <p className="text-body-sm text-content-muted">
            View and manage your consultation schedule
          </p>
        </div>
        <Button asChild>
          <Link href="/student/consultations/request">
            <Plus className="size-4" />
            Request Consultation
          </Link>
        </Button>
      </div>

      {/* List card */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <p className="text-label">All Requests</p>
          <Select
            value={statusFilter}
            onValueChange={(v) =>
              setStatusFilter(v as "all" | ConsultationStatus)
            }
          >
            <SelectTrigger className="w-36">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="approved">Approved</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
              <SelectItem value="rejected">Rejected</SelectItem>
            </SelectContent>
          </Select>
        </CardHeader>

        <CardContent className="p-0">
          {filtered.length === 0 ? (
            <p className="px-6 py-10 text-center text-body-sm text-content-muted">
              No consultations found.
            </p>
          ) : (
            <div className="divide-y divide-surface">
              {filtered.map((c) => (
                <ConsultationItem
                  key={c.id}
                  consultation={c}
                  onViewDetails={() => setSelected(c)}
                  onReschedule={() => setRescheduleTarget(c)}
                />
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Details modal */}
      {selected && (
        <ScheduleDetailsModal
          open={!!selected}
          onOpenChange={(open) => !open && setSelected(null)}
          session={toScheduleDetail(selected)}
          onJoinMeeting={() => {
            if (selected.meetLink) window.open(selected.meetLink, "_blank");
          }}
          onRequestReschedule={() => {
            setSelected(null);
            setRescheduleTarget(selected);
          }}
        />
      )}

      {/* Reschedule confirmation */}
      <ConfirmationModal
        open={!!rescheduleTarget}
        onOpenChange={(open) => !open && setRescheduleTarget(null)}
        title="Request a reschedule?"
        description={`This will send a reschedule request to your adviser for "${rescheduleTarget?.title}". They will review and respond within 24–48 hours.`}
        variant="warning"
        confirmLabel="Send Request"
        onConfirm={() => setRescheduleTarget(null)}
      />
    </div>
  );
}

// ── Consultation item ────────────────────────────────────────────────────────
function ConsultationItem({
  consultation: c,
  onViewDetails,
  onReschedule,
}: {
  consultation: Consultation;
  onViewDetails: () => void;
  onReschedule: () => void;
}) {
  const showActions = c.status === "approved";

  return (
    <div
      className="cursor-pointer px-6 py-5 transition-colors hover:bg-surface/50"
      onClick={onViewDetails}
    >
      {/* Title row */}
      <div className="mb-1 flex flex-wrap items-start justify-between gap-2">
        <div className="flex flex-wrap items-center gap-2">
          <p className="text-label">{c.title}</p>
          <Badge variant={c.category === "Defense" ? "violet" : "info"}>
            {c.category}
          </Badge>
        </div>
        <Badge variant={statusBadgeVariant(c.status)} className="capitalize">
          {c.status}
        </Badge>
      </div>

      {/* Description */}
      <p className="mb-4 text-body-sm text-content-muted">{c.description}</p>

      {/* Metadata grid */}
      <div className="grid grid-cols-2 gap-x-4 gap-y-2 sm:grid-cols-4">
        <MetaItem
          icon={<UserRound className="size-3.5" />}
          label="Adviser"
          value={c.adviser}
        />
        <MetaItem
          icon={<CalendarDays className="size-3.5" />}
          label="Date"
          value={c.date}
        />
        <MetaItem
          icon={<Clock className="size-3.5" />}
          label="Time"
          value={`${c.startTime} - ${c.endTime}`}
        />
        <MetaItem
          icon={<FileText className="size-3.5" />}
          label="Type"
          value={c.type}
        />
      </div>

      {/* Action buttons */}
      {showActions && (
        <div
          className="mt-4 flex flex-wrap gap-2"
          onClick={(e) => e.stopPropagation()}
        >
          {c.meetLink && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => window.open(c.meetLink, "_blank")}
            >
              <Video className="size-3.5" />
              Join Meeting
            </Button>
          )}
          <Button variant="outline" size="sm" onClick={onReschedule}>
            <RefreshCw className="size-3.5" />
            Request Reschedule
          </Button>
        </div>
      )}
    </div>
  );
}

function MetaItem({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div>
      <div className="mb-0.5 flex items-center gap-1 text-caption text-content-muted">
        {icon}
        {label}
      </div>
      <p className="text-body-sm text-content-strong">{value}</p>
    </div>
  );
}
