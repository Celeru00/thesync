"use client";

import { useState } from "react";
import {
  ArrowLeft,
  CalendarDays,
  CheckCircle2,
  Clock,
  FileText,
  Info,
  UserRound,
  XCircle,
} from "lucide-react";
import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

const CONSULTATION_TYPES = [
  "Regular",
  "Proposal Defense",
  "Final Defense",
  "Revision",
] as const;
type ConsultationType = (typeof CONSULTATION_TYPES)[number];

const ADVISERS = [
  {
    id: "1",
    name: "Dr. Jasmine A. Malin",
    department: "DMPCS",
    availability: "Medium",
  },
  {
    id: "2",
    name: "Dr. Proceso L. Fernandez",
    department: "DMPCS",
    availability: "High",
  },
  {
    id: "3",
    name: "Dr. Lemuel Clark P. Velasco",
    department: "DMPCS",
    availability: "Low",
  },
];

const PANELISTS = [
  { id: "p1", name: "Dr. Proceso L. Fernandez", department: "DMPCS" },
  { id: "p2", name: "Dr. Jasmine A. Malin", department: "DMPCS" },
  { id: "p3", name: "Dr. Lemuel Clark P. Velasco", department: "DMPCS" },
  { id: "p4", name: "Dr. Richard Bryann L. Chua", department: "DBSES" },
  { id: "p5", name: "Dr. Maria Isabelle Carla G. Beltran", department: "DFSC" },
];

type TimeFilter = "Morning" | "Afternoon" | "All Day";

interface TimeSlot {
  time: string;
  busy: boolean;
}

const ALL_SLOTS: TimeSlot[] = [
  { time: "8:00 AM", busy: false },
  { time: "8:30 AM", busy: false },
  { time: "9:00 AM", busy: true },
  { time: "9:30 AM", busy: false },
  { time: "10:00 AM", busy: false },
  { time: "10:30 AM", busy: true },
  { time: "11:00 AM", busy: false },
  { time: "11:30 AM", busy: false },
  { time: "1:00 PM", busy: false },
  { time: "1:30 PM", busy: false },
  { time: "2:00 PM", busy: false },
  { time: "2:30 PM", busy: true },
  { time: "3:00 PM", busy: false },
  { time: "3:30 PM", busy: false },
  { time: "4:00 PM", busy: true },
  { time: "4:30 PM", busy: false },
  { time: "5:00 PM", busy: false },
];

const MAX_DESC = 500;

