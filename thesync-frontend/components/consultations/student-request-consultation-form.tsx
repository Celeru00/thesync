"use client";

import Link from "next/link";
import { useState } from "react";
import {
  ArrowLeft,
  CalendarDays,
  CheckCircle2,
  CircleCheckBig,
  Clock3,
  FileText,
  Info,
  UserRound,
  UsersRound,
  XCircle,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
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
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import {
  requestNotes,
  requestTimeSlots,
  studentAdvisers,
  type AdviserAvailability,
  type AdviserProfile,
  type ConsultationRequestType,
  type TimePeriod,
} from "@/lib/mock/student-consultations";
import { cn } from "@/lib/utils";

type SlotStatus = "available" | "busy";

const scheduleTypeOptions: Array<{
  value: ConsultationRequestType;
  label: string;
}> = [
  { value: "consultation", label: "Consultation" },
  { value: "defense", label: "Defense" },
];

const timePeriodOptions: Array<{ value: TimePeriod; label: string }> = [
  { value: "morning", label: "Morning" },
  { value: "afternoon", label: "Afternoon" },
  { value: "all-day", label: "All Day" },
];

const dateFormatter = new Intl.DateTimeFormat("en-US", {
  month: "long",
  day: "numeric",
  year: "numeric",
});

export function StudentRequestConsultationForm() {
  const [scheduleType, setScheduleType] = useState<ConsultationRequestType>();
  const [selectedAdviserId, setSelectedAdviserId] = useState("");
  const [selectedPanelistIds, setSelectedPanelistIds] = useState<string[]>([]);
  const [preferredDate, setPreferredDate] = useState("");
  const [timePeriod, setTimePeriod] = useState<TimePeriod>("all-day");
  const [selectedTimeSlot, setSelectedTimeSlot] = useState("");
  const [topic, setTopic] = useState("");
  const [agenda, setAgenda] = useState("");

  const selectedAdviser =
    studentAdvisers.find((adviser) => adviser.id === selectedAdviserId) ?? null;
  const selectedPanelists = studentAdvisers.filter((adviser) =>
    selectedPanelistIds.includes(adviser.id),
  );
  const visibleSlots = requestTimeSlots.filter((slot) => {
    if (timePeriod === "all-day") {
      return true;
    }

    return slot.period === timePeriod;
  });

  const participants = selectedAdviser
    ? [selectedAdviser, ...selectedPanelists]
    : [];
  const slotsWithStatus = visibleSlots.map((slot) => ({
    ...slot,
    status: getSlotStatus(slot.id, participants),
  }));
  const availableSlotCount = requestTimeSlots.filter(
    (slot) => getSlotStatus(slot.id, participants) === "available",
  ).length;
  const canShowSlots = Boolean(selectedAdviser && preferredDate);
  const canSubmit = Boolean(
    scheduleType &&
    selectedAdviser &&
    preferredDate &&
    selectedTimeSlot &&
    topic.trim(),
  );
  const selectedDateObject = preferredDate
    ? parseDateInput(preferredDate)
    : null;
  const selectedTimeLabel =
    requestTimeSlots.find((slot) => slot.id === selectedTimeSlot)?.label ?? "";
  const descriptionRemaining = 500 - agenda.length;

  function handleScheduleTypeChange(value: ConsultationRequestType) {
    setScheduleType(value);
    setSelectedTimeSlot("");

    if (value !== "defense") {
      setSelectedPanelistIds([]);
    }
  }

  function handleAdviserChange(value: string) {
    setSelectedAdviserId(value);
    setSelectedTimeSlot("");
    setSelectedPanelistIds((current) =>
      current.filter((item) => item !== value),
    );
  }

  function handlePanelistToggle(panelistId: string, checked: boolean) {
    setSelectedTimeSlot("");
    setSelectedPanelistIds((current) => {
      if (checked) {
        return [...current, panelistId];
      }

      return current.filter((item) => item !== panelistId);
    });
  }

  return (
    <section className="flex w-full flex-col gap-8">
      <header className="flex items-start gap-3">
        <Button
          asChild
          variant="ghost"
          size="icon-sm"
          className="mt-1 rounded-full"
        >
          <Link
            href="/student/consultations"
            aria-label="Back to consultations"
          >
            <ArrowLeft />
          </Link>
        </Button>

        <div className="space-y-1">
          <h1 className="text-heading">Request Consultation</h1>
          <p className="max-w-3xl text-[1.05rem] leading-8 text-content-muted">
            Fill in the details to schedule a consultation with your adviser
          </p>
        </div>
      </header>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_24rem]">
        <Card className="gap-0 rounded-[2rem] border-brand-subtle py-0 shadow-elevated">
          <CardHeader className="border-b border-surface px-6 py-6 sm:px-7">
            <h2 className="text-section-title">Consultation Details</h2>
            <p className="text-[1.05rem] leading-7 text-content-muted">
              Provide information about your consultation request
            </p>
          </CardHeader>

          <CardContent className="space-y-6 px-6 py-6 sm:px-7">
            <FormField icon={FileText} label="Consultation Type">
              <Select
                value={scheduleType ?? undefined}
                onValueChange={(value) =>
                  handleScheduleTypeChange(value as ConsultationRequestType)
                }
              >
                <SelectTrigger className="h-12 rounded-[1rem]">
                  <SelectValue placeholder="Select consultation type" />
                </SelectTrigger>
                <SelectContent>
                  {scheduleTypeOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FormField>

            <FormField icon={UserRound} label="Select Adviser">
              <Select
                value={selectedAdviserId || undefined}
                onValueChange={handleAdviserChange}
              >
                <SelectTrigger className="h-12 rounded-[1rem]">
                  <SelectValue placeholder="Choose your adviser" />
                </SelectTrigger>
                <SelectContent>
                  {studentAdvisers.map((adviser) => (
                    <SelectItem key={adviser.id} value={adviser.id}>
                      {adviser.name} ({adviser.departmentCode})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FormField>

            {scheduleType === "defense" ? (
              <FormField icon={UsersRound} label="Select Panelists (Optional)">
                <div className="rounded-[1rem] border border-surface bg-surface-card px-4 py-4 shadow-soft">
                  <div className="space-y-3">
                    {studentAdvisers
                      .filter((adviser) => adviser.id !== selectedAdviserId)
                      .map((panelist) => {
                        const checked = selectedPanelistIds.includes(
                          panelist.id,
                        );

                        return (
                          <label
                            key={panelist.id}
                            className="flex cursor-pointer items-start gap-3 rounded-[0.85rem] px-1 py-1.5 transition-colors hover:bg-surface-muted-soft"
                          >
                            <Checkbox
                              checked={checked}
                              onCheckedChange={(value) =>
                                handlePanelistToggle(
                                  panelist.id,
                                  Boolean(value),
                                )
                              }
                              className="mt-1"
                            />
                            <div className="min-w-0">
                              <div className="text-body font-medium text-content-strong">
                                {panelist.name}
                              </div>
                              <div className="text-body-sm text-content-muted">
                                {panelist.departmentCode}
                              </div>
                            </div>
                          </label>
                        );
                      })}
                  </div>
                  <p className="mt-4 text-body-sm text-content-muted">
                    {selectedPanelistIds.length} panelist
                    {selectedPanelistIds.length === 1 ? "" : "s"} selected
                  </p>
                </div>
              </FormField>
            ) : null}

            <FormField icon={CalendarDays} label="Preferred Date">
              <Input
                type="date"
                value={preferredDate}
                onChange={(event) => {
                  setPreferredDate(event.target.value);
                  setSelectedTimeSlot("");
                }}
                className="h-12 rounded-[1rem]"
              />
            </FormField>

            {canShowSlots ? (
              <div className="space-y-5">
                <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                  <div className="space-y-1">
                    <h3 className="text-subheading">Select Time</h3>
                    <p className="text-body text-content-muted">
                      {availableSlotCount} of {requestTimeSlots.length} slots
                      available on{" "}
                      {selectedDateObject
                        ? dateFormatter.format(selectedDateObject)
                        : preferredDate}
                    </p>
                  </div>

                  <div className="inline-flex self-start rounded-full bg-surface-muted p-1">
                    {timePeriodOptions.map((option) => {
                      const active = timePeriod === option.value;

                      return (
                        <button
                          key={option.value}
                          type="button"
                          onClick={() => setTimePeriod(option.value)}
                          className={cn(
                            "rounded-full px-4 py-2 text-[0.95rem] font-medium transition-colors",
                            active
                              ? "bg-brand text-brand-on shadow-soft"
                              : "text-content-strong hover:text-brand-strong",
                          )}
                        >
                          {option.label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="flex flex-col gap-2 text-body text-content-muted">
                  <div className="flex items-start gap-2">
                    <Clock3 className="mt-1 size-4 shrink-0" />
                    <span>Checking availability for:</span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {participants.map((participant) => (
                      <Badge key={participant.id} variant="outline">
                        {participant.name}
                      </Badge>
                    ))}
                  </div>
                </div>

                <div className="rounded-[1.5rem] border border-surface bg-surface-card px-4 py-4 shadow-soft">
                  <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                    {slotsWithStatus.map((slot) => {
                      const isSelected = selectedTimeSlot === slot.id;
                      const isAvailable = slot.status === "available";

                      return (
                        <button
                          key={slot.id}
                          type="button"
                          disabled={!isAvailable}
                          onClick={() => setSelectedTimeSlot(slot.id)}
                          className={cn(
                            "rounded-[1rem] border px-4 py-3 text-left transition-colors",
                            isAvailable
                              ? "border-surface bg-surface-card hover:border-brand-subtle"
                              : "border-surface bg-surface-muted-soft/50 text-content-muted/65",
                            isSelected &&
                              "border-primary bg-primary-tint/35 shadow-[0_0_0_1px_color-mix(in_srgb,var(--primary)_40%,transparent)]",
                          )}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <div
                                className={cn(
                                  "text-[1.05rem] font-medium",
                                  isAvailable
                                    ? "text-content-strong"
                                    : "text-content-muted/70",
                                  isSelected && "text-brand-strong",
                                )}
                              >
                                {slot.label}
                              </div>
                              <div
                                className={cn(
                                  "mt-2 text-body-sm",
                                  isAvailable
                                    ? "text-success"
                                    : "text-destructive",
                                )}
                              >
                                {isAvailable ? "Available" : "Busy"}
                              </div>
                            </div>

                            {isSelected ? (
                              <CircleCheckBig className="size-5 text-brand" />
                            ) : isAvailable ? (
                              <CheckCircle2 className="size-5 text-success" />
                            ) : (
                              <XCircle className="size-5 text-destructive" />
                            )}
                          </div>
                        </button>
                      );
                    })}
                  </div>

                  <Separator className="my-5" />
                  <div className="flex flex-wrap items-center justify-center gap-6 text-body-sm text-content-muted">
                    <LegendItem
                      icon={<CheckCircle2 className="size-4 text-success" />}
                      label="Available"
                    />
                    <LegendItem
                      icon={<XCircle className="size-4 text-destructive" />}
                      label="Busy"
                    />
                    <LegendItem
                      icon={
                        <span className="size-4 rounded-[0.3rem] border-2 border-brand" />
                      }
                      label="Selected"
                    />
                  </div>
                </div>

                {selectedTimeLabel ? (
                  <div className="flex items-start gap-3 rounded-[1.15rem] border border-success bg-success-soft px-4 py-4 text-content-strong">
                    <CircleCheckBig className="mt-1 size-5 shrink-0 text-success" />
                    <div>
                      <div className="text-card-title text-success">
                        {selectedTimeLabel}
                      </div>
                      <p className="text-body text-content">
                        is available for all participants
                      </p>
                    </div>
                  </div>
                ) : null}
              </div>
            ) : null}

            <FormField label="Topic / Title">
              <Input
                value={topic}
                onChange={(event) => setTopic(event.target.value)}
                placeholder="e.g., Chapter 1 Review, Methodology Discussion"
                className="h-12 rounded-[1rem]"
              />
            </FormField>

            <FormField label="Description / Agenda">
              <div className="space-y-2">
                <Textarea
                  value={agenda}
                  onChange={(event) =>
                    setAgenda(event.target.value.slice(0, 500))
                  }
                  placeholder="Provide details about what you'd like to discuss during this consultation..."
                  className="min-h-[8.5rem] rounded-[1rem]"
                />
                <div className="text-body-sm text-content-muted">
                  {agenda.length}/500 characters
                </div>
              </div>
            </FormField>

            <div className="flex flex-col gap-3 pt-2 sm:flex-row">
              <Button
                asChild
                variant="outline"
                className="h-12 flex-1 rounded-[1rem]"
              >
                <Link href="/student/consultations">Cancel</Link>
              </Button>
              <Button
                type="button"
                disabled={!canSubmit || descriptionRemaining < 0}
                className="h-12 flex-1 rounded-[1rem]"
              >
                Submit Request
              </Button>
            </div>
          </CardContent>
        </Card>

        <div className="space-y-6">
          <SidebarCard title="Request Summary">
            <SummaryItem
              label="Type"
              value={scheduleType ? capitalize(scheduleType) : "Not selected"}
            />
            <SummaryItem
              label="Adviser"
              value={selectedAdviser?.name ?? "Not selected"}
            />
            {scheduleType === "defense" ? (
              <SummaryItem
                label="Panelists"
                value={
                  selectedPanelists.length > 0
                    ? `${selectedPanelists.length} selected`
                    : "Not selected"
                }
              />
            ) : null}
            <SummaryItem
              label="Date & Time"
              value={
                selectedDateObject && selectedTimeLabel
                  ? `${dateFormatter.format(selectedDateObject)} at ${selectedTimeLabel}`
                  : "Not selected"
              }
            />
            <SummaryItem
              label="Topic"
              value={topic.trim() ? topic : "Not provided"}
            />
          </SidebarCard>

          <Card className="rounded-[1.75rem] border-card-info bg-card-info py-0 shadow-elevated">
            <CardHeader className="px-6 py-6">
              <div className="flex items-center gap-3">
                <Info className="size-5 text-brand-strong" />
                <h2 className="text-section-title">Important Notes</h2>
              </div>
            </CardHeader>
            <CardContent className="px-6 pb-6">
              <ul className="space-y-3 text-body text-brand-strong">
                {requestNotes.map((note) => (
                  <li key={note} className="flex gap-2">
                    <span className="pt-1">•</span>
                    <span>{note}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>

          <SidebarCard title="Adviser Info">
            {selectedAdviser ? (
              <div className="space-y-5">
                <SummaryItem label="Name" value={selectedAdviser.name} />
                <SummaryItem
                  label="Department"
                  value={selectedAdviser.departmentCode}
                />
                <div className="space-y-1">
                  <div className="text-body text-content-muted">
                    Availability
                  </div>
                  <Badge
                    variant={getAvailabilityVariant(
                      selectedAdviser.availability,
                    )}
                  >
                    {selectedAdviser.availability}
                  </Badge>
                </div>
                <SummaryItem label="Email" value={selectedAdviser.email} />
              </div>
            ) : (
              <p className="text-body text-content-muted">
                Select an adviser to view details
              </p>
            )}
          </SidebarCard>
        </div>
      </div>
    </section>
  );
}

function FormField({
  children,
  icon: Icon,
  label,
}: {
  children: React.ReactNode;
  icon?: typeof FileText;
  label: string;
}) {
  return (
    <div className="space-y-2.5">
      <Label className="gap-3 text-[1.05rem] font-medium text-content-strong">
        {Icon ? <Icon className="size-4 text-content-strong" /> : null}
        <span>{label}</span>
      </Label>
      {children}
    </div>
  );
}

function SidebarCard({
  children,
  title,
}: {
  children: React.ReactNode;
  title: string;
}) {
  return (
    <Card className="rounded-[1.75rem] border-brand-subtle py-0 shadow-elevated">
      <CardHeader className="px-6 py-6">
        <h2 className="text-section-title">{title}</h2>
      </CardHeader>
      <CardContent className="space-y-5 px-6 pb-6">{children}</CardContent>
    </Card>
  );
}

function SummaryItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="space-y-1">
      <div className="text-body text-content-muted">{label}</div>
      <div className="text-body font-medium text-content-strong">{value}</div>
    </div>
  );
}

function LegendItem({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <div className="flex items-center gap-2">
      {icon}
      <span>{label}</span>
    </div>
  );
}

function getSlotStatus(
  slotId: string,
  participants: AdviserProfile[],
): SlotStatus {
  if (participants.length === 0) {
    return "busy";
  }

  const available = participants.every((participant) =>
    participant.availableSlots.includes(slotId),
  );

  return available ? "available" : "busy";
}

function parseDateInput(value: string) {
  const [year, month, day] = value.split("-").map(Number);

  return new Date(year, month - 1, day);
}

function getAvailabilityVariant(availability: AdviserAvailability) {
  switch (availability) {
    case "High":
      return "success";
    case "Medium":
      return "warning";
    case "Limited":
      return "outline";
  }
}

function capitalize(value: string) {
  return value.charAt(0).toUpperCase() + value.slice(1);
}
