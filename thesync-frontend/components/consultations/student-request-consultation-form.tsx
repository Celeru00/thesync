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
  LoaderCircle,
  UserRound,
  UsersRound,
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
import { useAdvisers } from "@/hooks/useAdvisers";
import { useFreeSlots } from "@/hooks/useAvailability";
import { useCalendarOverlayEvents } from "@/hooks/useCalendarOverlay";
import { useCreateSchedule } from "@/hooks/useSchedules";
import type { AvailabilitySlot } from "@/lib/api";
import {
  parseConsultationRequestError,
  scheduleTypeIdByValue,
  type ConsultationRequestFieldName,
} from "@/lib/consultation-request";
import {
  requestNotes,
  type AdviserAvailability,
  type ConsultationRequestType,
  type TimePeriod,
} from "@/lib/mock/student-consultations";
import { cn } from "@/lib/utils";

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

function getDateRangeIsoStrings(dateValue: string) {
  const start = new Date(`${dateValue}T00:00:00`);
  const end = new Date(start);
  end.setHours(23, 59, 59, 999);

  return { timeMin: start.toISOString(), timeMax: end.toISOString() };
}

function isTimePeriodMatch(dateTime: string, period: TimePeriod) {
  if (period === "all-day") {
    return true;
  }

  const hour = new Date(dateTime).getHours();
  return period === "morning" ? hour < 12 : hour >= 12;
}