export function RequestConsultation() {
  const [type, setType] = useState<ConsultationType>("Regular");
  const [adviserId, setAdviserId] = useState("");
  const [panelists, setPanelists] = useState<string[]>([]);
  const [date, setDate] = useState("");
  const [timeFilter, setTimeFilter] = useState<TimeFilter>("All Day");
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [topic, setTopic] = useState("");
  const [description, setDescription] = useState("");

  const adviser = ADVISERS.find((a) => a.id === adviserId);

  function togglePanelist(id: string) {
    setPanelists((prev) =>
      prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id],
    );
  }

  const filteredSlots = ALL_SLOTS.filter((s) => {
    if (timeFilter === "Morning") return s.time.includes("AM");
    if (timeFilter === "Afternoon") return s.time.includes("PM");
    return true;
  });

  const availableCount = ALL_SLOTS.filter((s) => !s.busy).length;

  const allParticipants = [
    ...(adviser ? [adviser.name] : []),
    ...panelists.map((id) => PANELISTS.find((p) => p.id === id)?.name ?? ""),
  ].filter(Boolean);

  const typeLabel = type.toLowerCase();
  const canSubmit =
    adviserId !== "" &&
    date !== "" &&
    selectedTime !== null &&
    topic.trim() !== "";

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/student/consultations">
            <ArrowLeft className="size-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-subheading">Request Consultation</h1>
          <p className="text-body-sm text-content-muted">
            Fill in the details to schedule a consultation with your adviser
          </p>
        </div>
      </div>

      {/* Two-column layout */}
      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        {/* Left — Form */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Consultation Details</CardTitle>
              <p className="text-body-sm text-content-muted">
                Provide information about your consultation request
              </p>
            </CardHeader>
            <CardContent className="space-y-5">
              {/* Consultation Type */}
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <FileText className="size-4 text-content-muted" />
                  Consultation Type
                </Label>
                <Select
                  value={type}
                  onValueChange={(v) => setType(v as ConsultationType)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {CONSULTATION_TYPES.map((t) => (
                      <SelectItem key={t} value={t}>
                        {t}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Select Adviser */}
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <UserRound className="size-4 text-content-muted" />
                  Select Adviser
                </Label>
                <Select value={adviserId} onValueChange={setAdviserId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select an adviser" />
                  </SelectTrigger>
                  <SelectContent>
                    {ADVISERS.map((a) => (
                      <SelectItem key={a.id} value={a.id}>
                        {a.name}{" "}
                        <span className="text-content-muted">
                          ({a.department})
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Select Panelists */}
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <UserRound className="size-4 text-content-muted" />
                  Select Panelists{" "}
                  <span className="font-normal text-content-muted">
                    (Optional)
                  </span>
                </Label>
                <div className="divide-y divide-surface rounded-xl border border-surface">
                  {PANELISTS.map((p) => (
                    <div
                      key={p.id}
                      className="flex items-center gap-3 px-4 py-3"
                    >
                      <Checkbox
                        id={p.id}
                        checked={panelists.includes(p.id)}
                        onCheckedChange={() => togglePanelist(p.id)}
                      />
                      <label
                        htmlFor={p.id}
                        className="flex-1 cursor-pointer text-body-sm"
                      >
                        <span className="font-medium">{p.name}</span>
                        <span className="text-content-muted">
                          ({p.department})
                        </span>
                      </label>
                    </div>
                  ))}
                </div>
                {panelists.length > 0 && (
                  <p className="text-caption text-content-muted">
                    {panelists.length} panelist
                    {panelists.length !== 1 ? "s" : ""} selected
                  </p>
                )}
              </div>

              {/* Preferred Date */}
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <CalendarDays className="size-4 text-content-muted" />
                  Preferred Date
                </Label>
                <Input
                  type="date"
                  value={date}
                  onChange={(e) => {
                    setDate(e.target.value);
                    setSelectedTime(null);
                  }}
                />
              </div>

              {/* Select Time */}
              <div className="space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <Label className="flex items-center gap-2">
                      <Clock className="size-4 text-content-muted" />
                      Select Time
                    </Label>
                    {date && (
                      <p className="mt-0.5 text-caption text-content-muted">
                        {availableCount} of {ALL_SLOTS.length} slots available
                        on {date}
                      </p>
                    )}
                  </div>
                  <div className="flex rounded-lg border border-surface p-0.5 text-body-sm">
                    {(["Morning", "Afternoon", "All Day"] as TimeFilter[]).map(
                      (f) => (
                        <button
                          key={f}
                          onClick={() => setTimeFilter(f)}
                          className={cn(
                            "rounded-md px-3 py-1 transition-colors",
                            timeFilter === f
                              ? "bg-brand text-white"
                              : "text-content-muted hover:text-content-strong",
                          )}
                        >
                          {f}
                        </button>
                      ),
                    )}
                  </div>
                </div>

                {/* Availability participants */}
                {allParticipants.length > 0 && (
                  <div className="flex flex-wrap items-center gap-1.5 text-caption text-content-muted">
                    <Clock className="size-3.5 shrink-0" />
                    <span>Checking availability for:</span>
                    {allParticipants.map((name) => (
                      <span
                        key={name}
                        className="rounded-md bg-surface px-2 py-0.5 text-content-strong"
                      >
                        {name}
                      </span>
                    ))}
                  </div>
                )}

                {/* Time slot grid */}
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                  {filteredSlots.map((slot) => {
                    const isSelected = selectedTime === slot.time;
                    return (
                      <button
                        key={slot.time}
                        disabled={slot.busy}
                        onClick={() =>
                          setSelectedTime(isSelected ? null : slot.time)
                        }
                        className={cn(
                          "flex flex-col gap-0.5 rounded-xl border px-3 py-2.5 text-left transition-colors",
                          slot.busy
                            ? "cursor-not-allowed border-surface bg-surface/50 opacity-60"
                            : isSelected
                              ? "border-brand bg-brand/10 ring-1 ring-brand"
                              : "border-surface hover:border-brand/40 hover:bg-surface",
                        )}
                      >
                        <span className="text-label">{slot.time}</span>
                        <span
                          className={cn(
                            "flex items-center gap-1 text-caption",
                            slot.busy
                              ? "text-error"
                              : isSelected
                                ? "text-brand"
                                : "text-success",
                          )}
                        >
                          {slot.busy ? (
                            <XCircle className="size-3" />
                          ) : (
                            <CheckCircle2 className="size-3" />
                          )}
                          {slot.busy
                            ? "Busy"
                            : isSelected
                              ? "Selected"
                              : "Available"}
                        </span>
                      </button>
                    );
                  })}
                </div>

                {/* Legend */}
                <div className="flex flex-wrap gap-4 text-caption text-content-muted">
                  <span className="flex items-center gap-1">
                    <CheckCircle2 className="size-3.5 text-success" />
                    Available
                  </span>
                  <span className="flex items-center gap-1">
                    <XCircle className="size-3.5 text-error" />
                    Busy
                  </span>
                  <span className="flex items-center gap-1">
                    <div className="size-3.5 rounded-sm border-2 border-brand" />
                    Selected
                  </span>
                </div>

                {/* Selected time confirmation */}
                {selectedTime && (
                  <div className="flex items-center gap-3 rounded-xl border border-success/30 bg-success/10 px-4 py-3">
                    <CheckCircle2 className="size-4 shrink-0 text-success" />
                    <div>
                      <p className="text-label text-success">{selectedTime}</p>
                      <p className="text-caption text-content-muted">
                        is available for all participants
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* Topic */}
              <div className="space-y-2">
                <Label>Topic / Title</Label>
                <Input
                  placeholder="Chapter 1-2 Review"
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                />
              </div>

              {/* Description */}
              <div className="space-y-2">
                <Label>Description / Agenda</Label>
                <Textarea
                  placeholder="Provide details about what you'd like to discuss during this consultation…"
                  rows={4}
                  value={description}
                  maxLength={MAX_DESC}
                  onChange={(e) => setDescription(e.target.value)}
                />
                <p className="text-right text-caption text-content-muted">
                  {description.length}/{MAX_DESC} characters
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Action buttons */}
          <div className="flex justify-end gap-3">
            <Button variant="outline" asChild>
              <Link href="/student/consultations">Cancel</Link>
            </Button>
            <Button disabled={!canSubmit}>Submit Request</Button>
          </div>
        </div>

        {/* Right — Sidebar */}
        <div className="space-y-4">
          {/* Request Summary */}
          <Card>
            <CardHeader>
              <CardTitle>Request Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <SummaryRow label="Type" value={typeLabel} />
              <SummaryRow label="Adviser" value={adviser?.name ?? "—"} />
              <SummaryRow
                label="Date & Time"
                value={
                  date && selectedTime ? `${date} at ${selectedTime}` : "—"
                }
              />
              <SummaryRow label="Topic" value={topic || "—"} />
            </CardContent>
          </Card>

          {/* Important Notes */}
          <Card className="border-info-soft">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-info">
                <Info className="size-4" />
                Important Notes
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {[
                  "Your adviser will review and respond to your request within 24-48 hours",
                  "Email notifications will be sent to your UP email for all status updates",
                  "You'll also receive in-app notifications about your consultation",
                  "The consultation will be added to your calendar upon approval",
                ].map((note) => (
                  <li
                    key={note}
                    className="flex items-start gap-2 text-body-sm"
                  >
                    <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-info" />
                    {note}
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>

          {/* Adviser Info */}
          {adviser && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle>Adviser Info</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <p className="text-caption text-content-muted">Name</p>
                  <p className="text-label">{adviser.name}</p>
                </div>
                <div>
                  <p className="text-caption text-content-muted">Department</p>
                  <p className="text-label">{adviser.department}</p>
                </div>
                <div>
                  <p className="text-caption text-content-muted">
                    Availability
                  </p>
                  <Badge
                    variant={
                      adviser.availability === "High"
                        ? "success"
                        : adviser.availability === "Medium"
                          ? "warning"
                          : "destructive"
                    }
                  >
                    {adviser.availability}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-caption text-content-muted">{label}</p>
      <p className="text-label">{value}</p>
    </div>
  );
}
