"use client";

import { useEffect, useMemo, useState } from "react";
import { CalendarDays, Clock3, LoaderCircle, Plus, Trash2 } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import type { AvailabilityRule } from "@/lib/api";
import {
  createSlot,
  deleteSlot,
  listMySlots,
  toggleSlotBlocked,
} from "@/lib/api";
import { cn } from "@/lib/utils";

type CreateFormState = {
  dayOfWeek: string;
  start: string;
  end: string;
  isBlocked: boolean;
};

const weekdayOptions = [
  { value: 0, label: "Monday" },
  { value: 1, label: "Tuesday" },
  { value: 2, label: "Wednesday" },
  { value: 3, label: "Thursday" },
  { value: 4, label: "Friday" },
] as const;
const weekdayLabelByValue = new Map<number, string>(
  weekdayOptions.map((option) => [option.value, option.label]),
);

const initialCreateForm: CreateFormState = {
  dayOfWeek: "0",
  start: "09:00",
  end: "10:00",
  isBlocked: false,
};

function getErrorMessage(error: unknown) {
  if (
    error &&
    typeof error === "object" &&
    "response" in error &&
    error.response &&
    typeof error.response === "object" &&
    "data" in error.response
  ) {
    const data = error.response.data as {
      detail?: string | { message?: string };
      message?: string;
    };

    if (typeof data.detail === "string") {
      return data.detail;
    }

    if (data.detail?.message) {
      return data.detail.message;
    }

    if (data.message) {
      return data.message;
    }
  }

  if (error instanceof Error) {
    return error.message;
  }

  return "Something went wrong. Please try again.";
}

function normalizeTimeValue(value: string) {
  return value.slice(0, 5);
}

function getMinutes(timeValue: string) {
  const [hours, minutes] = normalizeTimeValue(timeValue).split(":").map(Number);
  return hours * 60 + minutes;
}

function isThirtyMinuteAligned(timeValue: string) {
  return getMinutes(timeValue) % 30 === 0;
}

function getDurationMinutes(start: string, end: string) {
  return Math.max(getMinutes(end) - getMinutes(start), 0);
}

function getRuleDurationMinutes(rule: AvailabilityRule) {
  return getDurationMinutes(rule.start_time, rule.end_time);
}

