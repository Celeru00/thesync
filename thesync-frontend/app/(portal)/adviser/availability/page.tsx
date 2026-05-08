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
import { cn } from "@/lib/utils";
import {
  createSlot,
  deleteSlot,
  listMySlots,
  toggleSlotBlocked,
  type AvailabilitySlot,
} from "@/lib/api";

type WeekDay = {
  label: string;
  date: Date;
  dateKey: string;
};

type CreateFormState = {
  date: string;
  start: string;
  end: string;
};

const weekDayLabels = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];

const initialCreateForm: CreateFormState = {
  date: "",
  start: "09:00",
  end: "10:00",
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

function toDateKey(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function getWeekDays(referenceDate = new Date()): WeekDay[] {
  const start = new Date(referenceDate);
  const day = start.getDay();
  const daysSinceMonday = day === 0 ? 6 : day - 1;

  start.setHours(0, 0, 0, 0);
  start.setDate(start.getDate() - daysSinceMonday);

  return weekDayLabels.map((label, index) => {
    const date = new Date(start);
    date.setDate(start.getDate() + index);

    return {
      label,
      date,
      dateKey: toDateKey(date),
    };
  });
}

function getSlotDate(slot: AvailabilitySlot) {
  return new Date(slot.slot_start);
}

function getSlotDateKey(slot: AvailabilitySlot) {
  return toDateKey(getSlotDate(slot));
}

function getMinutes(time: string) {
  const [hours, minutes] = time.split(":").map(Number);

  return hours * 60 + minutes;
}

function getDurationMinutes(start: string, end: string) {
  return Math.max(getMinutes(end) - getMinutes(start), 0);
}

function getSlotDurationMinutes(slot: AvailabilitySlot) {
  const start = new Date(slot.slot_start).getTime();
  const end = new Date(slot.slot_end).getTime();

  return Math.max(Math.round((end - start) / 60_000), 0);
}

function formatTimeFromDateTime(value: string) {
  return new Intl.DateTimeFormat("en-US", {
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(value));
}

function formatDateLabel(date: Date) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
  }).format(date);
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

function buildSlotDateTime(date: string, time: string) {
  return new Date(`${date}T${time}:00`).toISOString();
}

function sortSlots(slots: AvailabilitySlot[]) {
  return [...slots].sort(
    (first, second) =>
      new Date(first.slot_start).getTime() -
      new Date(second.slot_start).getTime(),
  );
}

export default function AdviserAvailabilityPage() {
  const weekDays = useMemo(() => getWeekDays(), []);
  const [slots, setSlots] = useState<AvailabilitySlot[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [createError, setCreateError] = useState<string | null>(null);
  const [createForm, setCreateForm] = useState<CreateFormState>(() => ({
    ...initialCreateForm,
    date: weekDays[0]?.dateKey ?? "",
  }));
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

    async function loadSlots() {
      setIsLoading(true);
      setLoadError(null);

      try {
        const nextSlots = await listMySlots();
        if (isMounted) {
          setSlots(sortSlots(nextSlots));
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

    loadSlots();

    return () => {
      isMounted = false;
    };
  }, []);

  const slotsByDay = weekDays.map((day) => {
    const daySlots = slots.filter(
      (slot) => getSlotDateKey(slot) === day.dateKey,
    );

    return {
      ...day,
      available: daySlots.filter((slot) => !slot.is_blocked),
      blocked: daySlots.filter((slot) => slot.is_blocked),
    };
  });

  const activeSlots = slots.filter((slot) => !slot.is_blocked);
  const blockedSlots = slots.filter((slot) => slot.is_blocked);
  const totalMinutes = activeSlots.reduce(
    (total, slot) => total + getSlotDurationMinutes(slot),
    0,
  );
  const createDurationMinutes = getDurationMinutes(
    createForm.start,
    createForm.end,
  );
  const isCreateFormInvalid = createDurationMinutes === 0;

  function openCreateForm(dateKey: string) {
    setCreateForm({
      date: dateKey,
      start: "09:00",
      end: "10:00",
    });
    setCreateError(null);
    setIsCreateOpen(true);
  }

  function replaceSlot(updatedSlot: AvailabilitySlot) {
    setSlots((currentSlots) =>
      sortSlots(
        currentSlots.map((slot) =>
          slot.id === updatedSlot.id ? updatedSlot : slot,
        ),
      ),
    );
  }

  async function handleCreateSlot() {
    if (isCreateFormInvalid) {
      setCreateError("End time must be later than start time.");
      return;
    }

    setIsCreating(true);
    setCreateError(null);
    setActionError(null);

    try {
      const createdSlot = await createSlot({
        slot_start: buildSlotDateTime(createForm.date, createForm.start),
        slot_end: buildSlotDateTime(createForm.date, createForm.end),
      });
      setSlots((currentSlots) => sortSlots([...currentSlots, createdSlot]));
      setIsCreateOpen(false);
    } catch (error) {
      setCreateError(getErrorMessage(error));
    } finally {
      setIsCreating(false);
    }
  }

  async function handleToggleBlocked(
    slot: AvailabilitySlot,
    isBlocked: boolean,
  ) {
    setPendingToggleIds((currentIds) => new Set(currentIds).add(slot.id));
    setActionError(null);

    try {
      const updatedSlot = await toggleSlotBlocked(slot.id, isBlocked);
      replaceSlot(updatedSlot);
    } catch (error) {
      setActionError(getErrorMessage(error));
    } finally {
      setPendingToggleIds((currentIds) => {
        const nextIds = new Set(currentIds);
        nextIds.delete(slot.id);
        return nextIds;
      });
    }
  }

  async function handleDeleteSlot(slot: AvailabilitySlot) {
    const confirmed = window.confirm(
      "Delete this availability slot? This cannot be undone.",
    );

    if (!confirmed) {
      return;
    }

    setPendingDeleteIds((currentIds) => new Set(currentIds).add(slot.id));
    setActionError(null);

    try {
      await deleteSlot(slot.id);
      setSlots((currentSlots) =>
        currentSlots.filter((currentSlot) => currentSlot.id !== slot.id),
      );
    } catch (error) {
      setActionError(getErrorMessage(error));
    } finally {
      setPendingDeleteIds((currentIds) => {
        const nextIds = new Set(currentIds);
        nextIds.delete(slot.id);
        return nextIds;
      });
    }
  }

  return (
    <div className="flex flex-col gap-7">
      <header className="space-y-2">
        <h1 className="text-heading">Availability Settings</h1>
        <p className="text-body text-content-muted">
          Manage your consultation availability and unavailable time blocks
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
              setSlots(sortSlots(await listMySlots()));
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
                  <CardTitle>Weekly Availability Grid</CardTitle>
                  <CardDescription className="text-base">
                    Review available and blocked slots across the week
                  </CardDescription>
                </div>
              </div>
            </CardHeader>

            <CardContent className="px-6">
              {isLoading ? (
                <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                  {weekDays.map((day) => (
                    <Skeleton key={day.dateKey} className="h-44 rounded-lg" />
                  ))}
                </div>
              ) : (
                <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                  {slotsByDay.map((dayGroup) => (
                    <button
                      key={dayGroup.dateKey}
                      type="button"
                      onClick={() => openCreateForm(dayGroup.dateKey)}
                      className="min-h-44 rounded-lg border border-surface bg-surface-muted-soft p-4 text-left transition-colors hover:border-brand-subtle hover:bg-surface-card focus:outline-none focus:ring-4 focus:ring-focus"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <h2 className="text-label">{dayGroup.label}</h2>
                          <p className="text-xs text-content-muted">
                            {formatDateLabel(dayGroup.date)}
                          </p>
                        </div>
                        <Badge variant="outline" className="h-6 px-2">
                          {dayGroup.available.length} open
                        </Badge>
                      </div>

                      <div className="mt-3 space-y-2">
                        {dayGroup.available.map((slot) => (
                          <SlotPill key={slot.id} slot={slot} />
                        ))}

                        {dayGroup.blocked.map((slot) => (
                          <SlotPill key={slot.id} slot={slot} />
                        ))}

                        {dayGroup.available.length === 0 &&
                        dayGroup.blocked.length === 0 ? (
                          <div className="rounded-md border border-dashed border-control px-3 py-6 text-center text-body-sm text-content-muted">
                            <Plus className="mx-auto mb-2 size-4" />
                            Add slot
                          </div>
                        ) : (
                          <div className="flex items-center gap-1 pt-1 text-xs text-content-muted">
                            <Plus className="size-3" />
                            <span>Add slot</span>
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
                  <CardTitle>Availability Slots</CardTitle>
                  <CardDescription className="text-base">
                    Toggle blocked windows or delete slots
                  </CardDescription>
                </div>
              </div>
            </CardHeader>

            <CardContent className="space-y-4 px-6">
              {isLoading ? (
                <SlotListSkeleton />
              ) : slots.length > 0 ? (
                slots.map((slot) => (
                  <SlotManagerRow
                    key={slot.id}
                    slot={slot}
                    isToggling={pendingToggleIds.has(slot.id)}
                    isDeleting={pendingDeleteIds.has(slot.id)}
                    onToggle={handleToggleBlocked}
                    onDelete={handleDeleteSlot}
                  />
                ))
              ) : (
                <p className="rounded-lg border border-dashed border-control px-4 py-8 text-center text-body-sm text-content-muted">
                  No availability slots yet. Click a day on the weekly grid to
                  create one.
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
              <SummaryMetric
                label="Active Time Slots"
                value={activeSlots.length}
              />
              <SummaryMetric
                label="Total Hours/Week"
                value={`~${formatDuration(totalMinutes)}`}
              />
              <SummaryMetric
                label="Blocked Slots"
                value={blockedSlots.length}
                className="text-content-muted"
              />
            </CardContent>
          </Card>

          <Card className="rounded-xl border-blue-100 bg-blue-50 py-6 text-blue-900 shadow-elevated">
            <CardHeader className="px-6">
              <div className="flex items-center gap-3">
                <CalendarDays className="size-5" />
                <CardTitle className="text-blue-900">Preview</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-4 px-6">
              <p className="text-body-sm font-medium text-blue-800">
                Your availability this week:
              </p>
              <div className="space-y-2 text-body-sm text-blue-800">
                {slotsByDay.map((dayGroup) => (
                  <div
                    key={dayGroup.dateKey}
                    className="flex items-center justify-between gap-4"
                  >
                    <span>{dayGroup.label}:</span>
                    <span className="font-medium">
                      {dayGroup.available.length > 0
                        ? `${dayGroup.available.length} slot(s)`
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
            <DialogTitle>Create Availability Slot</DialogTitle>
            <DialogDescription>
              Add a consultation window for the selected day.
            </DialogDescription>
          </DialogHeader>
          <DialogBody className="space-y-4">
            <div className="space-y-1">
              <Label htmlFor="create-slot-day">Day</Label>
              <Select
                value={createForm.date}
                onValueChange={(dateValue) =>
                  setCreateForm((current) => ({ ...current, date: dateValue }))
                }
                disabled={isCreating}
              >
                <SelectTrigger id="create-slot-day">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {weekDays.map((day) => (
                    <SelectItem key={day.dateKey} value={day.dateKey}>
                      {day.label} - {formatDateLabel(day.date)}
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
                  step="300"
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
                  step="300"
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

            <p
              className={cn(
                "text-xs",
                isCreateFormInvalid ? "text-red-600" : "text-content-muted",
              )}
            >
              {formatDuration(createDurationMinutes)}
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
              onClick={handleCreateSlot}
            >
              {isCreating ? (
                <LoaderCircle
                  data-icon="inline-start"
                  className="size-4 animate-spin"
                />
              ) : (
                <Plus data-icon="inline-start" className="size-4" />
              )}
              {isCreating ? "Saving..." : "Save Slot"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function SlotPill({ slot }: { slot: AvailabilitySlot }) {
  return (
    <div
      className={cn(
        "rounded-md border px-3 py-2 text-body-sm",
        slot.is_blocked
          ? "border-slate-300 bg-[repeating-linear-gradient(135deg,#f1f5f9_0,#f1f5f9_6px,#e2e8f0_6px,#e2e8f0_12px)] text-slate-700"
          : "border-emerald-200 bg-emerald-50 text-emerald-800",
      )}
    >
      <div className="font-medium">
        {formatTimeFromDateTime(slot.slot_start)} -{" "}
        {formatTimeFromDateTime(slot.slot_end)}
      </div>
      <div className="text-xs">
        {slot.is_blocked
          ? "Blocked"
          : formatDuration(getSlotDurationMinutes(slot))}
      </div>
    </div>
  );
}

function SlotManagerRow({
  slot,
  isToggling,
  isDeleting,
  onToggle,
  onDelete,
}: {
  slot: AvailabilitySlot;
  isToggling: boolean;
  isDeleting: boolean;
  onToggle: (slot: AvailabilitySlot, isBlocked: boolean) => void;
  onDelete: (slot: AvailabilitySlot) => void;
}) {
  const isPending = isToggling || isDeleting;

  return (
    <div
      className={cn(
        "grid gap-3 rounded-lg border p-4 md:grid-cols-[minmax(0,1fr)_auto_auto] md:items-center",
        slot.is_blocked
          ? "border-slate-300 bg-[repeating-linear-gradient(135deg,#f8fafc_0,#f8fafc_8px,#e2e8f0_8px,#e2e8f0_16px)]"
          : "border-control bg-surface-card",
      )}
    >
      <div>
        <div className="flex flex-wrap items-center gap-2">
          <p className="text-label text-content-strong">
            {new Intl.DateTimeFormat("en-US", {
              weekday: "long",
              month: "short",
              day: "numeric",
            }).format(getSlotDate(slot))}
          </p>
          {slot.is_blocked ? (
            <Badge variant="outline" className="border-slate-300 bg-slate-100">
              Blocked
            </Badge>
          ) : null}
        </div>
        <p className="mt-1 text-body-sm text-content-muted">
          {formatTimeFromDateTime(slot.slot_start)} -{" "}
          {formatTimeFromDateTime(slot.slot_end)} -{" "}
          {formatDuration(getSlotDurationMinutes(slot))}
        </p>
      </div>

      <div className="flex items-center gap-3">
        {isToggling ? (
          <LoaderCircle className="size-4 animate-spin text-content-muted" />
        ) : null}
        <Label htmlFor={`slot-blocked-${slot.id}`} className="text-body-sm">
          Blocked
        </Label>
        <Switch
          id={`slot-blocked-${slot.id}`}
          checked={slot.is_blocked}
          disabled={isPending}
          onCheckedChange={(checked) => onToggle(slot, checked)}
          aria-label="Toggle blocked state"
        />
      </div>

      <Button
        type="button"
        variant="ghost"
        size="icon-sm"
        className="justify-self-start rounded-lg text-red-600 hover:bg-red-50 hover:text-red-700 md:justify-self-end"
        aria-label="Delete availability slot"
        disabled={isPending}
        onClick={() => onDelete(slot)}
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

function SlotListSkeleton() {
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
