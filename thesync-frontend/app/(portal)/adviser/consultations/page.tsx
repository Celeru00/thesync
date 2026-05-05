"use client";

import { useMemo, useState } from "react";
import {
  CalendarCheck,
  CalendarDays,
  Clock3,
  FileText,
  RefreshCcw,
  UserRound,
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import {
  studentConsultationRecords,
  type ConsultationRequestStatus,
} from "@/lib/mock/student-consultations";
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
];

const dateFormatter = new Intl.DateTimeFormat("en-US", {
  month: "long",
  day: "numeric",
  year: "numeric",
});

type RequestRecord = (typeof studentConsultationRecords)[number];

export default function AdviserConsultationsPage() {
  const [statusFilter, setStatusFilter] = useState<
    ConsultationRequestStatus | "all"
  >("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [requests, setRequests] = useState(studentConsultationRecords);

  const filteredRequests = useMemo(() => {
    return requests.filter((request) => {
      const matchesStatus =
        statusFilter === "all" || request.status === statusFilter;
      const normalizedSearch = searchTerm.trim().toLowerCase();
      const matchesSearch =
        normalizedSearch.length === 0 ||
        [request.title, request.summary, request.studentName, request.timeLabel]
          .join(" ")
          .toLowerCase()
          .includes(normalizedSearch);

      return matchesStatus && matchesSearch;
    });
  }, [requests, searchTerm, statusFilter]);

  function handleStatusChange(
    requestId: string,
    nextStatus: ConsultationRequestStatus,
  ) {
    setRequests((currentRequests) =>
      currentRequests.map((request) =>
        request.id === requestId
          ? {
              ...request,
              status: nextStatus,
            }
          : request,
      ),
    );
  }

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
        {filteredRequests.length > 0 ? (
          filteredRequests.map((request) => (
            <RequestCard
              key={request.id}
              request={request}
              onApprove={() => handleStatusChange(request.id, "approved")}
              onReject={() => handleStatusChange(request.id, "rejected")}
            />
          ))
        ) : (
          <p className="rounded-lg border border-dashed border-control px-6 py-10 text-center text-body-sm text-content-muted">
            No consultation requests match your filters.
          </p>
        )}
      </ListWrapper>
    </section>
  );
}

function RequestCard({
  onApprove,
  onReject,
  request,
}: {
  onApprove: () => void;
  onReject: () => void;
  request: RequestRecord;
}) {
  const showActions = request.status === "pending";

  return (
    <ListItem className="px-6 py-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="space-y-3">
          <div className="flex flex-wrap items-center gap-3">
            <h3 className="text-subheading">{request.title}</h3>
            <Badge
              className={cn(
                "border text-xs",
                request.type === "consultation"
                  ? "border-brand-subtle bg-primary-tint text-brand-strong"
                  : "border-[#E4D4FF] bg-[#F4EAFF] text-[#7C3AED]",
              )}
            >
              {request.type === "consultation" ? "Consultation" : "Defense"}
            </Badge>
          </div>
          <p className="text-[1.05rem] leading-7 text-content-muted">
            {request.summary}
          </p>
        </div>

        <Badge
          variant={getStatusVariant(request.status)}
          className="self-start sm:self-center"
        >
          {capitalize(request.status)}
        </Badge>
      </div>

      <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <RequestDetail
          icon={UserRound}
          label="Student"
          value={request.studentName}
        />
        <RequestDetail
          icon={CalendarDays}
          label="Date"
          value={dateFormatter.format(parseDate(request.date))}
        />
        <RequestDetail icon={Clock3} label="Time" value={request.timeLabel} />
        <RequestDetail
          icon={FileText}
          label="Type"
          value={request.type === "consultation" ? "Consultation" : "Defense"}
        />
      </div>

      {showActions ? (
        <>
          <Separator className="my-6" />
          <div className="flex flex-wrap gap-3">
            <Button
              type="button"
              size="sm"
              className="bg-success text-white hover:bg-success/90"
              onClick={onApprove}
            >
              <CalendarCheck />
              Approve
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="border-red-300 text-red-600 hover:bg-red-50 hover:text-red-700"
              onClick={onReject}
            >
              <X />
              Reject
            </Button>
            <Button type="button" variant="outline" size="sm">
              <RefreshCcw />
              Reschedule
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
  }
}

function capitalize(value: string) {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

function parseDate(value: string) {
  const [year, month, day] = value.split("-").map(Number);

  return new Date(year, month - 1, day);
}
