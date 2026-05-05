"use client";

import { useState } from "react";
import { Ban, CalendarDays, Clock3, Plus, Save, Trash2 } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";

type AvailabilitySlot = {
  id: number;
  day: string;
  start: string;
  end: string;
  enabled: boolean;
};

type BlockedSlot = {
  id: number;
  day: string;
  start: string;
  end: string;
  reason: string;
};

const days = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];

const initialAvailabilitySlots: AvailabilitySlot[] = [
  { id: 1, day: "Monday", start: "09:00", end: "12:00", enabled: true },
  { id: 2, day: "Monday", start: "14:00", end: "17:00", enabled: true },
  { id: 3, day: "Tuesday", start: "09:00", end: "12:00", enabled: true },
  { id: 4, day: "Wednesday", start: "14:00", end: "17:00", enabled: true },
  { id: 5, day: "Friday", start: "10:00", end: "12:00", enabled: true },
];

const initialBlockedSlots: BlockedSlot[] = [
  {
    id: 1,
    day: "Wednesday",
    start: "11:00",
    end: "12:00",
    reason: "Department meeting",
  },
  {
    id: 2,
    day: "Friday",
    start: "13:00",
    end: "14:00",
    reason: "Committee review",
  },
];

function getMinutes(time: string) {
  const [hours, minutes] = time.split(":").map(Number);

  return hours * 60 + minutes;
}

function getDurationMinutes(start: string, end: string) {
  return Math.max(getMinutes(end) - getMinutes(start), 0);
}

