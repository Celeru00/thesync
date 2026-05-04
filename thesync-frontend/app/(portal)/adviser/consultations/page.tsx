import {
  CalendarDays,
  Check,
  Clock3,
  FileText,
  RefreshCw,
  UserRound,
  X,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const requests = [
  {
    title: "Chapter 1 Review",
    subtitle: "Introduction and Background",
    student: "John Doe",
    date: "May 5, 2026",
    time: "2:00 PM - 3:00 PM",
    type: "Consultation",
    kind: "Consultation",
    kindVariant: "info",
    status: "Approved",
    statusVariant: "success",
    actions: false,
  },
  {
    title: "Methodology Discussion",
    subtitle: "Research Design and Methods",
    student: "Jane Smith",
    date: "May 8, 2026",
    time: "10:00 AM - 11:00 AM",
    type: "Consultation",
    kind: "Consultation",
    kindVariant: "info",
    status: "Pending",
    statusVariant: "warning",
    actions: true,
  },
  {
    title: "Literature Review Feedback",
    subtitle: "Related Studies and Theoretical Framework",
    student: "John Doe",
    date: "April 28, 2026",
    time: "3:00 PM - 4:00 PM",
    type: "Consultation",
    kind: "Consultation",
    kindVariant: "info",
    status: "Completed",
    statusVariant: "outline",
    actions: false,
  },
  {
    title: "Thesis Defense",
    subtitle: "Final Defense Presentation",
    student: "John Doe",
    date: "May 15, 2026",
    time: "1:00 PM - 3:00 PM",
    type: "Defense",
    kind: "Defense",
    kindVariant: "violet",
    status: "Approved",
    statusVariant: "success",
    actions: false,
  },
  {
    title: "Data Analysis Review",
    subtitle: "Statistical Analysis Methods",
    student: "Jane Smith",
    date: "May 3, 2026",
    time: "11:00 AM - 12:00 PM",
    type: "Consultation",
    kind: "Consultation",
    kindVariant: "info",
    status: "Rejected",
    statusVariant: "destructive",
    actions: false,
  },
] as const;

export default function AdviserConsultationsPage() {
  return (
    <div className="flex flex-col gap-7">
      <header className="space-y-2">
        <h1 className="text-heading">Consultation Requests</h1>
        <p className="text-body text-content-muted">
          Review and manage consultation requests from students
        </p>
      </header>

      <Card className="rounded-xl py-6 shadow-elevated">
        <CardHeader className="grid gap-4 px-6 sm:grid-cols-[1fr_12rem] sm:items-center">
          <CardTitle>All Requests</CardTitle>
          <Select defaultValue="all">
            <SelectTrigger aria-label="Filter consultation requests">
              <SelectValue placeholder="All Status" />
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

        <CardContent className="space-y-4 px-6">
          {requests.map((request) => (
            <article
              key={request.title}
              className="rounded-lg border border-surface p-5"
            >
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="text-card-title">{request.title}</h2>
                    <Badge variant={request.kindVariant}>{request.kind}</Badge>
                  </div>
                  <p className="mt-2 text-body text-content-muted">
                    {request.subtitle}
                  </p>
                </div>
                <Badge
                  variant={request.statusVariant}
                  className="self-start sm:self-center"
                >
                  {request.status}
                </Badge>
              </div>

              <div className="mt-5 grid gap-4 text-sm md:grid-cols-4">
                <RequestDetail
                  icon={UserRound}
                  label="Student"
                  value={request.student}
                />
                <RequestDetail
                  icon={CalendarDays}
                  label="Date"
                  value={request.date}
                />
                <RequestDetail
                  icon={Clock3}
                  label="Time"
                  value={request.time}
                />
                <RequestDetail
                  icon={FileText}
                  label="Type"
                  value={request.type}
                />
              </div>

              {request.actions ? (
                <div className="mt-5 flex flex-wrap gap-3 border-t border-surface pt-4">
                  <Button
                    type="button"
                    className="rounded-lg bg-green-600 hover:bg-green-700"
                  >
                    <Check data-icon="inline-start" className="size-4" />
                    Approve
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    className="rounded-lg border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700"
                  >
                    <X data-icon="inline-start" className="size-4" />
                    Reject
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    className="rounded-lg"
                  >
                    <RefreshCw data-icon="inline-start" className="size-4" />
                    Reschedule
                  </Button>
                </div>
              ) : null}
            </article>
          ))}
        </CardContent>
      </Card>
    </div>
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
    <div className="flex gap-2 text-content">
      <Icon className="mt-1 size-4 shrink-0 text-content-muted" />
      <div>
        <p className="text-sm text-content-muted">{label}</p>
        <p className="font-medium text-content">{value}</p>
      </div>
    </div>
  );
}