function isSameDate(dateTime: string, dateKey: string) {
  const date = new Date(dateTime);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}` === dateKey;
}

function isDateTimeRangeOverlap(
  startA: string,
  endA: string,
  startB: string | null,
  endB: string | null,
) {
  if (!startB || !endB) {
    return false;
  }

  const aStart = new Date(startA).getTime();
  const aEnd = new Date(endA).getTime();
  const bStart = new Date(startB).getTime();
  const bEnd = new Date(endB).getTime();

  return aStart < bEnd && aEnd > bStart;
}

const slotTimeFormatter = new Intl.DateTimeFormat("en-US", {
  hour: "numeric",
  minute: "2-digit",
});

function formatTimeRange(start: string, end: string): string {
  return `${slotTimeFormatter.format(new Date(start))} – ${slotTimeFormatter.format(new Date(end))}`;
}

const ALL_SLOT_HOURS: Array<[number, number]> = [
  [8, 0],
  [8, 30],
  [9, 0],
  [9, 30],
  [10, 0],
  [10, 30],
  [11, 0],
  [11, 30],
  [12, 0],
  [12, 30],
  [13, 0],
  [13, 30],
  [14, 0],
  [14, 30],
  [15, 0],
  [15, 30],
  [16, 0],
  [16, 30],
];

type StandardSlotStatus =
  | "available"
  | "blocked-adviser"
  | "blocked-calendar"
  | "unavailable";

function generateStandardSlots(dateValue: string) {
  return ALL_SLOT_HOURS.map(([hour, minute]) => {
    const start = new Date(
      `${dateValue}T${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}:00`,
    );
    const end = new Date(start.getTime() + 30 * 60_000);
    return { start: start.toISOString(), end: end.toISOString() };
  });
}

function getStandardSlotStatus(
  slotStart: string,
  slotEnd: string,
  adviserSlots: AvailabilitySlot[],
  calendarEvents: Array<{ starts_at: string | null; ends_at: string | null }>,
): StandardSlotStatus {
  if (
    adviserSlots.some(
      (s) =>
        s.is_blocked &&
        isDateTimeRangeOverlap(slotStart, slotEnd, s.slot_start, s.slot_end),
    )
  ) {
    return "blocked-adviser";
  }
  if (
    calendarEvents.some((e) =>
      isDateTimeRangeOverlap(slotStart, slotEnd, e.starts_at, e.ends_at),
    )
  ) {
    return "blocked-calendar";
  }
  if (
    adviserSlots.some(
      (s) =>
        !s.is_blocked &&
        isDateTimeRangeOverlap(slotStart, slotEnd, s.slot_start, s.slot_end),
    )
  ) {
    return "available";
  }
  return "unavailable";
}

function getSlotStatusLabel(status: StandardSlotStatus): string {
  if (status === "available") return "Available";
  if (status === "blocked-adviser") return "Blocked";
  if (status === "blocked-calendar") return "Busy (Calendar)";
  return "Not available";
}

export function StudentRequestConsultationForm() {
  const [scheduleType, setScheduleType] = useState<ConsultationRequestType>();
  const [selectedAdviserId, setSelectedAdviserId] = useState("");
  const [selectedPanelistIds, setSelectedPanelistIds] = useState<string[]>([]);
  const [preferredDate, setPreferredDate] = useState("");
  const [timePeriod, setTimePeriod] = useState<TimePeriod>("all-day");
  const [rangeStart, setRangeStart] = useState<string | null>(null);
  const [rangeEnd, setRangeEnd] = useState<string | null>(null);
  const [topic, setTopic] = useState("");
  const [agenda, setAgenda] = useState("");
  const [fieldErrors, setFieldErrors] = useState<
    Partial<Record<ConsultationRequestFieldName, string>>
  >({});
  const [submitError, setSubmitError] = useState<string | null>(null);
  const createScheduleMutation = useCreateSchedule();
  const {
    data: liveAdvisers = [],
    error: advisersError,
    isLoading: isLoadingAdvisers,
  } = useAdvisers();
  const selectedAdviser =
    liveAdvisers.find((adviser) => adviser.id === selectedAdviserId) ?? null;
  const selectedPanelists = liveAdvisers.filter((adviser) =>
    selectedPanelistIds.includes(adviser.id),
  );
  const { data: freeSlots = [], isLoading: isLoadingSlots } = useFreeSlots(
    selectedAdviserId || undefined,
    preferredDate || undefined,
  );

  const {
    data: calendarBusyEvents = [],
    isLoading: isLoadingCalendarEvents,
    error: calendarEventsError,
  } = useCalendarOverlayEvents(
    selectedAdviserId ? [selectedAdviserId] : [],
    preferredDate ? getDateRangeIsoStrings(preferredDate) : undefined,
    Boolean(selectedAdviserId && preferredDate),
  );

  const freeSlotsByDate = preferredDate
    ? freeSlots.filter((slot) => isSameDate(slot.slot_start, preferredDate))
    : freeSlots;

  const standardSlotsForDate = preferredDate
    ? generateStandardSlots(preferredDate)
    : [];

  const slotsWithStatus = standardSlotsForDate.map((slot) => ({
    ...slot,
    status: getStandardSlotStatus(
      slot.start,
      slot.end,
      freeSlotsByDate,
      calendarBusyEvents,
    ),
  }));

  const visibleTimeOptions = slotsWithStatus.filter((slot) =>
    isTimePeriodMatch(slot.start, timePeriod),
  );

  const availableSlotCount = visibleTimeOptions.filter(
    (slot) => slot.status === "available",
  ).length;
  const canShowSlots = Boolean(selectedAdviser && preferredDate);
  const canSubmit = Boolean(
    scheduleType &&
    selectedAdviser &&
    preferredDate &&
    rangeStart &&
    rangeEnd &&
    topic.trim(),
  );
  const selectedDateObject = preferredDate
    ? parseDateInput(preferredDate)
    : null;
  const selectedRangeLabel =
    rangeStart && rangeEnd
      ? formatTimeRange(rangeStart, rangeEnd)
      : rangeStart
        ? `${slotTimeFormatter.format(new Date(rangeStart))} – select end time`
        : "";
  const descriptionRemaining = 500 - agenda.length;

  function handleScheduleTypeChange(value: ConsultationRequestType) {
    setScheduleType(value);
    setRangeStart(null);
    setRangeEnd(null);
    setFieldErrors((current) => ({ ...current, scheduleType: undefined }));
    setSubmitError(null);

    if (value !== "defense") {
      setSelectedPanelistIds([]);
    }
  }

  function handleAdviserChange(value: string) {
    setSelectedAdviserId(value);
    setRangeStart(null);
    setRangeEnd(null);
    setFieldErrors((current) => ({ ...current, selectedAdviserId: undefined }));
    setSubmitError(null);
    setSelectedPanelistIds((current) =>
      current.filter((item) => item !== value),
    );
  }

  function handlePanelistToggle(panelistId: string, checked: boolean) {
    setRangeStart(null);
    setRangeEnd(null);
    setSelectedPanelistIds((current) => {
      if (checked) {
        return [...current, panelistId];
      }

      return current.filter((item) => item !== panelistId);
    });
  }

  async function handleSubmit() {
    const nextFieldErrors: Partial<
      Record<ConsultationRequestFieldName, string>
    > = {};

    if (!scheduleType) {
      nextFieldErrors.scheduleType = "Please select a consultation type.";
    }

    if (!selectedAdviserId) {
      nextFieldErrors.selectedAdviserId = "Please choose an adviser.";
    }

    if (!preferredDate) {
      nextFieldErrors.preferredDate = "Please choose a preferred date.";
    }

    if (!rangeStart || !rangeEnd) {
      nextFieldErrors.selectedTimeSlot =
        "Please choose an available time range.";
    }

    if (!topic.trim()) {
      nextFieldErrors.topic = "Please enter a topic.";
    }

    if (Object.keys(nextFieldErrors).length > 0) {
      setFieldErrors(nextFieldErrors);
      setSubmitError(null);
      return;
    }

    if (!scheduleType) {
      return;
    }

    const scheduledAt = rangeStart!;

    setFieldErrors({});
    setSubmitError(null);

    try {
      await createScheduleMutation.mutateAsync({
        adviser_id: selectedAdviserId,
        type_id: scheduleTypeIdByValue[scheduleType],
        topic: topic.trim(),
        scheduled_at: scheduledAt,
      });

      resetForm();
    } catch (error) {
      const parsedError = parseConsultationRequestError(error);

      if (parsedError.submitError) {
        setSubmitError(parsedError.submitError);
      }

      if (parsedError.fieldErrors) {
        setFieldErrors(parsedError.fieldErrors);
      }
    }
  }

  function resetForm() {
    setScheduleType(undefined);
    setSelectedAdviserId("");
    setSelectedPanelistIds([]);
    setPreferredDate("");
    setTimePeriod("all-day");
    setRangeStart(null);
    setRangeEnd(null);
    setTopic("");
    setAgenda("");
    setFieldErrors({});
    setSubmitError(null);
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
              <FieldErrorMessage message={fieldErrors.scheduleType} />
            </FormField>

            <FormField icon={UserRound} label="Select Adviser">
              <Select
                value={selectedAdviserId || undefined}
                onValueChange={handleAdviserChange}
              >
                <SelectTrigger className="h-12 rounded-[1rem]">
                  <SelectValue
                    placeholder={
                      isLoadingAdvisers
                        ? "Loading advisers..."
                        : liveAdvisers.length > 0
                          ? "Choose your adviser"
                          : "No live advisers available"
                    }
                  />
                </SelectTrigger>
                <SelectContent>
                  {liveAdvisers.map((adviser) => (
                    <SelectItem key={adviser.id} value={adviser.id}>
                      {adviser.name} ({adviser.departmentCode})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {advisersError ? (
                <FieldErrorMessage message="Unable to load advisers right now." />
              ) : null}
              {!isLoadingAdvisers && liveAdvisers.length === 0 ? (
                <FieldErrorMessage message="No advisers are available right now." />
              ) : null}
              <FieldErrorMessage message={fieldErrors.selectedAdviserId} />
            </FormField>

            {scheduleType === "defense" ? (
              <FormField icon={UsersRound} label="Select Panelists (Optional)">
                <div className="rounded-[1rem] border border-surface bg-surface-card px-4 py-4 shadow-soft">
                  <div className="space-y-3">
                    {liveAdvisers
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
                  setRangeStart(null);
                  setRangeEnd(null);
                  setFieldErrors((current) => ({
                    ...current,
                    preferredDate: undefined,
                    selectedTimeSlot: undefined,
                  }));
                  setSubmitError(null);
                }}
                className="h-12 rounded-[1rem]"
              />
              <FieldErrorMessage message={fieldErrors.preferredDate} />
            </FormField>

            {canShowSlots ? (
              <div className="space-y-5">
                <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                  <div className="space-y-1">
                    <h3 className="text-subheading">Select Time</h3>
                    <p className="text-body text-content-muted">
                      {isLoadingSlots
                        ? "Checking availability..."
                        : `${availableSlotCount} ${availableSlotCount === 1 ? "slot" : "slots"} available on ${selectedDateObject ? dateFormatter.format(selectedDateObject) : preferredDate}`}
                    </p>
                  </div>

                  <div className="inline-flex self-start rounded-full bg-surface-muted p-1">
                    {timePeriodOptions.map((option) => {
                      const active = timePeriod === option.value;

                      return (
                        <button
                          key={option.value}
                          type="button"
                          onClick={() => {
                            setTimePeriod(option.value);
                            setRangeStart(null);
                            setRangeEnd(null);
                          }}
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

                {selectedAdviser ? (
                  <div className="flex flex-col gap-2 text-body text-content-muted">
                    <div className="flex items-start gap-2">
                      <Clock3 className="mt-1 size-4 shrink-0" />
                      <span>Checking availability for:</span>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <Badge variant="outline">{selectedAdviser.name}</Badge>
                    </div>
                  </div>
                ) : null}

                <div className="rounded-[1.5rem] border border-surface bg-surface-card px-4 py-4 shadow-soft">
                  {isLoadingSlots || isLoadingCalendarEvents ? (
                    <p className="py-8 text-center text-body-sm text-content-muted">
                      Checking availability...
                    </p>
                  ) : visibleTimeOptions.length > 0 ? (
                    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                      {visibleTimeOptions.map((option) => {
                        const isAvailable = option.status === "available";
                        const isBlocked =
                          option.status === "blocked-adviser" ||
                          option.status === "blocked-calendar";
                        const isInRange =
                          rangeStart !== null &&
                          rangeEnd !== null &&
                          option.start >= rangeStart &&
                          option.end <= rangeEnd;
                        const isPendingStart =
                          rangeStart !== null &&
                          rangeEnd === null &&
                          option.start === rangeStart;
                        const isHighlighted = isInRange || isPendingStart;

                        return (
                          <button
                            key={option.start}
                            type="button"
                            disabled={!isAvailable}
                            onClick={() => {
                              if (!isAvailable) return;

                              if (!rangeStart || rangeEnd !== null) {
                                setRangeStart(option.start);
                                setRangeEnd(null);
                              } else if (option.start < rangeStart) {
                                setRangeStart(option.start);
                                setRangeEnd(null);
                              } else if (option.start === rangeStart) {
                                setRangeStart(null);
                                setRangeEnd(null);
                              } else {
                                const allIntermediateAvailable =
                                  visibleTimeOptions
                                    .filter(
                                      (s) =>
                                        s.start > rangeStart &&
                                        s.start < option.start,
                                    )
                                    .every((s) => s.status === "available");

                                if (allIntermediateAvailable) {
                                  setRangeEnd(option.end);
                                } else {
                                  setRangeStart(option.start);
                                  setRangeEnd(null);
                                }
                              }

                              setFieldErrors((current) => ({
                                ...current,
                                selectedTimeSlot: undefined,
                              }));
                              setSubmitError(null);
                            }}
                            className={cn(
                              "rounded-[1rem] border px-4 py-3 text-left transition-colors",
                              isAvailable &&
                                !isHighlighted &&
                                "border-surface bg-emerald-50 text-emerald-900 hover:border-emerald-300 hover:bg-emerald-100",
                              isAvailable &&
                                isHighlighted &&
                                "border-primary bg-primary-tint/35 shadow-[0_0_0_1px_color-mix(in_srgb,var(--primary)_40%,transparent)]",
                              isBlocked &&
                                "border-destructive bg-destructive/10 text-destructive/90 cursor-not-allowed",
                              option.status === "unavailable" &&
                                "cursor-not-allowed border-surface bg-surface-muted/50 text-content-muted opacity-60",
                            )}
                          >
                            <div className="flex items-start justify-between gap-2">
                              <div>
                                <div
                                  className={cn(
                                    "text-[1.05rem] font-medium",
                                    isHighlighted
                                      ? "text-brand-strong"
                                      : isAvailable
                                        ? "text-content-strong"
                                        : isBlocked
                                          ? "text-destructive-foreground"
                                          : "text-content-muted",
                                  )}
                                >
                                  {formatTimeRange(option.start, option.end)}
                                </div>
                                <div className="mt-2 text-body-sm">
                                  {getSlotStatusLabel(option.status)}
                                </div>
                              </div>
                              {isHighlighted ? (
                                <CircleCheckBig className="size-5 text-brand" />
                              ) : isAvailable ? (
                                <CheckCircle2 className="size-5 text-success" />
                              ) : null}
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  ) : (
                    <p className="py-8 text-center text-body-sm text-content-muted">
                      No available slots on this date. Try another date or a
                      different adviser.
                    </p>
                  )}

                  {visibleTimeOptions.length > 0 ? (
                    <>
                      <Separator className="my-5" />
                      <div className="flex flex-wrap items-center justify-center gap-6 text-body-sm text-content-muted">
                        <LegendItem
                          icon={
                            <CheckCircle2 className="size-4 text-success" />
                          }
                          label="Available"
                        />
                        <LegendItem
                          icon={
                            <span className="inline-flex h-4 w-4 rounded-full bg-destructive" />
                          }
                          label="Blocked / Busy"
                        />
                        <LegendItem
                          icon={
                            <span className="size-4 rounded-[0.3rem] border-2 border-brand" />
                          }
                          label="Selected"
                        />
                      </div>
                    </>
                  ) : null}
                </div>

                {selectedRangeLabel ? (
                  <div className="flex items-start gap-3 rounded-[1.15rem] border border-success bg-success-soft px-4 py-4 text-content-strong">
                    <CircleCheckBig className="mt-1 size-5 shrink-0 text-success" />
                    <div>
                      <div className="text-card-title text-success">
                        {selectedRangeLabel}
                      </div>
                      <p className="text-body text-content">
                        {rangeEnd ? "selected" : "— select an end time"}
                      </p>
                    </div>
                  </div>
                ) : null}
                {calendarEventsError ? (
                  <div className="rounded-[1rem] border border-destructive/25 bg-destructive/10 px-4 py-3 text-body text-destructive">
                    Unable to load adviser calendar busy times. Availability is
                    shown from adviser schedule only.
                  </div>
                ) : null}

                <FieldErrorMessage message={fieldErrors.selectedTimeSlot} />
              </div>
            ) : null}

            <FormField label="Topic / Title">
              <Input
                value={topic}
                onChange={(event) => {
                  setTopic(event.target.value);
                  setFieldErrors((current) => ({
                    ...current,
                    topic: undefined,
                  }));
                  setSubmitError(null);
                }}
                placeholder="e.g., Chapter 1 Review, Methodology Discussion"
                className="h-12 rounded-[1rem]"
              />
              <FieldErrorMessage message={fieldErrors.topic} />
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

            {submitError ? (
              <div className="rounded-[1rem] border border-destructive/25 bg-destructive/10 px-4 py-3 text-body text-destructive">
                {submitError}
              </div>
            ) : null}

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
                disabled={
                  !canSubmit ||
                  descriptionRemaining < 0 ||
                  createScheduleMutation.isPending
                }
                onClick={handleSubmit}
                className="h-12 flex-1 rounded-[1rem]"
              >
                {createScheduleMutation.isPending ? (
                  <>
                    <LoaderCircle className="animate-spin" />
                    Submitting...
                  </>
                ) : (
                  "Submit Request"
                )}
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
                selectedDateObject && rangeStart && rangeEnd
                  ? `${dateFormatter.format(selectedDateObject)}, ${selectedRangeLabel}`
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

function FieldErrorMessage({ message }: { message?: string }) {
  if (!message) {
    return null;
  }

  return <p className="text-body-sm text-destructive">{message}</p>;
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