function formatTimeValue(value: string) {
  const [hours, minutes] = normalizeTimeValue(value).split(":").map(Number);
  return new Intl.DateTimeFormat("en-US", {
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(2026, 0, 5, hours, minutes, 0, 0));
}

function formatTimeRange(start: string, end: string) {
  return `${formatTimeValue(start)} - ${formatTimeValue(end)}`;
}

function formatDuration(minutes: number) {
  if (minutes === 0) {
    return "Invalid time range";
  }

  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;

  if (hours === 0) {
    return `${remainingMinutes} min`;
  }

  if (remainingMinutes === 0) {
    return `${hours} hr${hours > 1 ? "s" : ""}`;
  }

  return `${hours} hr ${remainingMinutes} min`;
}

function sortRules(rules: AvailabilityRule[]) {
  return [...rules].sort((left, right) => {
    if (left.day_of_week !== right.day_of_week) {
      return left.day_of_week - right.day_of_week;
    }

    return getMinutes(left.start_time) - getMinutes(right.start_time);
  });
}

function isWeekdayRule(rule: AvailabilityRule) {
  return weekdayLabelByValue.has(rule.day_of_week);
}

function getWeekdayLabel(dayOfWeek: number) {
  return weekdayLabelByValue.get(dayOfWeek) ?? "Weekday";
}

function getCreateValidationMessage(form: CreateFormState) {
  if (!isThirtyMinuteAligned(form.start) || !isThirtyMinuteAligned(form.end)) {
    return "Times must use 30-minute increments.";
  }

  const durationMinutes = getDurationMinutes(form.start, form.end);
  if (durationMinutes === 0) {
    return "End time must be later than start time.";
  }

  if (!form.isBlocked && durationMinutes < 60) {
    return "Open availability must be at least 1 hour long.";
  }

  return null;
}

export default function AdviserAvailabilityPage() {
  const [rules, setRules] = useState<AvailabilityRule[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [createError, setCreateError] = useState<string | null>(null);
  const [createForm, setCreateForm] =
    useState<CreateFormState>(initialCreateForm);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [pendingToggleIds, setPendingToggleIds] = useState<Set<string>>(
    () => new Set(),
  );
  const [pendingDeleteIds, setPendingDeleteIds] = useState<Set<string>>(
    () => new Set(),
  );

  useEffect(() => {
    let isMounted = true;

    async function loadRules() {
      setIsLoading(true);
      setLoadError(null);

      try {
        const nextRules = await listMySlots();
        if (isMounted) {
          setRules(sortRules(nextRules.filter(isWeekdayRule)));
        }
      } catch (error) {
        if (isMounted) {
          setLoadError(getErrorMessage(error));
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    loadRules();

    return () => {
      isMounted = false;
    };
  }, []);

  const rulesByDay = useMemo(
    () =>
      weekdayOptions.map(({ label, value }) => {
        const dayRules = rules.filter((rule) => rule.day_of_week === value);
        return {
          dayIndex: value,
          label,
          rules: dayRules,
          available: dayRules.filter((rule) => !rule.is_blocked),
          blocked: dayRules.filter((rule) => rule.is_blocked),
        };
      }),
    [rules],
  );

  const availableRules = rules.filter((rule) => !rule.is_blocked);
  const blockedRules = rules.filter((rule) => rule.is_blocked);
  const totalAvailableMinutes = availableRules.reduce(
    (total, rule) => total + getRuleDurationMinutes(rule),
    0,
  );
  const createDurationMinutes = getDurationMinutes(
    createForm.start,
    createForm.end,
  );
  const createValidationMessage = getCreateValidationMessage(createForm);
  const isCreateFormInvalid = createValidationMessage !== null;

  function openCreateForm(dayOfWeek = "0") {
    setCreateForm({
      ...initialCreateForm,
      dayOfWeek,
    });
    setCreateError(null);
    setIsCreateOpen(true);
  }

  function replaceRule(updatedRule: AvailabilityRule) {
    setRules((currentRules) =>
      sortRules(
        currentRules.map((rule) =>
          rule.id === updatedRule.id ? updatedRule : rule,
        ),
      ),
    );
  }

  async function handleCreateRule() {
    if (createValidationMessage) {
      setCreateError(createValidationMessage);
      return;
    }

    setIsCreating(true);
    setCreateError(null);
    setActionError(null);

    try {
      const createdRule = await createSlot({
        day_of_week: Number(createForm.dayOfWeek),
        start_time: createForm.start,
        end_time: createForm.end,
        is_blocked: createForm.isBlocked,
      });
      setRules((currentRules) => sortRules([...currentRules, createdRule]));
      setIsCreateOpen(false);
    } catch (error) {
      setCreateError(getErrorMessage(error));
    } finally {
      setIsCreating(false);
    }
  }

  async function handleToggleBlocked(
    rule: AvailabilityRule,
    isBlocked: boolean,
  ) {
    setPendingToggleIds((currentIds) => new Set(currentIds).add(rule.id));
    setActionError(null);

    try {
      const updatedRule = await toggleSlotBlocked(rule.id, isBlocked);
      replaceRule(updatedRule);
    } catch (error) {
      setActionError(getErrorMessage(error));
    } finally {
      setPendingToggleIds((currentIds) => {
        const nextIds = new Set(currentIds);
        nextIds.delete(rule.id);
        return nextIds;
      });
    }
  }

  async function handleDeleteRule(rule: AvailabilityRule) {
    const confirmed = window.confirm(
      "Delete this recurring availability rule? This cannot be undone.",
    );

    if (!confirmed) {
      return;
    }

    setPendingDeleteIds((currentIds) => new Set(currentIds).add(rule.id));
    setActionError(null);

    try {
      await deleteSlot(rule.id);
      setRules((currentRules) =>
        currentRules.filter((currentRule) => currentRule.id !== rule.id),
      );
    } catch (error) {
      setActionError(getErrorMessage(error));
    } finally {
      setPendingDeleteIds((currentIds) => {
        const nextIds = new Set(currentIds);
        nextIds.delete(rule.id);
        return nextIds;
      });
    }
  }

  return (
    <div className="flex flex-col gap-7">
      <header className="space-y-2">
        <h1 className="text-heading">Availability Settings</h1>
        <p className="text-body text-content-muted">
          Create recurring weekly availability and blocked windows. Student
          booking automatically excludes Google Calendar conflicts before a slot
          can be scheduled. If a weekday has no open recurring rules, student
          booking falls back to your standard weekday consultation hours
          filtered by Google Calendar and existing bookings.
        </p>
      </header>

      {loadError ? (
        <InlineError
          message={loadError}
          actionLabel="Retry"
          onAction={async () => {
            setIsLoading(true);
            setLoadError(null);
            try {
              setRules(sortRules((await listMySlots()).filter(isWeekdayRule)));
            } catch (error) {
              setLoadError(getErrorMessage(error));
            } finally {
              setIsLoading(false);
            }
          }}
        />
      ) : null}

      {actionError ? <InlineError message={actionError} /> : null}

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_24rem]">
        <div className="flex min-w-0 flex-col gap-6">
          <Card className="rounded-xl py-6 shadow-elevated">
            <CardHeader className="gap-2 px-6">
              <div className="flex items-start gap-3">
                <CalendarDays className="mt-1 size-5 shrink-0 text-content-strong" />
                <div>
                  <CardTitle>Recurring Weekly Rules</CardTitle>
                  <CardDescription className="text-base">
                    Each rule repeats every week on the selected day.
                  </CardDescription>
                </div>
              </div>
            </CardHeader>

            <CardContent className="px-6">
              {isLoading ? (
                <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                  {weekdayOptions.map(({ label }) => (
                    <Skeleton key={label} className="h-44 rounded-lg" />
                  ))}
                </div>
              ) : (
                <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                  {rulesByDay.map((dayGroup) => (
                    <button
                      key={dayGroup.label}
                      type="button"
                      onClick={() => openCreateForm(String(dayGroup.dayIndex))}
                      className="min-h-44 rounded-lg border border-surface bg-surface-muted-soft p-4 text-left transition-colors hover:border-brand-subtle hover:bg-surface-card focus:outline-none focus:ring-4 focus:ring-focus"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <h2 className="text-label">{dayGroup.label}</h2>
                          <p className="text-xs text-content-muted">
                            Repeats every {dayGroup.label.toLowerCase()}
                          </p>
                        </div>
                        <Badge variant="outline" className="h-6 px-2">
                          {dayGroup.available.length} open
                        </Badge>
                      </div>

                      <div className="mt-3 space-y-2">
                        {dayGroup.rules.map((rule) => (
                          <RulePill key={rule.id} rule={rule} />
                        ))}

                        {dayGroup.rules.length === 0 ? (
                          <div className="rounded-md border border-dashed border-control px-3 py-6 text-center text-body-sm text-content-muted">
                            <Plus className="mx-auto mb-2 size-4" />
                            Add recurring rule
                          </div>
                        ) : (
                          <div className="flex items-center gap-1 pt-1 text-xs text-content-muted">
                            <Plus className="size-3" />
                            <span>Add rule</span>
                          </div>
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="rounded-xl py-6 shadow-elevated">
            <CardHeader className="gap-2 px-6">
              <div className="flex items-start gap-3">
                <Clock3 className="mt-1 size-5 shrink-0 text-content-strong" />
                <div>
                  <CardTitle>Rule Manager</CardTitle>
                  <CardDescription className="text-base">
                    Toggle blocked windows or delete recurring rules.
                  </CardDescription>
                </div>
              </div>
            </CardHeader>

            <CardContent className="space-y-4 px-6">
              {isLoading ? (
                <RuleListSkeleton />
              ) : rules.length > 0 ? (
                rules.map((rule) => (
                  <RuleManagerRow
                    key={rule.id}
                    rule={rule}
                    isToggling={pendingToggleIds.has(rule.id)}
                    isDeleting={pendingDeleteIds.has(rule.id)}
                    onToggle={handleToggleBlocked}
                    onDelete={handleDeleteRule}
                  />
                ))
              ) : (
                <p className="rounded-lg border border-dashed border-control px-4 py-8 text-center text-body-sm text-content-muted">
                  No recurring rules yet. Students will fall back to your
                  standard weekday consultation hours filtered by Google
                  Calendar. Add recurring rules above if you want tighter
                  control.
                </p>
              )}
            </CardContent>
          </Card>
        </div>

        <aside className="flex flex-col gap-6">
          <Card className="rounded-xl py-6 shadow-elevated">
            <CardHeader className="px-6">
              <CardTitle>Quick Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-5 px-6">
              <SummaryMetric label="Recurring Rules" value={rules.length} />
              <SummaryMetric
                label="Open Hours/Week"
                value={`~${formatDuration(totalAvailableMinutes)}`}
              />
              <SummaryMetric
                label="Blocked Rules"
                value={blockedRules.length}
                className="text-content-muted"
              />
            </CardContent>
          </Card>

          <Card className="rounded-xl border-blue-100 bg-blue-50 py-6 text-blue-900 shadow-elevated">
            <CardHeader className="px-6">
              <div className="flex items-center gap-3">
                <CalendarDays className="size-5" />
                <CardTitle className="text-blue-900">Weekly Preview</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-4 px-6">
              <p className="text-body-sm font-medium text-blue-800">
                Your recurring weekly setup:
              </p>
              <div className="space-y-2 text-body-sm text-blue-800">
                {rulesByDay.map((dayGroup) => (
                  <div
                    key={dayGroup.label}
                    className="flex items-center justify-between gap-4"
                  >
                    <span>{dayGroup.label}:</span>
                    <span className="font-medium">
                      {dayGroup.available.length > 0
                        ? `${dayGroup.available.length} open rule(s)`
                        : "Unavailable"}
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </aside>
      </div>

      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent showClose={!isCreating}>
          <DialogHeader>
            <DialogTitle>Create Recurring Rule</DialogTitle>
            <DialogDescription>
              Add a weekly availability or blocked window for a specific day.
            </DialogDescription>
          </DialogHeader>
          <DialogBody className="space-y-4">
            <div className="space-y-1">
              <Label htmlFor="create-slot-day">Weekday</Label>
              <Select
                value={createForm.dayOfWeek}
                onValueChange={(dayValue) =>
                  setCreateForm((current) => ({
                    ...current,
                    dayOfWeek: dayValue,
                  }))
                }
                disabled={isCreating}
              >
                <SelectTrigger id="create-slot-day">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {weekdayOptions.map((option) => (
                    <SelectItem key={option.value} value={String(option.value)}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1">
                <Label htmlFor="create-slot-start">Start</Label>
                <Input
                  id="create-slot-start"
                  type="time"
                  step="1800"
                  value={createForm.start}
                  disabled={isCreating}
                  onChange={(event) =>
                    setCreateForm((current) => ({
                      ...current,
                      start: event.target.value,
                    }))
                  }
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="create-slot-end">End</Label>
                <Input
                  id="create-slot-end"
                  type="time"
                  step="1800"
                  value={createForm.end}
                  aria-invalid={isCreateFormInvalid}
                  disabled={isCreating}
                  onChange={(event) =>
                    setCreateForm((current) => ({
                      ...current,
                      end: event.target.value,
                    }))
                  }
                />
              </div>
            </div>

            <div className="flex items-center justify-between gap-4 rounded-lg border border-surface px-4 py-3">
              <div>
                <p className="text-body font-medium text-content-strong">
                  Create as blocked time
                </p>
                <p className="text-body-sm text-content-muted">
                  Block this weekly window instead of offering it to students.
                </p>
              </div>
              <Switch
                checked={createForm.isBlocked}
                disabled={isCreating}
                onCheckedChange={(checked) =>
                  setCreateForm((current) => ({
                    ...current,
                    isBlocked: checked,
                  }))
                }
              />
            </div>

            <p
              className={cn(
                "text-xs",
                createValidationMessage ? "text-red-600" : "text-content-muted",
              )}
            >
              {createValidationMessage ?? formatDuration(createDurationMinutes)}
            </p>

            {createError ? <InlineError message={createError} /> : null}
          </DialogBody>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              disabled={isCreating}
              onClick={() => setIsCreateOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="button"
              disabled={isCreating || isCreateFormInvalid}
              onClick={handleCreateRule}
            >
              {isCreating ? (
                <LoaderCircle
                  data-icon="inline-start"
                  className="size-4 animate-spin"
                />
              ) : (
                <Plus data-icon="inline-start" className="size-4" />
              )}
              {isCreating ? "Saving..." : "Save Rule"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function RulePill({ rule }: { rule: AvailabilityRule }) {
  return (
    <div
      className={cn(
        "rounded-md border px-3 py-2 text-body-sm",
        rule.is_blocked
          ? "border-slate-300 bg-[repeating-linear-gradient(135deg,#f1f5f9_0,#f1f5f9_6px,#e2e8f0_6px,#e2e8f0_12px)] text-slate-700"
          : "border-emerald-200 bg-emerald-50 text-emerald-800",
      )}
    >
      <div className="font-medium">
        {formatTimeRange(rule.start_time, rule.end_time)}
      </div>
      <div className="text-xs">
        {rule.is_blocked
          ? "Blocked"
          : formatDuration(getRuleDurationMinutes(rule))}
      </div>
    </div>
  );
}

function RuleManagerRow({
  rule,
  isToggling,
  isDeleting,
  onToggle,
  onDelete,
}: {
  rule: AvailabilityRule;
  isToggling: boolean;
  isDeleting: boolean;
  onToggle: (rule: AvailabilityRule, isBlocked: boolean) => void;
  onDelete: (rule: AvailabilityRule) => void;
}) {
  const isPending = isToggling || isDeleting;

  return (
    <div
      className={cn(
        "grid gap-3 rounded-lg border p-4 md:grid-cols-[minmax(0,1fr)_auto_auto] md:items-center",
        rule.is_blocked
          ? "border-slate-300 bg-[repeating-linear-gradient(135deg,#f8fafc_0,#f8fafc_8px,#e2e8f0_8px,#e2e8f0_16px)]"
          : "border-control bg-surface-card",
      )}
    >
      <div>
        <div className="flex flex-wrap items-center gap-2">
          <p className="text-label text-content-strong">
            Every {getWeekdayLabel(rule.day_of_week)}
          </p>
          {rule.is_blocked ? (
            <Badge variant="outline" className="border-slate-300 bg-slate-100">
              Blocked
            </Badge>
          ) : null}
        </div>
        <p className="mt-1 text-body-sm text-content-muted">
          {formatTimeRange(rule.start_time, rule.end_time)} -{" "}
          {formatDuration(getRuleDurationMinutes(rule))}
        </p>
      </div>

      <div className="flex items-center gap-3">
        {isToggling ? (
          <LoaderCircle className="size-4 animate-spin text-content-muted" />
        ) : null}
        <Label htmlFor={`rule-blocked-${rule.id}`} className="text-body-sm">
          Blocked
        </Label>
        <Switch
          id={`rule-blocked-${rule.id}`}
          checked={rule.is_blocked}
          disabled={isPending}
          onCheckedChange={(checked) => onToggle(rule, checked)}
          aria-label="Toggle blocked state"
        />
      </div>

      <Button
        type="button"
        variant="ghost"
        size="icon-sm"
        className="justify-self-start rounded-lg text-red-600 hover:bg-red-50 hover:text-red-700 md:justify-self-end"
        aria-label="Delete recurring rule"
        disabled={isPending}
        onClick={() => onDelete(rule)}
      >
        {isDeleting ? (
          <LoaderCircle className="size-4 animate-spin" />
        ) : (
          <Trash2 className="size-4" />
        )}
      </Button>
    </div>
  );
}

function RuleListSkeleton() {
  return (
    <div className="space-y-4">
      {[0, 1, 2].map((item) => (
        <Skeleton key={item} className="h-24 rounded-lg" />
      ))}
    </div>
  );
}

function SummaryMetric({
  label,
  value,
  className,
}: {
  label: string;
  value: string | number;
  className?: string;
}) {
  return (
    <div>
      <p className="text-body-sm text-content-muted">{label}</p>
      <p className={cn("mt-1 text-3xl font-semibold text-brand", className)}>
        {value}
      </p>
    </div>
  );
}

function InlineError({
  message,
  actionLabel,
  onAction,
}: {
  message: string;
  actionLabel?: string;
  onAction?: () => void;
}) {
  return (
    <div className="flex flex-col gap-3 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-red-800 sm:flex-row sm:items-center sm:justify-between">
      <p className="text-body-sm">{message}</p>
      {actionLabel && onAction ? (
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="border-red-200 bg-white text-red-700 hover:bg-red-100"
          onClick={onAction}
        >
          {actionLabel}
        </Button>
      ) : null}
    </div>
  );
}
