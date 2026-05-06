"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import {
  CalendarCheck,
  CalendarDays,
  Clock3,
  FileText,
  LoaderCircle,
  RefreshCcw,
  UserRound,
  Video,
  X,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  FilterBar,
  ListItem,
  ListWrapper,
  PaginationPlaceholder,
  SearchInput,
} from "@/components/data-display";
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
import { Textarea } from "@/components/ui/textarea";
import {
  useApproveSchedule,
  useCancelSchedule,
  useRejectSchedule,
  useRescheduleSchedule,
  useSchedules,
} from "@/hooks/useSchedules";
import type { ScheduleListItem } from "@/lib/api";
import { type ConsultationRequestStatus } from "@/lib/mock/student-consultations";
import { cn } from "@/lib/utils";

const statusOptions: Array<{
  label: string;
  value: ConsultationRequestStatus | "all";
}> = [
  { label: "All Status", value: "all" },
  { label: "Approved", value: "approved" },
  { label: "Pending", value: "pending" },
  { label: "Completed", value: "completed" },
  { label: "Rejected", value: "rejected" },
  { label: "Cancelled", value: "cancelled" },
];

const dateFormatter = new Intl.DateTimeFormat("en-US", {
  month: "long",
  day: "numeric",
  year: "numeric",
});

