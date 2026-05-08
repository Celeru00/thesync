"use client";

import Link from "next/link";
import { useDeferredValue, useState } from "react";
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
import { SearchInput } from "@/components/data-display/search-input";
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
import { useCreateSchedule } from "@/hooks/useSchedules";
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

function isTimePeriodMatch(dateTime: string, period: TimePeriod) {
  if (period === "all-day") {
    return true;
  }

  const hour = new Date(dateTime).getHours();
  return period === "morning" ? hour < 12 : hour >= 12;
}

const slotTimeFormatter = new Intl.DateTimeFormat("en-US", {
  hour: "numeric",
  minute: "2-digit",
});

function formatTimeRange(start: string, end: string): string {
  return `${slotTimeFormatter.format(new Date(start))} – ${slotTimeFormatter.format(new Date(end))}`;
}

function isDefined<T>(value: T | null | undefined): value is T {
  return value != null;
}

function matchesAdviserSearch(
  adviser: {
    name: string;
    department: string;
    departmentCode: string;
    email: string;
  },
  searchTerm: string,
) {
  const normalizedSearch = searchTerm.trim().toLowerCase();
  if (!normalizedSearch) {
    return true;
  }

  return [
    adviser.name,
    adviser.department,
    adviser.departmentCode,
    adviser.email,
  ].some((value) => value.toLowerCase().includes(normalizedSearch));
}