function formatTime(time: string) {
  const [rawHours, rawMinutes] = time.split(":").map(Number);
  const period = rawHours >= 12 ? "PM" : "AM";
  const hours = rawHours % 12 || 12;
  const minutes = rawMinutes.toString().padStart(2, "0");

  return `${hours}:${minutes} ${period}`;
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

export default function AdviserAvailabilityPage() {
  const [availabilitySlots, setAvailabilitySlots] = useState(
    initialAvailabilitySlots,
  );
  const [blockedSlots, setBlockedSlots] = useState(initialBlockedSlots);
  const [autoApprove, setAutoApprove] = useState(false);

  const activeSlots = availabilitySlots.filter((slot) => slot.enabled);
  const totalMinutes = activeSlots.reduce(
    (total, slot) => total + getDurationMinutes(slot.start, slot.end),
    0,
  );

  const slotsByDay = days.map((day) => ({
    day,
    available: activeSlots.filter((slot) => slot.day === day),
    blocked: blockedSlots.filter((slot) => slot.day === day),
  }));

  const updateAvailabilitySlot = (
    id: number,
    updates: Partial<AvailabilitySlot>,
  ) => {
    setAvailabilitySlots((currentSlots) =>
      currentSlots.map((slot) =>
        slot.id === id ? { ...slot, ...updates } : slot,
      ),
    );
  };

  const addAvailabilitySlot = () => {
    setAvailabilitySlots((currentSlots) => [
      ...currentSlots,
      {
        id: Date.now(),
        day: "Monday",
        start: "09:00",
        end: "10:00",
        enabled: true,
      },
    ]);
  };

  const removeAvailabilitySlot = (id: number) => {
    setAvailabilitySlots((currentSlots) =>
      currentSlots.filter((slot) => slot.id !== id),
    );
  };

  const updateBlockedSlot = (id: number, updates: Partial<BlockedSlot>) => {
    setBlockedSlots((currentSlots) =>
      currentSlots.map((slot) =>
        slot.id === id ? { ...slot, ...updates } : slot,
      ),
    );
  };

  const addBlockedSlot = () => {
    setBlockedSlots((currentSlots) => [
      ...currentSlots,
      {
        id: Date.now(),
        day: "Thursday",
        start: "13:00",
        end: "14:00",
        reason: "Unavailable",
      },
    ]);
  };

  const removeBlockedSlot = (id: number) => {
    setBlockedSlots((currentSlots) =>
      currentSlots.filter((slot) => slot.id !== id),
    );
  };

  return (
    <div className="flex flex-col gap-7">
      <header className="space-y-2">
        <h1 className="text-heading">Availability Settings</h1>
        <p className="text-body text-content-muted">
          Manage your consultation availability and unavailable time blocks
        </p>
      </header>

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
              <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                {slotsByDay.map((dayGroup) => (
                  <div
                    key={dayGroup.day}
                    className="min-h-40 rounded-lg border border-surface bg-surface-muted-soft p-4"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <h2 className="text-label">{dayGroup.day}</h2>
                      <Badge variant="outline" className="h-6 px-2">
                        {dayGroup.available.length} open
                      </Badge>
                    </div>

                    <div className="mt-3 space-y-2">
                      {dayGroup.available.map((slot) => (
                        <div
                          key={slot.id}
                          className="rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-body-sm text-emerald-800"
                        >
                          <div className="font-medium">
                            {formatTime(slot.start)} - {formatTime(slot.end)}
                          </div>
                          <div className="text-xs">
                            {formatDuration(
                              getDurationMinutes(slot.start, slot.end),
                            )}
                          </div>
                        </div>
                      ))}

                      {dayGroup.blocked.map((slot) => (
                        <div
                          key={slot.id}
                          className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-body-sm text-red-700"
                        >
                          <div className="font-medium">
                            {formatTime(slot.start)} - {formatTime(slot.end)}
                          </div>
                          <div className="text-xs">{slot.reason}</div>
                        </div>
                      ))}

                      {dayGroup.available.length === 0 &&
                      dayGroup.blocked.length === 0 ? (
                        <p className="rounded-md border border-dashed border-control px-3 py-6 text-center text-body-sm text-content-muted">
                          No slots set
                        </p>
                      ) : null}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-xl py-6 shadow-elevated">
            <CardHeader className="gap-2 px-6">
              <div className="flex items-start gap-3">
                <Clock3 className="mt-1 size-5 shrink-0 text-content-strong" />
                <div>
                  <CardTitle>Availability Slots</CardTitle>
                  <CardDescription className="text-base">
                    Create or edit recurring consultation slots
                  </CardDescription>
                </div>
              </div>
            </CardHeader>

            <CardContent className="space-y-4 px-6">
              {availabilitySlots.map((slot) => {
                const durationMinutes = getDurationMinutes(
                  slot.start,
                  slot.end,
                );
                const isInvalid = durationMinutes === 0;

                return (
                  <div
                    key={slot.id}
                    className="grid gap-3 rounded-lg border border-control p-4 md:grid-cols-[auto_minmax(0,1fr)_minmax(0,1fr)_minmax(0,1fr)_auto] md:items-start"
                  >
                    <div className="pt-2">
                      <Switch
                        checked={slot.enabled}
                        onCheckedChange={(enabled) =>
                          updateAvailabilitySlot(slot.id, { enabled })
                        }
                        aria-label={`Enable ${slot.day} ${formatTime(
                          slot.start,
                        )} availability`}
                      />
                    </div>
                    <div className="space-y-1">
                      <Label htmlFor={`slot-day-${slot.id}`}>Day</Label>
                      <Select
                        value={slot.day}
                        onValueChange={(day) =>
                          updateAvailabilitySlot(slot.id, { day })
                        }
                      >
                        <SelectTrigger id={`slot-day-${slot.id}`}>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {days.map((day) => (
                            <SelectItem key={day} value={day}>
                              {day}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1">
                      <Label htmlFor={`slot-start-${slot.id}`}>Start</Label>
                      <Input
                        id={`slot-start-${slot.id}`}
                        type="time"
                        step="300"
                        value={slot.start}
                        onChange={(event) =>
                          updateAvailabilitySlot(slot.id, {
                            start: event.target.value,
                          })
                        }
                      />
                    </div>
                    <div className="space-y-1">
                      <Label htmlFor={`slot-end-${slot.id}`}>End</Label>
                      <Input
                        id={`slot-end-${slot.id}`}
                        type="time"
                        step="300"
                        value={slot.end}
                        aria-invalid={isInvalid}
                        onChange={(event) =>
                          updateAvailabilitySlot(slot.id, {
                            end: event.target.value,
                          })
                        }
                      />
                      <p
                        className={
                          isInvalid
                            ? "text-xs text-red-600"
                            : "text-xs text-content-muted"
                        }
                      >
                        {formatDuration(durationMinutes)}
                      </p>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon-sm"
                      className="justify-self-start rounded-lg text-red-600 hover:bg-red-50 hover:text-red-700 md:mt-6 md:justify-self-end"
                      aria-label="Remove time slot"
                      onClick={() => removeAvailabilitySlot(slot.id)}
                    >
                      <Trash2 className="size-4" />
                    </Button>
                  </div>
                );
              })}

              <Button
                type="button"
                variant="outline"
                className="h-10 w-full rounded-lg border-dashed bg-surface-muted-soft"
                onClick={addAvailabilitySlot}
              >
                <Plus data-icon="inline-start" className="size-4" />
                Add Time Slot
              </Button>
            </CardContent>
          </Card>

          <Card className="rounded-xl py-6 shadow-elevated">
            <CardHeader className="gap-2 px-6">
              <div className="flex items-start gap-3">
                <Ban className="mt-1 size-5 shrink-0 text-content-strong" />
                <div>
                  <CardTitle>Blocked Unavailable Slots</CardTitle>
                  <CardDescription className="text-base">
                    Block dates or recurring windows that cannot be booked
                  </CardDescription>
                </div>
              </div>
            </CardHeader>

            <CardContent className="space-y-4 px-6">
              {blockedSlots.map((slot) => {
                const isInvalid =
                  getDurationMinutes(slot.start, slot.end) === 0;

                return (
                  <div
                    key={slot.id}
                    className="grid gap-3 rounded-lg border border-red-100 bg-red-50/60 p-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_minmax(0,1fr)_minmax(0,1.5fr)_auto] lg:items-start"
                  >
                    <div className="space-y-1">
                      <Label htmlFor={`blocked-day-${slot.id}`}>Day</Label>
                      <Select
                        value={slot.day}
                        onValueChange={(day) =>
                          updateBlockedSlot(slot.id, { day })
                        }
                      >
                        <SelectTrigger id={`blocked-day-${slot.id}`}>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {days.map((day) => (
                            <SelectItem key={day} value={day}>
                              {day}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1">
                      <Label htmlFor={`blocked-start-${slot.id}`}>Start</Label>
                      <Input
                        id={`blocked-start-${slot.id}`}
                        type="time"
                        step="300"
                        value={slot.start}
                        onChange={(event) =>
                          updateBlockedSlot(slot.id, {
                            start: event.target.value,
                          })
                        }
                      />
                    </div>
                    <div className="space-y-1">
                      <Label htmlFor={`blocked-end-${slot.id}`}>End</Label>
                      <Input
                        id={`blocked-end-${slot.id}`}
                        type="time"
                        step="300"
                        value={slot.end}
                        aria-invalid={isInvalid}
                        onChange={(event) =>
                          updateBlockedSlot(slot.id, {
                            end: event.target.value,
                          })
                        }
                      />
                      {isInvalid ? (
                        <p className="text-xs text-red-600">
                          End time must be later
                        </p>
                      ) : null}
                    </div>
                    <div className="space-y-1">
                      <Label htmlFor={`blocked-reason-${slot.id}`}>
                        Reason
                      </Label>
                      <Textarea
                        id={`blocked-reason-${slot.id}`}
                        value={slot.reason}
                        onChange={(event) =>
                          updateBlockedSlot(slot.id, {
                            reason: event.target.value,
                          })
                        }
                        className="min-h-10"
                      />
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon-sm"
                      className="rounded-lg text-red-600 hover:bg-red-100 hover:text-red-700 lg:mt-6"
                      aria-label="Remove blocked slot"
                      onClick={() => removeBlockedSlot(slot.id)}
                    >
                      <Trash2 className="size-4" />
                    </Button>
                  </div>
                );
              })}

              <Button
                type="button"
                variant="outline"
                className="h-10 w-full rounded-lg border-dashed bg-surface-muted-soft"
                onClick={addBlockedSlot}
              >
                <Plus data-icon="inline-start" className="size-4" />
                Block Unavailable Slot
              </Button>
            </CardContent>
          </Card>

          <Card className="rounded-xl py-6 shadow-elevated">
            <CardHeader className="px-6">
              <CardTitle>Consultation Preferences</CardTitle>
              <CardDescription className="text-base">
                Configure how consultations are managed
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-5 px-6">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <Label htmlFor="auto-approve">Auto-approve Requests</Label>
                  <p className="mt-1 text-body-sm text-content-muted">
                    Automatically approve requests during available time slots
                  </p>
                </div>
                <Switch
                  id="auto-approve"
                  checked={autoApprove}
                  onCheckedChange={setAutoApprove}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="buffer-time">
                  Buffer Time Between Consultations
                </Label>
                <Select defaultValue="15">
                  <SelectTrigger id="buffer-time">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="0">No buffer</SelectItem>
                    <SelectItem value="15">15 minutes</SelectItem>
                    <SelectItem value="30">30 minutes</SelectItem>
                    <SelectItem value="60">1 hour</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-content-muted">
                  Time reserved between consecutive consultations
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="maximum-consultations">
                  Maximum Consultations Per Day
                </Label>
                <Select defaultValue="5">
                  <SelectTrigger id="maximum-consultations">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="3">3 consultations</SelectItem>
                    <SelectItem value="5">5 consultations</SelectItem>
                    <SelectItem value="8">8 consultations</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-content-muted">
                  Limit the number of consultations you can have in a single day
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        <aside className="flex flex-col gap-6">
          <Card className="rounded-xl py-6 shadow-elevated">
            <CardHeader className="px-6">
              <CardTitle>Quick Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-5 px-6">
              <div>
                <p className="text-body-sm text-content-muted">
                  Active Time Slots
                </p>
                <p className="mt-1 text-3xl font-semibold text-brand">
                  {activeSlots.length}
                </p>
              </div>
              <div>
                <p className="text-body-sm text-content-muted">
                  Total Hours/Week
                </p>
                <p className="mt-1 text-3xl font-semibold text-brand">
                  ~{formatDuration(totalMinutes)}
                </p>
              </div>
              <div>
                <p className="text-body-sm text-content-muted">Blocked Slots</p>
                <p className="mt-1 text-3xl font-semibold text-red-600">
                  {blockedSlots.length}
                </p>
              </div>
              <div>
                <p className="text-body-sm text-content-muted">Auto-approve</p>
                <p className="mt-1 text-label text-content-strong">
                  {autoApprove ? "Enabled" : "Disabled"}
                </p>
              </div>
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
                    key={dayGroup.day}
                    className="flex items-center justify-between gap-4"
                  >
                    <span>{dayGroup.day}:</span>
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

          <Button type="button" className="w-full rounded-lg">
            <Save data-icon="inline-start" className="size-4" />
            Save Changes
          </Button>
        </aside>
      </div>
    </div>
  );
}