export default function AdviserConsultationsPage() {
  const [statusFilter, setStatusFilter] = useState<
    ConsultationRequestStatus | "all"
  >("all");
  const [searchTerm, setSearchTerm] = useState("");
  const { data, error, isLoading } = useSchedules(
    statusFilter === "all" ? undefined : { status: statusFilter },
  );
  const approveScheduleMutation = useApproveSchedule();
  const cancelScheduleMutation = useCancelSchedule();
  const rejectScheduleMutation = useRejectSchedule();
  const rescheduleScheduleMutation = useRescheduleSchedule();
  const [rescheduleTarget, setRescheduleTarget] =
    useState<ScheduleListItem | null>(null);
  const [rescheduleAt, setRescheduleAt] = useState("");
  const [rescheduleRemarks, setRescheduleRemarks] = useState("");
  const [rescheduleError, setRescheduleError] = useState<string | null>(null);
  const [cancelTarget, setCancelTarget] = useState<ScheduleListItem | null>(
    null,
  );
  const [cancelError, setCancelError] = useState<string | null>(null);

  const filteredRequests = useMemo(() => {
    const requests = data?.items ?? [];
    const normalizedSearch = searchTerm.trim().toLowerCase();

    if (!normalizedSearch) {
      return requests;
    }

    return requests.filter((request) =>
      [
        request.topic,
        request.student_full_name,
        request.type_name,
        request.status_name,
      ]
        .join(" ")
        .toLowerCase()
        .includes(normalizedSearch),
    );
  }, [data?.items, searchTerm]);

  return (
    <section className="flex w-full flex-col gap-8">
      <header className="space-y-2">
        <h1 className="text-heading">Consultation Requests</h1>
        <p className="max-w-3xl text-[1.05rem] leading-8 text-content-muted">
          Review and manage consultation requests from students
        </p>
      </header>

      <ListWrapper
        title="All Requests"
        filters={
          <FilterBar>
            <SearchInput
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              placeholder="Search requests"
              wrapperClassName="md:max-w-sm"
            />
            <Select
              value={statusFilter}
              onValueChange={(value) =>
                setStatusFilter(value as ConsultationRequestStatus | "all")
              }
            >
              <SelectTrigger className="h-10 md:w-48">
                <SelectValue placeholder="Filter consultation requests" />
              </SelectTrigger>
              <SelectContent>
                {statusOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </FilterBar>
        }
        footer={<PaginationPlaceholder totalItems={filteredRequests.length} />}
      >
        {isLoading ? (
          <p className="rounded-lg border border-dashed border-control px-6 py-10 text-center text-body-sm text-content-muted">
            Loading consultation requests...
          </p>
        ) : error ? (
          <div className="rounded-[1rem] border border-destructive/25 bg-destructive/10 px-4 py-4 text-body text-destructive">
            We couldn&apos;t load consultation requests right now.
          </div>
        ) : filteredRequests.length > 0 ? (
          filteredRequests.map((request) => (
            <RequestCard
              key={request.id}
              request={request}
              onApprove={() => approveScheduleMutation.mutate(request.id)}
              onReject={() =>
                rejectScheduleMutation.mutate({
                  id: request.id,
                })
              }
              isApproving={
                approveScheduleMutation.isPending &&
                approveScheduleMutation.variables === request.id
              }
              isCancelling={
                cancelScheduleMutation.isPending &&
                cancelScheduleMutation.variables === request.id
              }
              isRejecting={
                rejectScheduleMutation.isPending &&
                rejectScheduleMutation.variables?.id === request.id
              }
              isRescheduling={
                rescheduleScheduleMutation.isPending &&
                rescheduleScheduleMutation.variables?.id === request.id
              }
              onReschedule={() => {
                setRescheduleTarget(request);
                setRescheduleAt(toDateTimeLocalValue(request.scheduled_at));
                setRescheduleRemarks("");
                setRescheduleError(null);
              }}
              onCancel={() => {
                setCancelTarget(request);
                setCancelError(null);
              }}
            />
          ))
        ) : (
          <p className="rounded-lg border border-dashed border-control px-6 py-10 text-center text-body-sm text-content-muted">
            No consultation requests match your filters.
          </p>
        )}
      </ListWrapper>

      <Dialog
        open={rescheduleTarget !== null}
        onOpenChange={(open) => {
          if (!open) {
            setRescheduleTarget(null);
            setRescheduleAt("");
            setRescheduleRemarks("");
            setRescheduleError(null);
          }
        }}
      >
        <DialogContent className="max-w-lg border border-brand-subtle bg-surface-card">
          <DialogHeader>
            <DialogTitle>Reschedule Consultation</DialogTitle>
            <DialogDescription className="text-content-muted">
              Choose a new schedule time for this approved consultation.
            </DialogDescription>
          </DialogHeader>

          <DialogBody className="space-y-4">
            {rescheduleTarget ? (
              <div className="rounded-[1rem] border border-surface bg-surface-muted-soft px-4 py-4">
                <div className="text-body-sm text-content-muted">Request</div>
                <div className="mt-1 text-card-title">
                  {rescheduleTarget.topic}
                </div>
                <div className="mt-1 text-body text-content-muted">
                  {rescheduleTarget.student_full_name}
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

            <div className="space-y-2">
              <label className="text-body font-medium text-content-strong">
                Remarks
              </label>
              <Textarea
                value={rescheduleRemarks}
                onChange={(event) => setRescheduleRemarks(event.target.value)}
                placeholder="Optional note for the student"
                className="min-h-[7rem] rounded-[0.95rem]"
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
                    remarks: rescheduleRemarks.trim() || undefined,
                  });
                  setRescheduleTarget(null);
                  setRescheduleAt("");
                  setRescheduleRemarks("");
                } catch (error) {
                  setRescheduleError(
                    error instanceof Error
                      ? error.message
                      : "We couldn't reschedule this consultation right now.",
                  );
                }
              }}
            >
              {rescheduleScheduleMutation.isPending ? (
                <>
                  <LoaderCircle className="animate-spin" />
                  Saving...
                </>
              ) : (
                "Save Changes"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={cancelTarget !== null}
        onOpenChange={(open) => {
          if (!open) {
            setCancelTarget(null);
            setCancelError(null);
          }
        }}
      >
        <DialogContent className="max-w-lg border border-brand-subtle bg-surface-card">
          <DialogHeader>
            <DialogTitle>Cancel Approved Schedule</DialogTitle>
            <DialogDescription className="text-content-muted">
              This will cancel the approved consultation for both you and the
              student.
            </DialogDescription>
          </DialogHeader>

          <DialogBody className="space-y-4">
            {cancelTarget ? (
              <div className="rounded-[1rem] border border-surface bg-surface-muted-soft px-4 py-4">
                <div className="text-body-sm text-content-muted">Request</div>
                <div className="mt-1 text-card-title">{cancelTarget.topic}</div>
                <div className="mt-1 text-body text-content-muted">
                  {cancelTarget.student_full_name}
                </div>
              </div>
            ) : null}

            {cancelError ? (
              <div className="rounded-[1rem] border border-destructive/25 bg-destructive/10 px-4 py-3 text-body text-destructive">
                {cancelError}
              </div>
            ) : null}
          </DialogBody>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setCancelTarget(null)}
            >
              Keep Schedule
            </Button>
            <Button
              type="button"
              variant="destructive"
              disabled={cancelScheduleMutation.isPending}
              onClick={async () => {
                if (!cancelTarget) {
                  return;
                }

                setCancelError(null);

                try {
                  await cancelScheduleMutation.mutateAsync(cancelTarget.id);
                  setCancelTarget(null);
                } catch (error) {
                  setCancelError(
                    error instanceof Error
                      ? error.message
                      : "We couldn't cancel this schedule right now.",
                  );
                }
              }}
            >
              {cancelScheduleMutation.isPending ? (
                <>
                  <LoaderCircle className="animate-spin" />
                  Cancelling...
                </>
              ) : (
                "Cancel Schedule"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </section>
  );
}

function RequestCard({
  isCancelling,
  isRescheduling,
  isApproving,
  isRejecting,
  onCancel,
  onApprove,
  onReject,
  onReschedule,
  request,
}: {
  isCancelling: boolean;
  isRescheduling: boolean;
  isApproving: boolean;
  isRejecting: boolean;
  onCancel: () => void;
  onApprove: () => void;
  onReject: () => void;
  onReschedule: () => void;
  request: ScheduleListItem;
}) {
  const statusName = normalizeRequestStatus(request.status_name);
  const typeName = normalizeRequestType(request.type_name);
  const showPendingActions = statusName === "pending";
  const showApprovedActions = statusName === "approved";

  return (
    <ListItem className="px-6 py-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="space-y-3">
          <div className="flex flex-wrap items-center gap-3">
            <h3 className="text-subheading">{request.topic}</h3>
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
            {request.topic}
          </p>
        </div>

        <Badge
          variant={getStatusVariant(statusName)}
          className="self-start sm:self-center"
        >
          {capitalize(statusName)}
        </Badge>
      </div>

      <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <RequestDetail
          icon={UserRound}
          label="Student"
          value={request.student_full_name}
        />
        <RequestDetail
          icon={CalendarDays}
          label="Date"
          value={dateFormatter.format(
            parseIsoDate(request.scheduled_at ?? request.requested_at),
          )}
        />
        <RequestDetail
          icon={Clock3}
          label="Time"
          value={formatTimeRange(request.scheduled_at)}
        />
        <RequestDetail
          icon={FileText}
          label="Type"
          value={typeName === "consultation" ? "Consultation" : "Defense"}
        />
      </div>

      {showPendingActions ? (
        <>
          <Separator className="my-6" />
          <div className="flex flex-wrap gap-3">
            <Button
              type="button"
              size="sm"
              className="bg-success text-white hover:bg-success/90"
              onClick={onApprove}
              disabled={isApproving || isRejecting}
            >
              {isApproving ? (
                <LoaderCircle className="animate-spin" />
              ) : (
                <CalendarCheck />
              )}
              Approve
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="border-red-300 text-red-600 hover:bg-red-50 hover:text-red-700"
              onClick={onReject}
              disabled={isApproving || isRejecting}
            >
              {isRejecting ? <LoaderCircle className="animate-spin" /> : <X />}
              Reject
            </Button>
            <Button type="button" variant="outline" size="sm" disabled>
              <RefreshCcw />
              Reschedule
            </Button>
          </div>
        </>
      ) : null}

      {showApprovedActions ? (
        <>
          <Separator className="my-6" />
          <div className="flex flex-wrap gap-3">
            {request.meet_link ? (
              <Button asChild variant="outline" size="sm">
                <Link href={request.meet_link} target="_blank" rel="noreferrer">
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
              type="button"
              variant="outline"
              size="sm"
              onClick={onReschedule}
              disabled={isRescheduling || isCancelling}
            >
              {isRescheduling ? (
                <LoaderCircle className="animate-spin" />
              ) : (
                <RefreshCcw />
              )}
              Reschedule
            </Button>
            <Button
              type="button"
              variant="destructive"
              size="sm"
              onClick={onCancel}
              disabled={isRescheduling || isCancelling}
            >
              {isCancelling ? <LoaderCircle className="animate-spin" /> : <X />}
              Cancel Schedule
            </Button>
          </div>
        </>
      ) : null}
    </ListItem>
  );
}

function RequestDetail({
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