export function StudentRequestConsultationForm() {
  const [scheduleType, setScheduleType] = useState<ConsultationRequestType>();
  const [selectedAdviserId, setSelectedAdviserId] = useState("");
  const [selectedPanelistIds, setSelectedPanelistIds] = useState<string[]>([]);
  const [adviserSearchTerm, setAdviserSearchTerm] = useState("");
  const [panelistSearchTerm, setPanelistSearchTerm] = useState("");
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
  const deferredAdviserSearchTerm = useDeferredValue(adviserSearchTerm);
  const deferredPanelistSearchTerm = useDeferredValue(panelistSearchTerm);
  const selectedAdviser =
    liveAdvisers.find((adviser) => adviser.id === selectedAdviserId) ?? null;
  const selectedPanelists = liveAdvisers.filter((adviser) =>
    selectedPanelistIds.includes(adviser.id),
  );
  const filteredAdvisers = liveAdvisers.filter((adviser) =>
    matchesAdviserSearch(adviser, deferredAdviserSearchTerm),
  );
  const filteredPanelists = liveAdvisers
    .filter((adviser) => adviser.id !== selectedAdviserId)
    .filter((adviser) =>
      matchesAdviserSearch(adviser, deferredPanelistSearchTerm),
    )
    .sort((left, right) => {
      const leftSelected = selectedPanelistIds.includes(left.id) ? 1 : 0;
      const rightSelected = selectedPanelistIds.includes(right.id) ? 1 : 0;

      if (leftSelected !== rightSelected) {
        return rightSelected - leftSelected;
      }

      return left.name.localeCompare(right.name);
    });
  const availabilityParticipantIds = (
    scheduleType === "defense"
      ? [selectedAdviserId, ...selectedPanelistIds]
      : [selectedAdviserId]
  ).filter(Boolean);
  const availabilityParticipants = (
    scheduleType === "defense"
      ? [selectedAdviser, ...selectedPanelists]
      : [selectedAdviser]
  ).filter(isDefined);
  const {
    data: freeSlots = [],
    isLoading: isLoadingSlots,
    error: slotsError,
  } = useFreeSlots(availabilityParticipantIds, preferredDate || undefined);
  const visibleTimeOptions = [...freeSlots]
    .filter((slot) => isTimePeriodMatch(slot.slot_start, timePeriod))
    .sort(
      (left, right) =>
        new Date(left.slot_start).getTime() -
        new Date(right.slot_start).getTime(),
    );

  const availableSlotCount = visibleTimeOptions.length;
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
  const isDefenseWithPanelists =
    scheduleType === "defense" && selectedPanelistIds.length > 0;

  function handleScheduleTypeChange(value: ConsultationRequestType) {
    setScheduleType(value);
    setRangeStart(null);
    setRangeEnd(null);
    setFieldErrors((current) => ({ ...current, scheduleType: undefined }));
    setSubmitError(null);

    if (value !== "defense") {
      setSelectedPanelistIds([]);
      setPanelistSearchTerm("");
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
              <div className="space-y-3 rounded-[1rem] border border-surface bg-surface-card p-4 shadow-soft">
                <SearchInput
                  value={adviserSearchTerm}
                  onChange={(event) => setAdviserSearchTerm(event.target.value)}
                  placeholder="Search advisers by name, department, or email"
                  className="h-11 rounded-[0.9rem]"
                />

                {selectedAdviser ? (
                  <div className="rounded-[1rem] border border-brand-subtle bg-primary-tint/15 px-4 py-3">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="text-body font-medium text-brand-strong">
                          {selectedAdviser.name}
                        </div>
                        <div className="mt-1 text-body-sm text-content-muted">
                          {selectedAdviser.department}
                        </div>
                      </div>
                      <Badge className="shrink-0">Selected adviser</Badge>
                    </div>
                  </div>
                ) : null}

                <div className="max-h-72 space-y-3 overflow-y-auto pr-1">
                  {isLoadingAdvisers ? (
                    <p className="rounded-[0.9rem] border border-dashed border-surface px-4 py-6 text-center text-body-sm text-content-muted">
                      Loading advisers...
                    </p>
                  ) : filteredAdvisers.length > 0 ? (
                    filteredAdvisers.map((adviser) => {
                      const isSelected = adviser.id === selectedAdviserId;

                      return (
                        <button
                          key={adviser.id}
                          type="button"
                          onClick={() => handleAdviserChange(adviser.id)}
                          className={cn(
                            "w-full rounded-[1rem] border px-4 py-3 text-left transition-colors",
                            isSelected
                              ? "border-brand bg-primary-tint/20 shadow-[0_0_0_1px_color-mix(in_srgb,var(--primary)_35%,transparent)]"
                              : "border-surface bg-white hover:border-brand-subtle hover:bg-surface-muted-soft",
                          )}
                        >
                          <div className="flex flex-wrap items-start justify-between gap-3">
                            <div className="min-w-0">
                              <div className="text-body font-medium text-content-strong">
                                {adviser.name}
                              </div>
                              <div className="mt-1 text-body-sm text-content-muted">
                                {adviser.department}
                              </div>
                            </div>
                            <Badge
                              variant={isSelected ? "default" : "outline"}
                              className="shrink-0"
                            >
                              {isSelected ? "Selected" : adviser.departmentCode}
                            </Badge>
                          </div>
                          <div className="mt-3 flex flex-wrap gap-2 text-body-sm text-content-muted">
                            <span>{adviser.email}</span>
                            <span>•</span>
                            <span>{adviser.availability} availability</span>
                          </div>
                        </button>
                      );
                    })
                  ) : (
                    <p className="rounded-[0.9rem] border border-dashed border-surface px-4 py-6 text-center text-body-sm text-content-muted">
                      No advisers match your search.
                    </p>
                  )}
                </div>
              </div>
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
                  <div className="space-y-4">
                    <SearchInput
                      value={panelistSearchTerm}
                      onChange={(event) =>
                        setPanelistSearchTerm(event.target.value)
                      }
                      placeholder="Search panelists by name, department, or email"
                      className="h-11 rounded-[0.9rem]"
                    />

                    {selectedPanelists.length > 0 ? (
                      <div className="flex flex-wrap gap-2">
                        {selectedPanelists.map((panelist) => (
                          <button
                            key={panelist.id}
                            type="button"
                            onClick={() =>
                              handlePanelistToggle(panelist.id, false)
                            }
                            className="inline-flex items-center gap-2 rounded-full bg-primary-tint/20 px-3 py-1.5 text-body-sm font-medium text-brand-strong transition-colors hover:bg-primary-tint/30"
                          >
                            <span>{panelist.name}</span>
                            <span aria-hidden="true">×</span>
                          </button>
                        ))}
                      </div>
                    ) : (
                      <p className="text-body-sm text-content-muted">
                        Select one or more panelists. The defense time options
                        below will only show shared availability across everyone
                        you choose.
                      </p>
                    )}

                    <div className="max-h-80 space-y-3 overflow-y-auto pr-1">
                      {filteredPanelists.length > 0 ? (
                        filteredPanelists.map((panelist) => {
                          const checked = selectedPanelistIds.includes(
                            panelist.id,
                          );

                          return (
                            <label
                              key={panelist.id}
                              className={cn(
                                "flex cursor-pointer items-start gap-3 rounded-[1rem] border px-4 py-3 transition-colors",
                                checked
                                  ? "border-brand bg-primary-tint/15"
                                  : "border-surface bg-white hover:border-brand-subtle hover:bg-surface-muted-soft",
                              )}
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
                              <div className="min-w-0 flex-1">
                                <div className="flex flex-wrap items-start justify-between gap-3">
                                  <div className="min-w-0">
                                    <div className="text-body font-medium text-content-strong">
                                      {panelist.name}
                                    </div>
                                    <div className="mt-1 text-body-sm text-content-muted">
                                      {panelist.department}
                                    </div>
                                  </div>
                                  <Badge
                                    variant={checked ? "default" : "outline"}
                                    className="shrink-0"
                                  >
                                    {checked
                                      ? "Selected"
                                      : panelist.departmentCode}
                                  </Badge>
                                </div>
                                <div className="mt-3 flex flex-wrap gap-2 text-body-sm text-content-muted">
                                  <span>{panelist.email}</span>
                                  <span>•</span>
                                  <span>
                                    {panelist.availability} availability
                                  </span>
                                </div>
                              </div>
                            </label>
                          );
                        })
                      ) : (
                        <p className="rounded-[0.9rem] border border-dashed border-surface px-4 py-6 text-center text-body-sm text-content-muted">
                          No panelists match your search.
                        </p>
                      )}
                    </div>
                  </div>
                  <p className="mt-4 text-body-sm text-content-muted">
                    {selectedPanelistIds.length} panelist
                    {selectedPanelistIds.length === 1 ? "" : "s"} selected
                    {panelistSearchTerm.trim()
                      ? ` • ${filteredPanelists.length} match search`
                      : ""}
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
                        : `${availableSlotCount} ${availableSlotCount === 1 ? (isDefenseWithPanelists ? "common slot" : "slot") : isDefenseWithPanelists ? "common slots" : "slots"} available on ${selectedDateObject ? dateFormatter.format(selectedDateObject) : preferredDate}`}
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

                {availabilityParticipants.length > 0 ? (
                  <div className="flex flex-col gap-2 text-body text-content-muted">
                    <div className="flex items-start gap-2">
                      <Clock3 className="mt-1 size-4 shrink-0" />
                      <span>
                        {isDefenseWithPanelists
                          ? "Checking common availability for:"
                          : "Checking availability for:"}
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {availabilityParticipants.map((participant) => (
                        <Badge key={participant.id} variant="outline">
                          {participant.name}
                        </Badge>
                      ))}
                    </div>
                  </div>
                ) : null}

                <div className="rounded-[1.5rem] border border-surface bg-surface-card px-4 py-4 shadow-soft">
                  {isLoadingSlots ? (
                    <p className="py-8 text-center text-body-sm text-content-muted">
                      Checking availability...
                    </p>
                  ) : slotsError ? (
                    <p className="py-8 text-center text-body-sm text-destructive">
                      Unable to load adviser availability right now. Please try
                      again.
                    </p>
                  ) : visibleTimeOptions.length > 0 ? (
                    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                      {visibleTimeOptions.map((option) => {
                        const isHighlighted =
                          rangeStart === option.slot_start &&
                          rangeEnd === option.slot_end;

                        return (
                          <button
                            key={option.id}
                            type="button"
                            onClick={() => {
                              if (isHighlighted) {
                                setRangeStart(null);
                                setRangeEnd(null);
                              } else {
                                setRangeStart(option.slot_start);
                                setRangeEnd(option.slot_end);
                              }

                              setFieldErrors((current) => ({
                                ...current,
                                selectedTimeSlot: undefined,
                              }));
                              setSubmitError(null);
                            }}
                            className={cn(
                              "rounded-[1rem] border px-4 py-3 text-left transition-colors",
                              !isHighlighted &&
                                "border-surface bg-emerald-50 text-emerald-900 hover:border-emerald-300 hover:bg-emerald-100",
                              isHighlighted &&
                                "border-primary bg-primary-tint/35 shadow-[0_0_0_1px_color-mix(in_srgb,var(--primary)_40%,transparent)]",
                            )}
                          >
                            <div className="flex items-start justify-between gap-2">
                              <div>
                                <div
                                  className={cn(
                                    "text-[1.05rem] font-medium",
                                    isHighlighted
                                      ? "text-brand-strong"
                                      : "text-content-strong",
                                  )}
                                >
                                  {formatTimeRange(
                                    option.slot_start,
                                    option.slot_end,
                                  )}
                                </div>
                                <div className="mt-2 text-body-sm">
                                  {isHighlighted ? "Selected" : "Available"}
                                </div>
                              </div>
                              {isHighlighted ? (
                                <CircleCheckBig className="size-5 text-brand" />
                              ) : (
                                <CheckCircle2 className="size-5 text-success" />
                              )}
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  ) : (
                    <p className="py-8 text-center text-body-sm text-content-muted">
                      {isDefenseWithPanelists
                        ? "No shared slots for all selected advisers on this date. Try another date or adjust your panelists."
                        : "No available slots on this date. Try another date or a different adviser."}
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
                            <span className="size-4 rounded-[0.3rem] border-2 border-brand" />
                          }
                          label="Selected"
                        />
                      </div>
                      <p className="mt-4 text-center text-body-sm text-content-muted">
                        Slots already exclude recurring blocked times, approved
                        consultations, and Google Calendar conflicts. If an
                        adviser has no recurring rule for that weekday, standard
                        weekday consultation hours are used instead. Defense
                        slots must also be shared across every selected adviser.
                      </p>
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
