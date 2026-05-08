"use client";

import Link from "next/link";
import {
  useCallback,
  useDeferredValue,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  CalendarDays,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  CircleCheckBig,
  Clock3,
  FileText,
  Layers3,
  LoaderCircle,
  Plus,
  UserRound,
  UsersRound,
  X,
} from "lucide-react";

import { SearchInput } from "@/components/data-display";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from "@/components/ui/card";
import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useAdvisers } from "@/hooks/useAdvisers";
import {
  useCalendarOverlayEvents,
  useCalendarOverlaySources,
} from "@/hooks/useCalendarOverlay";
import { useCreateSchedule } from "@/hooks/useSchedules";
import type { GoogleCalendarOverlaySource } from "@/lib/calendar/backend";
import {
  parseConsultationRequestError,
  scheduleTypeIdByValue,
  type ConsultationRequestFieldName,
} from "@/lib/consultation-request";
import { type AvailabilitySlot } from "@/lib/api";
import {
  type ConsultationRequestType,
  type TimePeriod,
} from "@/lib/mock/student-consultations";
import { cn } from "@/lib/utils";
import { useFreeSlots } from "@/hooks/useAvailability";

type CalendarView = "month" | "week";
type CalendarPortalRole = "student" | "adviser";
type CalendarOwnerRole = "student" | "adviser" | "admin";
type CalendarEventTone =
  | "brand"
  | "violet"
  | "emerald"
  | "amber"
  | "rose"
  | "teal";
type CalendarEventStatus = "approved" | "pending";
type CalendarEventType = "consultation" | "defense";

type CalendarEvent = {
  id: string;
  startsAt: Date;
  durationHours: number;
  ownerId: string;
  ownerName: string;
  ownerRole: CalendarOwnerRole;
  isPrimaryCalendar: boolean;
  status: CalendarEventStatus;
  title: string;
  tone: CalendarEventTone;
  type: CalendarEventType;
};

export type PortalCalendarEvent = {
  id: string;
  startsAt: string;
  durationHours: number;
  ownerId: string;
  ownerName: string;
  ownerRole: CalendarOwnerRole;
  isPrimaryCalendar?: boolean;
  status: CalendarEventStatus;
  title: string;
  tone: CalendarEventTone;
  type: CalendarEventType;
};

type CalendarDayCell = {
  date: Date;
  inCurrentMonth: boolean;
};

type RequestDraft = {
  date: Date;
  endAt: Date;
};

type DragSelection = {
  dayIndex: number;
  startSlotIndex: number;
  endSlotIndex: number;
};

type CalendarOverlaySelection = {
  userId: string;
  fullName: string;
  roleName: string;
};

type CalendarVisibilityOption = {
  userId: string;
  fullName: string;
  roleLabel: string;
};

type WeekEventLayout = {
  stackOrder: number;
};

const weekdayLabels = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const DEFAULT_WEEK_START_MINUTES = 8 * 60;
const DEFAULT_WEEK_END_MINUTES = 20 * 60;

const monthFormatter = new Intl.DateTimeFormat("en-US", {
  month: "long",
  year: "numeric",
});

const shortMonthFormatter = new Intl.DateTimeFormat("en-US", {
  month: "short",
});

const timeFormatter = new Intl.DateTimeFormat("en-US", {
  hour: "numeric",
  minute: "2-digit",
});

const requestDateFormatter = new Intl.DateTimeFormat("en-US", {
  weekday: "long",
  month: "long",
  day: "numeric",
  year: "numeric",
});

const sampleEvents: PortalCalendarEvent[] = [
  {
    id: "chapter-1-review",
    startsAt: new Date(2026, 4, 5, 14, 0).toISOString(),
    durationHours: 1,
    ownerId: "self",
    ownerName: "My Calendar",
    ownerRole: "student",
    isPrimaryCalendar: true,
    status: "approved",
    title: "Chapter 1 Review",
    tone: "brand",
    type: "consultation",
  },
  {
    id: "methodology-discussion",
    startsAt: new Date(2026, 4, 8, 10, 0).toISOString(),
    durationHours: 1,
    ownerId: "self",
    ownerName: "My Calendar",
    ownerRole: "student",
    isPrimaryCalendar: true,
    status: "pending",
    title: "Methodology Discussion",
    tone: "brand",
    type: "consultation",
  },
  {
    id: "data-analysis-review",
    startsAt: new Date(2026, 4, 12, 15, 0).toISOString(),
    durationHours: 1,
    ownerId: "self",
    ownerName: "My Calendar",
    ownerRole: "student",
    isPrimaryCalendar: true,
    status: "approved",
    title: "Data Analysis Review",
    tone: "brand",
    type: "consultation",
  },
  {
    id: "thesis-defense",
    startsAt: new Date(2026, 4, 15, 13, 0).toISOString(),
    durationHours: 1,
    ownerId: "self",
    ownerName: "My Calendar",
    ownerRole: "student",
    isPrimaryCalendar: true,
    status: "approved",
    title: "Thesis Defense",
    tone: "violet",
    type: "defense",
  },
  {
    id: "final-revisions",
    startsAt: new Date(2026, 4, 20, 11, 0).toISOString(),
    durationHours: 1,
    ownerId: "self",
    ownerName: "My Calendar",
    ownerRole: "student",
    isPrimaryCalendar: true,
    status: "pending",
    title: "Final Revisions",
    tone: "brand",
    type: "consultation",
  },
];

const statusBadgeVariants = {
  approved: "success",
  pending: "warning",
} as const;

const eventToneClassNames = {
  brand: {
    monthBar: "border border-brand-subtle/60 bg-primary-tint text-brand-strong",
    weekBlock:
      "border-2 border-brand-subtle bg-surface-card text-content-strong shadow-[0_12px_24px_rgba(45,94,255,0.06)]",
  },
  violet: {
    monthBar: "border border-violet/18 bg-violet-soft text-violet",
    weekBlock:
      "border-2 border-brand-subtle bg-surface-card text-content-strong shadow-[0_12px_24px_rgba(45,94,255,0.06)]",
  },
  emerald: {
    monthBar: "border border-emerald-200 bg-emerald-50 text-emerald-700",
    weekBlock:
      "border-2 border-emerald-200 bg-surface-card text-content-strong shadow-[0_12px_24px_rgba(16,185,129,0.08)]",
  },
  amber: {
    monthBar: "border border-amber-200 bg-amber-50 text-amber-700",
    weekBlock:
      "border-2 border-amber-200 bg-surface-card text-content-strong shadow-[0_12px_24px_rgba(245,158,11,0.08)]",
  },
  rose: {
    monthBar: "border border-rose-200 bg-rose-50 text-rose-700",
    weekBlock:
      "border-2 border-rose-200 bg-surface-card text-content-strong shadow-[0_12px_24px_rgba(244,63,94,0.08)]",
  },
  teal: {
    monthBar: "border border-teal-200 bg-teal-50 text-teal-700",
    weekBlock:
      "border-2 border-teal-200 bg-surface-card text-content-strong shadow-[0_12px_24px_rgba(20,184,166,0.08)]",
  },
} as const;

const overlayTonePalette: CalendarEventTone[] = [
  "brand",
  "violet",
  "emerald",
  "amber",
  "rose",
  "teal",
];

function startOfDay(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function addDays(date: Date, amount: number) {
  const nextDate = new Date(date);
  nextDate.setDate(nextDate.getDate() + amount);

  return nextDate;
}

function addMonths(date: Date, amount: number) {
  return new Date(date.getFullYear(), date.getMonth() + amount, 1);
}

function addMinutes(date: Date, amount: number) {
  return new Date(date.getTime() + amount * 60 * 1000);
}

function buildWeekTimeSlots(startMinutes: number, endMinutes: number) {
  const totalSlots = Math.max(1, Math.ceil((endMinutes - startMinutes) / 30));

  return Array.from({ length: totalSlots }, (_, index) => {
    const totalMinutes = startMinutes + index * 30;
    const hour = Math.floor(totalMinutes / 60);
    const minute = totalMinutes % 60;

    return { hour, minute };
  });
}

function parsePortalEventDate(value: string) {
  const parsed = new Date(value);

  if (Number.isNaN(parsed.getTime())) {
    return null;
  }

  return parsed;
}

function startOfWeek(date: Date) {
  return addDays(startOfDay(date), -startOfDay(date).getDay());
}

function isSameDay(left: Date, right: Date) {
  return (
    left.getFullYear() === right.getFullYear() &&
    left.getMonth() === right.getMonth() &&
    left.getDate() === right.getDate()
  );
}

function isSameMonth(left: Date, right: Date) {
  return (
    left.getFullYear() === right.getFullYear() &&
    left.getMonth() === right.getMonth()
  );
}

function getDaysInMonth(date: Date) {
  return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
}

function getMonthCells(date: Date) {
  const monthStart = new Date(date.getFullYear(), date.getMonth(), 1);
  const monthEnd = new Date(
    date.getFullYear(),
    date.getMonth(),
    getDaysInMonth(monthStart),
  );
  const gridStart = startOfWeek(monthStart);
  const gridEnd = addDays(startOfWeek(monthEnd), 6);
  const totalDays = Math.round(
    (gridEnd.getTime() - gridStart.getTime()) / (1000 * 60 * 60 * 24),
  );

  return Array.from({ length: totalDays + 1 }, (_, index) => {
    const currentDate = addDays(gridStart, index);

    return {
      date: currentDate,
      inCurrentMonth: isSameMonth(currentDate, date),
    } satisfies CalendarDayCell;
  });
}

function getEventDayKey(date: Date) {
  return `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
}

function getInitialFocusDate(events: PortalCalendarEvent[]) {
  const today = startOfDay(new Date());
  const sortedEventDates = events
    .map((event) => parsePortalEventDate(event.startsAt))
    .filter((date): date is Date => date !== null)
    .sort((left, right) => left.getTime() - right.getTime());

  if (sortedEventDates.length === 0) {
    return today;
  }

  const nextUpcomingDate =
    sortedEventDates.find((date) => date.getTime() >= today.getTime()) ??
    sortedEventDates[sortedEventDates.length - 1];

  return startOfDay(nextUpcomingDate);
}

function getTitleForView(view: CalendarView, date: Date) {
  if (view === "month") {
    return monthFormatter.format(date);
  }

  return monthFormatter.format(startOfWeek(date));
}

function getEventTypeLabel(type: CalendarEventType) {
  return type === "consultation" ? "Consultation" : "Defense";
}

function getEventStatusLabel(status: CalendarEventStatus) {
  return status === "approved" ? "Approved" : "Pending";
}

function getEventEndsAt(event: CalendarEvent) {
  return addMinutes(event.startsAt, event.durationHours * 60);
}

function getEventTimeRange(event: CalendarEvent) {
  return `${timeFormatter.format(event.startsAt)} - ${timeFormatter.format(
    getEventEndsAt(event),
  )}`;
}

function getRoleLabel(role: CalendarOwnerRole) {
  return role === "adviser"
    ? "Adviser"
    : role === "student"
      ? "Student"
      : "Admin";
}

function getOwnerInitials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

function getLegendDotClassName(tone: CalendarEventTone) {
  switch (tone) {
    case "violet":
      return "bg-violet";
    case "emerald":
      return "bg-emerald-500";
    case "amber":
      return "bg-amber-500";
    case "rose":
      return "bg-rose-500";
    case "teal":
      return "bg-teal-500";
    default:
      return "bg-brand";
  }
}

function getCompactEventTimeLabel(date: Date) {
  const hours = date.getHours();
  const minutes = date.getMinutes();
  const period = hours >= 12 ? "pm" : "am";
  const normalizedHour = hours % 12 || 12;

  if (minutes === 0) {
    return `${normalizedHour}${period}`;
  }

  return `${normalizedHour}:${String(minutes).padStart(2, "0")}${period}`;
}

function getCompactEventTimeRangeLabel(event: CalendarEvent) {
  return `${getCompactEventTimeLabel(event.startsAt)} - ${getCompactEventTimeLabel(
    getEventEndsAt(event),
  )}`;
}

function eventsOverlap(left: CalendarEvent, right: CalendarEvent) {
  return (
    getEventStartMinutes(left) < getEventEndMinutes(right) &&
    getEventEndMinutes(left) > getEventStartMinutes(right)
  );
}

function getWeekEvents(date: Date, events: CalendarEvent[]) {
  const weekStart = startOfWeek(date);
  const weekEnd = addDays(weekStart, 7);

  return events.filter((event) => {
    return event.startsAt >= weekStart && event.startsAt < weekEnd;
  });
}

function mapOverlaySourceToEventTone(
  ownerId: string,
  ownerIds: string[],
  fallbackTone: CalendarEventTone,
) {
  const sourceIndex = ownerIds.indexOf(ownerId);
  if (sourceIndex === -1) {
    return fallbackTone;
  }

  return overlayTonePalette[sourceIndex % overlayTonePalette.length];
}

function buildOverlayCalendarPortalEvents(
  overlayEvents: {
    event_id: string;
    summary: string | null;
    status: string;
    starts_at: string | null;
    ends_at: string | null;
    source_user_id: string;
    source_full_name: string;
    source_role_name: string;
  }[],
) {
  return overlayEvents
    .map<PortalCalendarEvent | null>((event) => {
      const startsAt = event.starts_at ?? null;
      if (!startsAt) {
        return null;
      }

      const endsAt = event.ends_at ?? startsAt;
      const durationMs =
        new Date(endsAt).getTime() - new Date(startsAt).getTime();
      const durationHours = Math.max(
        0.5,
        Math.round(durationMs / (1000 * 60 * 30) || 2) / 2,
      );
      const title = event.summary?.trim() || "Google Calendar Event";
      const isDefense = title.toLowerCase().includes("defense");
      const normalizedRole = event.source_role_name.trim().toLowerCase();
      const ownerRole: CalendarOwnerRole =
        normalizedRole === "adviser"
          ? "adviser"
          : normalizedRole === "admin"
            ? "admin"
            : "student";

      return {
        id: `${event.source_user_id}:${event.event_id}`,
        startsAt,
        durationHours,
        ownerId: event.source_user_id,
        ownerName: event.source_full_name,
        ownerRole,
        isPrimaryCalendar: false,
        status: event.status === "confirmed" ? "approved" : "pending",
        title,
        tone: isDefense ? "violet" : "brand",
        type: isDefense ? "defense" : "consultation",
      } satisfies PortalCalendarEvent;
    })
    .filter((event): event is PortalCalendarEvent => event !== null);
}

function getWeekEventLayouts(weekDays: Date[], weekEvents: CalendarEvent[]) {
  const layouts = new Map<string, WeekEventLayout>();

  for (const day of weekDays) {
    const dayEvents = weekEvents
      .filter((event) => isSameDay(day, event.startsAt))
      .sort((left, right) => {
        const delta = left.startsAt.getTime() - right.startsAt.getTime();
        if (delta !== 0) {
          return delta;
        }

        const durationDelta = right.durationHours - left.durationHours;
        if (durationDelta !== 0) {
          return durationDelta;
        }

        return left.ownerName.localeCompare(right.ownerName);
      });

    for (const event of dayEvents) {
      const overlappingEvents = dayEvents.filter((candidate) =>
        eventsOverlap(event, candidate),
      );
      const distinctDurations = [
        ...new Set(
          overlappingEvents.map((candidate) => candidate.durationHours),
        ),
      ].sort((left, right) => right - left);

      layouts.set(event.id, {
        stackOrder: distinctDurations.indexOf(event.durationHours) + 1,
      });
    }
  }

  return layouts;
}

function getWeekSlotIndex(date: Date, startMinutes: number, slotCount: number) {
  const slotOffset = date.getHours() * 60 + date.getMinutes() - startMinutes;

  if (slotOffset < 0 || slotOffset >= slotCount * 30) {
    return -1;
  }

  return Math.floor(slotOffset / 30);
}

function getEventStartMinutes(event: CalendarEvent) {
  return event.startsAt.getHours() * 60 + event.startsAt.getMinutes();
}

function getEventEndMinutes(event: CalendarEvent) {
  return getEventStartMinutes(event) + event.durationHours * 60;
}

function roundDownToHalfHour(minutes: number) {
  return Math.floor(minutes / 30) * 30;
}

function roundUpToHalfHour(minutes: number) {
  return Math.ceil(minutes / 30) * 30;
}

function isAllDayEvent(event: CalendarEvent) {
  return getEventStartMinutes(event) === 0 && event.durationHours >= 23.5;
}

function buildSlotDate(
  day: Date,
  slot: {
    hour: number;
    minute: number;
  },
) {
  return new Date(
    day.getFullYear(),
    day.getMonth(),
    day.getDate(),
    slot.hour,
    slot.minute,
  );
}

function formatAvailabilityTimeRange(start: string, end: string) {
  return `${timeFormatter.format(new Date(start))} - ${timeFormatter.format(
    new Date(end),
  )}`;
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

const requestTimePeriodOptions: Array<{ value: TimePeriod; label: string }> = [
  { value: "morning", label: "Morning" },
  { value: "afternoon", label: "Afternoon" },
  { value: "all-day", label: "All Day" },
];

function isTimePeriodMatch(dateTime: string, period: TimePeriod) {
  if (period === "all-day") {
    return true;
  }

  const hour = new Date(dateTime).getHours();
  return period === "morning" ? hour < 12 : hour >= 12;
}

function isDefined<T>(value: T | null | undefined): value is T {
  return value != null;
}

function intervalsOverlap(
  leftStart: Date,
  leftEnd: Date,
  rightStart: Date,
  rightEnd: Date,
) {
  return leftStart < rightEnd && leftEnd > rightStart;
}

function pickSuggestedAvailabilitySlot(
  slots: AvailabilitySlot[],
  suggestedStart: Date,
  suggestedEnd: Date,
) {
  const exactMatch =
    slots.find(
      (slot) =>
        new Date(slot.slot_start).getTime() === suggestedStart.getTime() &&
        new Date(slot.slot_end).getTime() === suggestedEnd.getTime(),
    ) ?? null;

  if (exactMatch) {
    return exactMatch;
  }

  const overlappingSlots = slots
    .filter((slot) =>
      intervalsOverlap(
        new Date(slot.slot_start),
        new Date(slot.slot_end),
        suggestedStart,
        suggestedEnd,
      ),
    )
    .sort(
      (left, right) =>
        Math.abs(
          new Date(left.slot_start).getTime() - suggestedStart.getTime(),
        ) -
        Math.abs(
          new Date(right.slot_start).getTime() - suggestedStart.getTime(),
        ),
    );

  if (overlappingSlots.length > 0) {
    return overlappingSlots[0];
  }

  return (
    slots.find(
      (slot) => new Date(slot.slot_start).getTime() >= suggestedStart.getTime(),
    ) ??
    slots[0] ??
    null
  );
}

function buildWeekSlotKey(dayIndex: number, slotIndex: number) {
  return `${dayIndex}-${slotIndex}`;
}

function getSlotBounds(startSlotIndex: number, endSlotIndex: number) {
  return [
    Math.min(startSlotIndex, endSlotIndex),
    Math.max(startSlotIndex, endSlotIndex),
  ] as const;
}

function isWeekSlotRangeOpen(
  dayIndex: number,
  startSlotIndex: number,
  endSlotIndex: number,
  occupiedSlots: Set<string>,
) {
  const [start, end] = getSlotBounds(startSlotIndex, endSlotIndex);

  for (let slotIndex = start; slotIndex <= end; slotIndex += 1) {
    if (occupiedSlots.has(buildWeekSlotKey(dayIndex, slotIndex))) {
      return false;
    }
  }

  return true;
}

function findReachableWeekSlotIndex(
  dayIndex: number,
  startSlotIndex: number,
  targetSlotIndex: number,
  occupiedSlots: Set<string>,
) {
  let reachableSlotIndex = startSlotIndex;
  const step = targetSlotIndex >= startSlotIndex ? 1 : -1;

  for (
    let slotIndex = startSlotIndex + step;
    step > 0 ? slotIndex <= targetSlotIndex : slotIndex >= targetSlotIndex;
    slotIndex += step
  ) {
    if (occupiedSlots.has(buildWeekSlotKey(dayIndex, slotIndex))) {
      break;
    }

    reachableSlotIndex = slotIndex;
  }

  return reachableSlotIndex;
}

export function PortalCalendarView({
  portalRole = "student",
  primaryCalendarLabel = "My Calendar",
  primaryCalendarOwnerId = "self",
  events = sampleEvents,
}: {
  portalRole?: CalendarPortalRole;
  primaryCalendarLabel?: string;
  primaryCalendarOwnerId?: string;
  events?: PortalCalendarEvent[];
}) {
  const [view, setView] = useState<CalendarView>("month");
  const [focusDate, setFocusDate] = useState(() => getInitialFocusDate(events));
  const [requestDraft, setRequestDraft] = useState<RequestDraft | null>(null);
  const [selectedWeekEvent, setSelectedWeekEvent] =
    useState<CalendarEvent | null>(null);
  const [overlayDialogOpen, setOverlayDialogOpen] = useState(false);
  const [overlaySearch, setOverlaySearch] = useState("");
  const [selectedOverlayCalendars, setSelectedOverlayCalendars] = useState<
    CalendarOverlaySelection[]
  >([]);
  const [hiddenWeekCalendarIds, setHiddenWeekCalendarIds] = useState<string[]>(
    [],
  );
  const overlayEnabled = portalRole === "student";
  const overlaySourcesQuery = useCalendarOverlaySources(overlayEnabled);
  const overlayEventsQuery = useCalendarOverlayEvents(
    selectedOverlayCalendars.map((calendar) => calendar.userId),
    undefined,
    overlayEnabled,
  );
  const overlayPortalEvents = useMemo(
    () => buildOverlayCalendarPortalEvents(overlayEventsQuery.data ?? []),
    [overlayEventsQuery.data],
  );
  const overlayToneOwnerIds = useMemo(
    () =>
      selectedOverlayCalendars.length > 0
        ? [
            primaryCalendarOwnerId,
            ...selectedOverlayCalendars.map((calendar) => calendar.userId),
          ]
        : [],
    [primaryCalendarOwnerId, selectedOverlayCalendars],
  );
  const mergedPortalEvents = useMemo(
    () => [...events, ...overlayPortalEvents],
    [events, overlayPortalEvents],
  );
  const calendarEvents = useMemo<CalendarEvent[]>(
    () =>
      mergedPortalEvents
        .map((event) => {
          const startsAt = parsePortalEventDate(event.startsAt);

          if (!startsAt) {
            return null;
          }

          return {
            ...event,
            startsAt,
            isPrimaryCalendar: event.isPrimaryCalendar ?? false,
            tone: mapOverlaySourceToEventTone(
              event.ownerId,
              overlayToneOwnerIds,
              event.tone,
            ),
          };
        })
        .filter((event): event is CalendarEvent => event !== null),
    [mergedPortalEvents, overlayToneOwnerIds],
  );
  const selectedCalendarToneMap = useMemo(() => {
    const baseEntries = overlayToneOwnerIds.map(
      (ownerId, index) =>
        [
          ownerId,
          overlayTonePalette[index % overlayTonePalette.length],
        ] as const,
    );
    const eventEntries = calendarEvents.map(
      (event) => [event.ownerId, event.tone] as const,
    );
    const entries = baseEntries.length > 0 ? baseEntries : eventEntries;
    return new Map<string, CalendarEventTone>(entries);
  }, [calendarEvents, overlayToneOwnerIds]);
  const filteredOverlaySources = useMemo(() => {
    const search = overlaySearch.trim().toLowerCase();
    const sources = overlaySourcesQuery.data ?? [];

    return sources.filter((source) => {
      if (
        selectedOverlayCalendars.some((item) => item.userId === source.user_id)
      ) {
        return false;
      }

      if (!search) {
        return true;
      }

      return [source.full_name, source.role_name, source.google_email]
        .join(" ")
        .toLowerCase()
        .includes(search);
    });
  }, [overlaySearch, overlaySourcesQuery.data, selectedOverlayCalendars]);
  const weekVisibilityOptions = useMemo<CalendarVisibilityOption[]>(
    () => [
      {
        userId: primaryCalendarOwnerId,
        fullName: primaryCalendarLabel,
        roleLabel: getRoleLabel(
          portalRole === "adviser" ? "adviser" : "student",
        ),
      },
      ...selectedOverlayCalendars.map((calendar) => ({
        userId: calendar.userId,
        fullName: calendar.fullName,
        roleLabel:
          calendar.roleName.trim().toLowerCase() === "adviser"
            ? "Adviser"
            : calendar.roleName.trim().toLowerCase() === "admin"
              ? "Admin"
              : "Student",
      })),
    ],
    [
      portalRole,
      primaryCalendarLabel,
      primaryCalendarOwnerId,
      selectedOverlayCalendars,
    ],
  );
  const availableWeekCalendarIds = useMemo(
    () => new Set(weekVisibilityOptions.map((option) => option.userId)),
    [weekVisibilityOptions],
  );
  const effectiveHiddenWeekCalendarIds = useMemo(
    () =>
      hiddenWeekCalendarIds.filter((userId) =>
        availableWeekCalendarIds.has(userId),
      ),
    [availableWeekCalendarIds, hiddenWeekCalendarIds],
  );
  const visibleWeekCalendarIds = useMemo(
    () =>
      new Set(
        weekVisibilityOptions
          .filter(
            (option) => !effectiveHiddenWeekCalendarIds.includes(option.userId),
          )
          .map((option) => option.userId),
      ),
    [effectiveHiddenWeekCalendarIds, weekVisibilityOptions],
  );

  const monthCells = getMonthCells(focusDate);
  const monthEvents = calendarEvents
    .filter((event) => isSameMonth(event.startsAt, focusDate))
    .sort((left, right) => left.startsAt.getTime() - right.startsAt.getTime());
  const monthEventMap = new Map<string, CalendarEvent[]>();

  for (const event of monthEvents) {
    const key = getEventDayKey(event.startsAt);
    const eventsForDay = monthEventMap.get(key) ?? [];
    eventsForDay.push(event);
    monthEventMap.set(key, eventsForDay);
  }

  const weekStart = startOfWeek(focusDate);
  const weekDays = Array.from({ length: 7 }, (_, index) =>
    addDays(weekStart, index),
  );
  const allWeekEvents = getWeekEvents(focusDate, calendarEvents);
  const weekEvents = allWeekEvents.filter((event) =>
    visibleWeekCalendarIds.has(event.ownerId),
  );
  const focusedDayEvents =
    monthEventMap.get(getEventDayKey(startOfDay(focusDate))) ?? [];
  const approvedCount = monthEvents.filter(
    (event) => event.status === "approved",
  ).length;
  const pendingCount = monthEvents.filter(
    (event) => event.status === "pending",
  ).length;
  const canCreateRequests = portalRole === "student";
  const quickRequestSuggestedAdviserId = useMemo(() => {
    const adviserCalendarIds = selectedOverlayCalendars
      .filter(
        (calendar) => calendar.roleName.trim().toLowerCase() === "adviser",
      )
      .map((calendar) => calendar.userId)
      .filter((userId) => visibleWeekCalendarIds.has(userId));

    return adviserCalendarIds.length === 1 ? adviserCalendarIds[0] : "";
  }, [selectedOverlayCalendars, visibleWeekCalendarIds]);

  function handleAddOverlayCalendar(source: GoogleCalendarOverlaySource) {
    setSelectedOverlayCalendars((current) => [
      ...current,
      {
        userId: source.user_id,
        fullName: source.full_name,
        roleName: source.role_name,
      },
    ]);
  }

  function handleRemoveOverlayCalendar(userId: string) {
    setSelectedOverlayCalendars((current) =>
      current.filter((calendar) => calendar.userId !== userId),
    );
  }

  function handleToggleWeekCalendar(userId: string, visible: boolean) {
    setHiddenWeekCalendarIds((current) => {
      if (visible) {
        return current.filter((id) => id !== userId);
      }

      if (current.includes(userId)) {
        return current;
      }

      return [...current, userId];
    });
  }

  function handleNavigate(direction: -1 | 1) {
    if (view === "month") {
      setFocusDate((currentDate) => addMonths(currentDate, direction));
      return;
    }

    setFocusDate((currentDate) => addDays(currentDate, direction * 7));
  }

  return (
    <>
      <section className="flex w-full flex-col gap-6">
        <header className="space-y-2">
          <h1 className="text-[2.35rem] leading-[1.08] font-semibold tracking-[-0.05em] text-content-strong">
            Calendar
          </h1>
          <p className="max-w-3xl text-[1.05rem] leading-8 text-content-muted">
            View and manage your consultation schedule
          </p>
        </header>

        <ViewToggle currentView={view} onChange={setView} />

        {view === "month" ? (
          <>
            <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_22rem]">
              <CalendarShell
                focusDate={focusDate}
                onNavigate={handleNavigate}
                view={view}
              >
                <MonthGrid
                  eventsByDay={monthEventMap}
                  focusDate={focusDate}
                  monthCells={monthCells}
                  onSelectDate={setFocusDate}
                />
              </CalendarShell>

              <MonthDetailsRail
                approvedCount={approvedCount}
                focusedDayEvents={focusedDayEvents}
                focusDate={focusDate}
                overlayCalendars={selectedOverlayCalendars}
                overlayError={overlayEventsQuery.error?.message ?? null}
                overlayEnabled={overlayEnabled}
                pendingCount={pendingCount}
                primaryCalendarLabel={primaryCalendarLabel}
                primaryCalendarOwnerId={primaryCalendarOwnerId}
                onAddCalendar={() => setOverlayDialogOpen(true)}
                onRemoveOverlayCalendar={handleRemoveOverlayCalendar}
                selectedCalendarToneMap={selectedCalendarToneMap}
                totalEvents={monthEvents.length}
              />
            </div>

            <UpcomingEvents events={monthEvents} />
          </>
        ) : (
          <CalendarShell
            focusDate={focusDate}
            footer={
              <CardFooter className="border-card-info bg-card-info px-6 py-4 text-body-sm text-card-info sm:px-7">
                <span className="font-semibold">Tip:</span>
                <span className="ml-1">
                  {canCreateRequests
                    ? "Drag across open 30-minute slots to create a new consultation request."
                    : "Switch weeks to review consultation windows and defense blocks at a glance."}
                </span>
              </CardFooter>
            }
            onNavigate={handleNavigate}
            view={view}
          >
            {overlayEnabled ? (
              <WeekCalendarVisibilityBar
                options={weekVisibilityOptions}
                overlayError={overlayEventsQuery.error?.message ?? null}
                primaryCalendarOwnerId={primaryCalendarOwnerId}
                selectedCalendarToneMap={selectedCalendarToneMap}
                visibleCalendarIds={visibleWeekCalendarIds}
                onAddCalendar={() => setOverlayDialogOpen(true)}
                onToggle={handleToggleWeekCalendar}
              />
            ) : null}

            <WeekGrid
              blockedWeekEvents={allWeekEvents}
              canCreateRequests={canCreateRequests}
              focusDate={focusDate}
              onEventSelect={setSelectedWeekEvent}
              onRequestSlotSelect={(date, endAt) =>
                setRequestDraft({
                  date,
                  endAt,
                })
              }
              weekDays={weekDays}
              weekEvents={weekEvents}
            />
          </CalendarShell>
        )}
      </section>

      {requestDraft ? (
        <CreateRequestModal
          draft={requestDraft}
          initialAdviserId={quickRequestSuggestedAdviserId}
          onClose={() => setRequestDraft(null)}
        />
      ) : null}

      <WeekEventDetailsModal
        event={selectedWeekEvent}
        onOpenChange={(open) => {
          if (!open) {
            setSelectedWeekEvent(null);
          }
        }}
      />

      <AddCalendarOverlayDialog
        calendars={filteredOverlaySources}
        isLoading={overlaySourcesQuery.isLoading}
        open={overlayDialogOpen}
        searchValue={overlaySearch}
        selectedCount={selectedOverlayCalendars.length}
        onOpenChange={setOverlayDialogOpen}
        onSearchChange={setOverlaySearch}
        onSelectCalendar={handleAddOverlayCalendar}
      />
    </>
  );
}

function CalendarShell({
  children,
  focusDate,
  footer,
  onNavigate,
  view,
}: {
  children: React.ReactNode;
  focusDate: Date;
  footer?: React.ReactNode;
  onNavigate: (direction: -1 | 1) => void;
  view: CalendarView;
}) {
  return (
    <Card className="gap-0 rounded-[2rem] border-brand-subtle py-0 shadow-elevated">
      <CardHeader className="flex flex-row items-center justify-between border-b border-surface px-6 py-6 sm:px-7">
        <h2 className="text-subheading">{getTitleForView(view, focusDate)}</h2>
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="icon-sm"
            aria-label={`Previous ${view} view`}
            onClick={() => onNavigate(-1)}
            className="rounded-[0.95rem] border-control bg-surface-card shadow-none"
          >
            <ChevronLeft className="size-4" />
          </Button>
          <Button
            type="button"
            variant="outline"
            size="icon-sm"
            aria-label={`Next ${view} view`}
            onClick={() => onNavigate(1)}
            className="rounded-[0.95rem] border-control bg-surface-card shadow-none"
          >
            <ChevronRight className="size-4" />
          </Button>
        </div>
      </CardHeader>

      <CardContent className="px-6 py-6 sm:px-7">{children}</CardContent>
      {footer ?? null}
    </Card>
  );
}

function ViewToggle({
  currentView,
  onChange,
}: {
  currentView: CalendarView;
  onChange: (view: CalendarView) => void;
}) {
  return (
    <div className="inline-flex w-full max-w-[28rem] rounded-full bg-surface-muted p-1">
      {(["month", "week"] as const).map((view) => {
        const active = currentView === view;

        return (
          <button
            key={view}
            type="button"
            aria-pressed={active}
            onClick={() => onChange(view)}
            className={cn(
              "flex-1 rounded-full px-5 py-3 text-[1rem] font-medium transition-colors",
              active
                ? "bg-surface-card text-content-strong shadow-soft"
                : "text-content-muted hover:text-content-strong",
            )}
          >
            {view === "month" ? "Month View" : "Week View"}
          </button>
        );
      })}
    </div>
  );
}

function CalendarOverlayLegend({
  overlayCalendars,
  onRemove,
  primaryCalendarLabel,
  primaryCalendarOwnerId,
  toneMap,
}: {
  overlayCalendars: CalendarOverlaySelection[];
  onRemove: (userId: string) => void;
  primaryCalendarLabel: string;
  primaryCalendarOwnerId: string;
  toneMap: Map<string, CalendarEventTone>;
}) {
  const hasOverlayCalendars = overlayCalendars.length > 0;

  return (
    <div className="flex w-full flex-wrap items-center gap-2">
      <div className="inline-flex items-center gap-2 rounded-full border border-brand-subtle bg-surface-card px-3 py-1.5 text-body-sm text-content-strong">
        <span
          className={cn(
            "size-2.5 rounded-full",
            getLegendDotClassName(
              toneMap.get(primaryCalendarOwnerId) ?? "brand",
            ),
          )}
        />
        {primaryCalendarLabel}
      </div>

      {overlayCalendars.map((calendar) => (
        <div
          key={calendar.userId}
          className="inline-flex items-center gap-2 rounded-full border border-brand-subtle bg-surface-card px-3 py-1.5 text-body-sm text-content-strong"
        >
          <span
            className={cn(
              "size-2.5 rounded-full",
              getLegendDotClassName(toneMap.get(calendar.userId) ?? "violet"),
            )}
          />
          <span className="truncate">{calendar.fullName}</span>
          <button
            type="button"
            aria-label={`Remove ${calendar.fullName} calendar`}
            onClick={() => onRemove(calendar.userId)}
            className="rounded-full p-0.5 text-content-muted transition-colors hover:bg-surface-muted-soft hover:text-content-strong"
          >
            <X className="size-3.5" />
          </button>
        </div>
      ))}

      {hasOverlayCalendars ? (
        <span className="text-body-sm text-content-muted">
          {overlayCalendars.length + 1} calendars shown
        </span>
      ) : null}
    </div>
  );
}

function CalendarOverlayRailCard({
  overlayCalendars,
  overlayError,
  primaryCalendarLabel,
  primaryCalendarOwnerId,
  selectedCalendarToneMap,
  onAddCalendar,
  onRemoveOverlayCalendar,
}: {
  overlayCalendars: CalendarOverlaySelection[];
  overlayError: string | null;
  primaryCalendarLabel: string;
  primaryCalendarOwnerId: string;
  selectedCalendarToneMap: Map<string, CalendarEventTone>;
  onAddCalendar: () => void;
  onRemoveOverlayCalendar: (userId: string) => void;
}) {
  return (
    <Card className="gap-0 rounded-[2rem] border-brand-subtle py-0 shadow-elevated">
      <CardHeader className="border-b border-surface px-5 py-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-section-title">Calendar Layers</h2>
            <p className="mt-1 text-body-sm text-content-muted">
              Compare adviser and student schedules in one calendar.
            </p>
          </div>

          <Button
            type="button"
            variant="outline"
            className="h-10 rounded-[0.95rem] border-brand-subtle bg-surface-card px-3"
            onClick={onAddCalendar}
          >
            <Plus data-icon="inline-start" className="size-4" />
            Add
          </Button>
        </div>
      </CardHeader>

      <CardContent className="space-y-4 px-5 py-5">
        <CalendarOverlayLegend
          overlayCalendars={overlayCalendars}
          onRemove={onRemoveOverlayCalendar}
          primaryCalendarLabel={primaryCalendarLabel}
          primaryCalendarOwnerId={primaryCalendarOwnerId}
          toneMap={selectedCalendarToneMap}
        />

        <div className="rounded-[1rem] border border-surface bg-surface-muted-soft px-4 py-3 text-body-sm text-content-muted">
          {overlayCalendars.length > 0
            ? `${overlayCalendars.length + 1} calendars are currently layered in this view.`
            : "Only your calendar is currently shown."}
        </div>

        {overlayError ? (
          <div className="rounded-[1rem] border border-destructive/20 bg-destructive/10 px-4 py-3 text-body-sm text-destructive">
            {overlayError}
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}

function WeekCalendarVisibilityBar({
  options,
  overlayError,
  primaryCalendarOwnerId,
  selectedCalendarToneMap,
  visibleCalendarIds,
  onAddCalendar,
  onToggle,
}: {
  options: CalendarVisibilityOption[];
  overlayError: string | null;
  primaryCalendarOwnerId: string;
  selectedCalendarToneMap: Map<string, CalendarEventTone>;
  visibleCalendarIds: Set<string>;
  onAddCalendar: () => void;
  onToggle: (userId: string, visible: boolean) => void;
}) {
  return (
    <div className="mb-5 rounded-[1.35rem] border border-surface bg-surface-muted-soft px-4 py-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex flex-col gap-1">
          <div className="text-[0.82rem] font-semibold tracking-[0.04em] text-content-muted uppercase">
            Show In Week View
          </div>
          <p className="text-body-sm text-content-muted">
            Choose which calendars stay visible while keeping overlapping events
            side by side.
          </p>
        </div>

        <Button
          type="button"
          variant="outline"
          className="h-10 rounded-[0.95rem] border-brand-subtle bg-surface-card px-3"
          onClick={onAddCalendar}
        >
          <Plus data-icon="inline-start" className="size-4" />
          Add Calendar
        </Button>
      </div>

      <div className="mt-4 flex flex-wrap gap-3">
        {options.map((option) => {
          const visible = visibleCalendarIds.has(option.userId);
          const tone =
            selectedCalendarToneMap.get(option.userId) ??
            (option.userId === primaryCalendarOwnerId ? "brand" : "violet");

          return (
            <label
              key={option.userId}
              className={cn(
                "flex min-w-[13rem] cursor-pointer items-start gap-3 rounded-[1rem] border px-3 py-3 transition-colors",
                visible
                  ? "border-brand-subtle bg-surface-card"
                  : "border-surface bg-surface-card/65",
              )}
            >
              <Checkbox
                checked={visible}
                onCheckedChange={(value) =>
                  onToggle(option.userId, Boolean(value))
                }
                className="mt-0.5"
              />

              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span
                    className={cn(
                      "size-2.5 shrink-0 rounded-full",
                      getLegendDotClassName(tone),
                    )}
                  />
                  <span className="truncate text-body font-medium text-content-strong">
                    {option.fullName}
                  </span>
                </div>
                <div className="mt-1 text-body-sm text-content-muted">
                  {option.roleLabel}
                </div>
              </div>
            </label>
          );
        })}
      </div>

      {overlayError ? (
        <div className="mt-4 rounded-[1rem] border border-destructive/20 bg-destructive/10 px-4 py-3 text-body-sm text-destructive">
          {overlayError}
        </div>
      ) : null}
    </div>
  );
}

function AddCalendarOverlayDialog({
  calendars,
  isLoading,
  open,
  searchValue,
  selectedCount,
  onOpenChange,
  onSearchChange,
  onSelectCalendar,
}: {
  calendars: GoogleCalendarOverlaySource[];
  isLoading: boolean;
  open: boolean;
  searchValue: string;
  selectedCount: number;
  onOpenChange: (open: boolean) => void;
  onSearchChange: (value: string) => void;
  onSelectCalendar: (source: GoogleCalendarOverlaySource) => void;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl border border-brand-subtle bg-surface-card">
        <DialogHeader className="border-b border-surface pb-5">
          <DialogTitle className="flex items-center gap-2">
            <Layers3 className="size-5" />
            Add Calendar Overlay
          </DialogTitle>
          <DialogDescription className="text-content-muted">
            Choose other connected student or adviser calendars to compare in
            the same month and week view.
          </DialogDescription>
        </DialogHeader>

        <DialogBody className="space-y-5 py-6">
          <SearchInput
            value={searchValue}
            onChange={(event) => onSearchChange(event.target.value)}
            placeholder="Search by name, role, or email"
            className="h-11 rounded-[0.95rem]"
          />

          <div className="rounded-[1rem] border border-surface bg-surface-muted-soft px-4 py-3 text-body-sm text-content-muted">
            {selectedCount > 0
              ? `${selectedCount} additional calendars selected.`
              : "No additional calendars selected yet."}
          </div>

          <div className="max-h-[24rem] space-y-3 overflow-y-auto pr-1">
            {isLoading ? (
              <div className="rounded-[1rem] border border-surface bg-surface-muted-soft px-4 py-4 text-body-sm text-content-muted">
                Loading connected calendars...
              </div>
            ) : calendars.length > 0 ? (
              calendars.map((calendar) => (
                <button
                  key={calendar.user_id}
                  type="button"
                  onClick={() => onSelectCalendar(calendar)}
                  className="flex w-full items-start gap-3 rounded-[1rem] border border-surface bg-surface-card px-4 py-4 text-left transition-colors hover:border-brand-subtle hover:bg-surface-muted-soft"
                >
                  <Checkbox checked={false} aria-hidden />
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-label">{calendar.full_name}</span>
                      <Badge
                        variant={
                          calendar.role_name === "adviser"
                            ? "info"
                            : "secondary"
                        }
                        className="capitalize"
                      >
                        {calendar.role_name}
                      </Badge>
                    </div>
                    <p className="mt-1 text-body-sm text-content-muted">
                      {calendar.google_email}
                    </p>
                  </div>
                </button>
              ))
            ) : (
              <div className="rounded-[1rem] border border-surface bg-surface-muted-soft px-4 py-4 text-body-sm text-content-muted">
                No connected calendars match your search.
              </div>
            )}
          </div>
        </DialogBody>
      </DialogContent>
    </Dialog>
  );
}

function MonthGrid({
  eventsByDay,
  focusDate,
  monthCells,
  onSelectDate,
}: {
  eventsByDay: Map<string, CalendarEvent[]>;
  focusDate: Date;
  monthCells: CalendarDayCell[];
  onSelectDate: (date: Date) => void;
}) {
  return (
    <div className="space-y-4 overflow-x-auto">
      <div className="min-w-[64rem] xl:min-w-0">
        <div className="mb-4 grid grid-cols-7 gap-3 px-1 text-center text-[1.05rem] font-medium text-content-muted">
          {weekdayLabels.map((label) => (
            <div key={label} className="py-2">
              {label}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-2">
          {monthCells.map((cell) => {
            const events = eventsByDay.get(getEventDayKey(cell.date)) ?? [];
            const isSelected = isSameDay(cell.date, focusDate);

            return (
              <button
                key={cell.date.toISOString()}
                type="button"
                onClick={() => onSelectDate(cell.date)}
                className={cn(
                  "flex min-h-[9.4rem] w-full flex-col items-start rounded-[1rem] border border-surface p-2.5 text-left transition-colors",
                  cell.inCurrentMonth
                    ? "bg-surface-card hover:border-brand-subtle hover:bg-surface-muted-soft"
                    : "bg-surface-muted-soft/45 text-content-muted hover:bg-surface-muted-soft/55",
                  !cell.inCurrentMonth &&
                    !isSelected &&
                    "border-surface/70 opacity-60",
                  events.length > 0 && "bg-surface-muted-soft",
                  isSelected && "border-primary bg-primary-tint/35",
                )}
              >
                <div
                  className={cn(
                    "text-[1.05rem] font-medium",
                    isSelected && "text-brand-strong",
                    !isSelected &&
                      (cell.inCurrentMonth
                        ? "text-content-strong"
                        : "text-content-muted"),
                  )}
                >
                  {cell.date.getDate()}
                </div>

                {events.length > 0 ? (
                  <div className="mt-3 w-full space-y-2">
                    {events.map((event) => (
                      <div
                        key={event.id}
                        className={cn(
                          "truncate rounded-md px-2 py-1 text-[0.78rem] font-medium",
                          eventToneClassNames[event.tone].monthBar,
                        )}
                      >
                        {events.length > 1
                          ? `${getOwnerInitials(event.ownerName)} · ${timeFormatter.format(event.startsAt)}`
                          : timeFormatter.format(event.startsAt)}
                      </div>
                    ))}
                  </div>
                ) : null}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function WeekGrid({
  blockedWeekEvents,
  canCreateRequests,
  focusDate,
  onEventSelect,
  onRequestSlotSelect,
  weekDays,
  weekEvents,
}: {
  blockedWeekEvents: CalendarEvent[];
  canCreateRequests: boolean;
  focusDate: Date;
  onEventSelect: (event: CalendarEvent) => void;
  onRequestSlotSelect: (date: Date, endAt: Date) => void;
  weekDays: Date[];
  weekEvents: CalendarEvent[];
}) {
  const [dragSelection, setDragSelection] = useState<DragSelection | null>(
    null,
  );
  const dragSelectionRef = useRef<DragSelection | null>(null);
  const allDayWeekEvents = useMemo(
    () => weekEvents.filter((event) => isAllDayEvent(event)),
    [weekEvents],
  );
  const timedWeekEvents = useMemo(
    () =>
      weekEvents
        .filter((event) => !isAllDayEvent(event))
        .sort((left, right) => {
          const startDelta = left.startsAt.getTime() - right.startsAt.getTime();
          if (startDelta !== 0) {
            return startDelta;
          }

          const durationDelta = right.durationHours - left.durationHours;
          if (durationDelta !== 0) {
            return durationDelta;
          }

          return left.ownerName.localeCompare(right.ownerName);
        }),
    [weekEvents],
  );
  const allDayBlockedWeekEvents = useMemo(
    () => blockedWeekEvents.filter((event) => isAllDayEvent(event)),
    [blockedWeekEvents],
  );
  const timedBlockedWeekEvents = useMemo(
    () => blockedWeekEvents.filter((event) => !isAllDayEvent(event)),
    [blockedWeekEvents],
  );
  const { displayStartMinutes, weekTimeSlots } = useMemo(() => {
    const earliestEventMinutes = timedWeekEvents.length
      ? Math.min(...timedWeekEvents.map((event) => getEventStartMinutes(event)))
      : DEFAULT_WEEK_START_MINUTES;
    const latestEventMinutes = timedWeekEvents.length
      ? Math.max(...timedWeekEvents.map((event) => getEventEndMinutes(event)))
      : DEFAULT_WEEK_END_MINUTES;
    const startMinutes = Math.max(
      0,
      Math.min(
        DEFAULT_WEEK_START_MINUTES,
        roundDownToHalfHour(earliestEventMinutes),
      ),
    );
    const endMinutes = Math.min(
      24 * 60,
      Math.max(DEFAULT_WEEK_END_MINUTES, roundUpToHalfHour(latestEventMinutes)),
    );

    return {
      displayStartMinutes: startMinutes,
      weekTimeSlots: buildWeekTimeSlots(startMinutes, endMinutes),
    };
  }, [timedWeekEvents]);
  const weekEventLayouts = useMemo(
    () => getWeekEventLayouts(weekDays, timedWeekEvents),
    [timedWeekEvents, weekDays],
  );
  const gridStyle = {
    gridTemplateColumns: "9rem repeat(7, minmax(8.5rem, 1fr))",
    gridTemplateRows: `3.9rem 3.25rem repeat(${weekTimeSlots.length}, 1.875rem)`,
  } as const;
  const occupiedSlots = useMemo(() => {
    const slots = new Set<string>();

    for (const event of allDayBlockedWeekEvents) {
      const dayIndex = weekDays.findIndex((day) =>
        isSameDay(day, event.startsAt),
      );

      if (dayIndex === -1) {
        continue;
      }

      for (
        let slotIndex = 0;
        slotIndex < weekTimeSlots.length;
        slotIndex += 1
      ) {
        slots.add(`${dayIndex}-${slotIndex}`);
      }
    }

    for (const event of timedBlockedWeekEvents) {
      const dayIndex = weekDays.findIndex((day) =>
        isSameDay(day, event.startsAt),
      );
      const startSlotIndex = getWeekSlotIndex(
        event.startsAt,
        displayStartMinutes,
        weekTimeSlots.length,
      );

      if (dayIndex === -1 || startSlotIndex === -1) {
        continue;
      }

      const slotSpan = Math.max(1, Math.ceil(event.durationHours * 2));

      for (let offset = 0; offset < slotSpan; offset += 1) {
        slots.add(`${dayIndex}-${startSlotIndex + offset}`);
      }
    }

    return slots;
  }, [
    allDayBlockedWeekEvents,
    displayStartMinutes,
    timedBlockedWeekEvents,
    weekDays,
    weekTimeSlots.length,
  ]);

  useEffect(() => {
    dragSelectionRef.current = dragSelection;
  }, [dragSelection]);

  const finalizeDragSelection = useCallback(() => {
    const currentSelection = dragSelectionRef.current;

    if (!currentSelection) {
      return;
    }

    const [startSlotIndex, endSlotIndex] = getSlotBounds(
      currentSelection.startSlotIndex,
      currentSelection.endSlotIndex,
    );
    const selectedDay = weekDays[currentSelection.dayIndex];

    if (
      !isWeekSlotRangeOpen(
        currentSelection.dayIndex,
        startSlotIndex,
        endSlotIndex,
        occupiedSlots,
      )
    ) {
      setDragSelection(null);
      return;
    }

    const startAt = buildSlotDate(selectedDay, weekTimeSlots[startSlotIndex]);
    const endAt = addMinutes(
      buildSlotDate(selectedDay, weekTimeSlots[endSlotIndex]),
      30,
    );

    setDragSelection(null);
    onRequestSlotSelect(startAt, endAt);
  }, [occupiedSlots, onRequestSlotSelect, weekDays, weekTimeSlots]);

  useEffect(() => {
    if (!canCreateRequests) {
      return;
    }

    const handlePointerUp = () => {
      if (dragSelectionRef.current) {
        finalizeDragSelection();
      }
    };

    window.addEventListener("mouseup", handlePointerUp);

    return () => {
      window.removeEventListener("mouseup", handlePointerUp);
    };
  }, [canCreateRequests, finalizeDragSelection]);

  function handleSlotMouseDown(dayIndex: number, slotIndex: number) {
    if (
      !canCreateRequests ||
      occupiedSlots.has(buildWeekSlotKey(dayIndex, slotIndex))
    ) {
      return;
    }

    setDragSelection({
      dayIndex,
      startSlotIndex: slotIndex,
      endSlotIndex: slotIndex,
    });
  }

  function handleSlotMouseEnter(dayIndex: number, slotIndex: number) {
    setDragSelection((currentSelection) => {
      if (!currentSelection || currentSelection.dayIndex !== dayIndex) {
        return currentSelection;
      }

      const reachableSlotIndex = findReachableWeekSlotIndex(
        dayIndex,
        currentSelection.startSlotIndex,
        slotIndex,
        occupiedSlots,
      );

      return {
        ...currentSelection,
        endSlotIndex: reachableSlotIndex,
      };
    });
  }

  function isSlotSelected(dayIndex: number, slotIndex: number) {
    if (!dragSelection || dragSelection.dayIndex !== dayIndex) {
      return false;
    }

    const [startSlotIndex, endSlotIndex] = getSlotBounds(
      dragSelection.startSlotIndex,
      dragSelection.endSlotIndex,
    );

    return slotIndex >= startSlotIndex && slotIndex <= endSlotIndex;
  }

  return (
    <div className="overflow-x-auto">
      <div className="min-w-[73rem]">
        <div
          className="grid border-l border-t border-surface"
          style={gridStyle}
        >
          <div
            className="border-r border-b border-surface bg-surface-card"
            style={{
              gridColumnStart: 1,
              gridRowStart: 1,
            }}
          />

          <div
            className="flex items-center justify-end border-r border-b border-surface bg-surface-card px-3 text-caption font-medium text-content-muted"
            style={{
              gridColumnStart: 1,
              gridRowStart: 2,
            }}
          >
            All day
          </div>

          {weekDays.map((day, dayIndex) => {
            const isFocusedDay = isSameDay(day, focusDate);
            const dayAllDayEvents = allDayWeekEvents.filter((event) =>
              isSameDay(day, event.startsAt),
            );

            return (
              <div key={day.toISOString()} className="contents">
                <div
                  className={cn(
                    "flex flex-col items-center justify-center border-r border-b border-surface bg-surface-card px-2 py-2",
                    isFocusedDay && "bg-primary-tint/55",
                  )}
                  style={{
                    gridColumnStart: dayIndex + 2,
                    gridRowStart: 1,
                  }}
                >
                  <div className="text-caption text-content-muted">
                    {weekdayLabels[day.getDay()]}
                  </div>
                  <div
                    className={cn(
                      "mt-1 text-[1.75rem] leading-none font-semibold",
                      isFocusedDay
                        ? "text-brand-strong"
                        : "text-content-strong",
                    )}
                  >
                    {day.getDate()}
                  </div>
                </div>

                <div
                  className={cn(
                    "flex min-h-[3.25rem] flex-col justify-center gap-1 border-r border-b border-surface px-2 py-1.5",
                    isFocusedDay ? "bg-primary-tint/25" : "bg-surface-card",
                  )}
                  style={{
                    gridColumnStart: dayIndex + 2,
                    gridRowStart: 2,
                  }}
                >
                  {dayAllDayEvents.length > 0 ? (
                    dayAllDayEvents.map((event) => (
                      <button
                        key={event.id}
                        type="button"
                        onClick={() => onEventSelect(event)}
                        className={cn(
                          "truncate rounded-[0.6rem] px-2 py-1 text-left text-[0.78rem] font-medium transition-colors hover:bg-primary-tint/65",
                          eventToneClassNames[event.tone].monthBar,
                        )}
                      >
                        {dayAllDayEvents.length > 1
                          ? `${getOwnerInitials(event.ownerName)} · ${event.title}`
                          : event.title}
                      </button>
                    ))
                  ) : (
                    <span className="text-[0.75rem] text-content-muted/70">
                      &nbsp;
                    </span>
                  )}
                </div>
              </div>
            );
          })}

          {weekTimeSlots.flatMap((slot, slotIndex) => {
            return [
              <div
                key={`label-${slot.hour}-${slot.minute}`}
                className={cn(
                  "flex items-start justify-end border-r border-b border-surface px-3 pt-2 text-caption text-content-muted",
                  slot.minute === 0 && "border-b-transparent",
                )}
                style={{
                  gridColumnStart: 1,
                  gridRowStart: slotIndex + 3,
                }}
              >
                {slot.minute === 0
                  ? timeFormatter.format(
                      new Date(2026, 0, 1, slot.hour, slot.minute),
                    )
                  : null}
              </div>,
              ...weekDays.map((day, dayIndex) => {
                const occupied = occupiedSlots.has(
                  buildWeekSlotKey(dayIndex, slotIndex),
                );
                const selected = isSlotSelected(dayIndex, slotIndex);

                return (
                  <button
                    key={`${day.toISOString()}-${slot.hour}-${slot.minute}`}
                    type="button"
                    disabled={!canCreateRequests || occupied}
                    aria-label={
                      canCreateRequests && !occupied
                        ? `Create consultation request on ${day.toDateString()} at ${timeFormatter.format(
                            buildSlotDate(day, slot),
                          )}`
                        : undefined
                    }
                    onMouseDown={(event) => {
                      event.preventDefault();
                      handleSlotMouseDown(dayIndex, slotIndex);
                    }}
                    onMouseEnter={() =>
                      handleSlotMouseEnter(dayIndex, slotIndex)
                    }
                    className={cn(
                      "border-r border-b border-surface bg-surface-card transition-colors select-none",
                      slot.minute === 0 && "border-b-transparent",
                      canCreateRequests &&
                        !occupied &&
                        "cursor-crosshair hover:bg-primary-tint/20 focus-visible:outline-none",
                      selected &&
                        "relative z-10 bg-primary/18 shadow-[inset_0_0_0_2px_color-mix(in_srgb,var(--primary)_60%,transparent)]",
                    )}
                    style={{
                      gridColumnStart: dayIndex + 2,
                      gridRowStart: slotIndex + 3,
                    }}
                  />
                );
              }),
            ];
          })}

          {timedWeekEvents.map((event) => {
            const dayIndex = weekDays.findIndex((day) =>
              isSameDay(day, event.startsAt),
            );
            const startRow = getWeekSlotIndex(
              event.startsAt,
              displayStartMinutes,
              weekTimeSlots.length,
            );

            if (dayIndex === -1 || startRow === -1) {
              return null;
            }

            const isCompactEvent = event.durationHours <= 1;
            const layout = weekEventLayouts.get(event.id) ?? {
              stackOrder: 1,
            };
            const horizontalInsetRem = 0.4;
            const widthStyle = `calc(100% - ${horizontalInsetRem * 2}rem)`;
            const marginLeftStyle = `${horizontalInsetRem}rem`;

            return (
              <button
                key={event.id}
                type="button"
                onClick={() => onEventSelect(event)}
                title={event.title}
                className={cn(
                  "z-10 my-1 flex h-[calc(100%-0.5rem)] flex-col justify-between overflow-hidden rounded-[0.8rem] px-2.5 py-2 text-left transition-shadow hover:shadow-[0_14px_28px_rgba(45,94,255,0.1)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-offset-2",
                  eventToneClassNames[event.tone].weekBlock,
                )}
                style={{
                  gridColumnStart: dayIndex + 2,
                  gridRow: `${startRow + 3} / span ${Math.max(1, event.durationHours * 2)}`,
                  justifySelf: "start",
                  width: widthStyle,
                  marginLeft: marginLeftStyle,
                  zIndex: 10 + layout.stackOrder,
                }}
              >
                <div className="min-h-0 flex-1 overflow-hidden">
                  <div className="mb-1 truncate text-[0.62rem] leading-[0.78rem] font-semibold tracking-[0.06em] text-content-muted uppercase">
                    {event.ownerName}
                  </div>
                  <div
                    className={cn(
                      "text-content-strong",
                      isCompactEvent
                        ? "line-clamp-2 text-[0.7rem] leading-[0.82rem] font-medium tracking-[-0.01em]"
                        : "line-clamp-2 text-[0.8rem] leading-[0.96rem] font-medium tracking-[-0.01em]",
                    )}
                  >
                    {event.title}
                  </div>
                </div>

                <div
                  className={cn(
                    "mt-1 shrink-0 text-content-muted",
                    isCompactEvent
                      ? "truncate text-[0.62rem] leading-[0.75rem] font-medium"
                      : "text-[0.7rem] leading-[0.85rem] font-medium",
                  )}
                >
                  {isCompactEvent
                    ? getCompactEventTimeRangeLabel(event)
                    : getEventTimeRange(event)}
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function WeekEventDetailsModal({
  event,
  onOpenChange,
}: {
  event: CalendarEvent | null;
  onOpenChange: (open: boolean) => void;
}) {
  return (
    <Dialog open={event !== null} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md border border-brand-subtle bg-surface-card">
        {event ? (
          <>
            <DialogHeader className="border-b border-surface pb-5">
              <DialogTitle>{event.title}</DialogTitle>
              <DialogDescription className="text-content-muted">
                {requestDateFormatter.format(event.startsAt)}
              </DialogDescription>
            </DialogHeader>

            <DialogBody className="space-y-4 py-6">
              <div className="rounded-[1rem] border border-surface bg-surface-muted-soft px-4 py-4">
                <div className="text-[0.82rem] font-semibold tracking-[0.04em] text-content-muted uppercase">
                  Time
                </div>
                <div className="mt-2 text-[1.05rem] font-semibold text-content-strong">
                  {getEventTimeRange(event)}
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div className="rounded-[1rem] border border-surface bg-surface-card px-4 py-4">
                  <div className="text-[0.82rem] font-semibold tracking-[0.04em] text-content-muted uppercase">
                    Calendar
                  </div>
                  <div className="mt-2 text-[0.98rem] font-medium text-content-strong">
                    {event.ownerName}
                  </div>
                </div>

                <div className="rounded-[1rem] border border-surface bg-surface-card px-4 py-4">
                  <div className="text-[0.82rem] font-semibold tracking-[0.04em] text-content-muted uppercase">
                    Type
                  </div>
                  <div className="mt-2 text-[0.98rem] font-medium text-content-strong">
                    {getEventTypeLabel(event.type)}
                  </div>
                </div>

                <div className="rounded-[1rem] border border-surface bg-surface-card px-4 py-4 sm:col-span-2">
                  <div className="text-[0.82rem] font-semibold tracking-[0.04em] text-content-muted uppercase">
                    Status
                  </div>
                  <div className="mt-2 text-[0.98rem] font-medium text-content-strong">
                    {getEventStatusLabel(event.status)}
                  </div>
                </div>
              </div>
            </DialogBody>
          </>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}

function CreateRequestModal({
  draft,
  initialAdviserId,
  onClose,
}: {
  draft: RequestDraft;
  initialAdviserId?: string;
  onClose: () => void;
}) {
  const [requestType, setRequestType] =
    useState<ConsultationRequestType>("consultation");
  const [adviserId, setAdviserId] = useState(initialAdviserId ?? "");
  const [selectedPanelistIds, setSelectedPanelistIds] = useState<string[]>([]);
  const [adviserSearchTerm, setAdviserSearchTerm] = useState("");
  const [panelistSearchTerm, setPanelistSearchTerm] = useState("");
  const [timePeriod, setTimePeriod] = useState<TimePeriod>("all-day");
  const [selectedSlotKey, setSelectedSlotKey] = useState<string | null>(null);
  const [topic, setTopic] = useState("");
  const [description, setDescription] = useState("");
  const [fieldErrors, setFieldErrors] = useState<
    Partial<Record<ConsultationRequestFieldName, string>>
  >({});
  const [submitError, setSubmitError] = useState<string | null>(null);
  const {
    data: advisers = [],
    error: advisersError,
    isLoading: isLoadingAdvisers,
  } = useAdvisers();
  const createScheduleMutation = useCreateSchedule();
  const deferredAdviserSearchTerm = useDeferredValue(adviserSearchTerm);
  const deferredPanelistSearchTerm = useDeferredValue(panelistSearchTerm);
  const selectedDateValue = toDateInputValue(draft.date);
  const suggestedWindowLabel = `${timeFormatter.format(draft.date)} - ${timeFormatter.format(
    draft.endAt,
  )}`;
  const isDefenseRequest = requestType === "defense";
  const selectedAdviser = useMemo(
    () => advisers.find((adviser) => adviser.id === adviserId) ?? null,
    [adviserId, advisers],
  );
  const selectedPanelists = useMemo(
    () =>
      advisers.filter((adviser) => selectedPanelistIds.includes(adviser.id)),
    [advisers, selectedPanelistIds],
  );
  const filteredAdvisers = useMemo(
    () =>
      advisers.filter((adviser) =>
        matchesAdviserSearch(adviser, deferredAdviserSearchTerm),
      ),
    [advisers, deferredAdviserSearchTerm],
  );
  const filteredPanelists = useMemo(
    () =>
      advisers
        .filter((adviser) => adviser.id !== adviserId)
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
        }),
    [adviserId, advisers, deferredPanelistSearchTerm, selectedPanelistIds],
  );
  const availabilityParticipantIds = (
    isDefenseRequest ? [adviserId, ...selectedPanelistIds] : [adviserId]
  ).filter(Boolean);
  const availabilityParticipants = (
    isDefenseRequest
      ? [selectedAdviser, ...selectedPanelists]
      : [selectedAdviser]
  ).filter(isDefined);
  const {
    data: freeSlots = [],
    isLoading: isLoadingSlots,
    error: slotsError,
  } = useFreeSlots(availabilityParticipantIds, selectedDateValue);
  const availableSlots = useMemo(
    () =>
      [...freeSlots]
        .filter((slot) => isTimePeriodMatch(slot.slot_start, timePeriod))
        .sort(
          (left, right) =>
            new Date(left.slot_start).getTime() -
            new Date(right.slot_start).getTime(),
        ),
    [freeSlots, timePeriod],
  );
  const availableSlotCount = availableSlots.length;
  const isDefenseWithPanelists =
    isDefenseRequest && selectedPanelistIds.length > 0;
  const suggestedSlotKeys = useMemo(
    () =>
      new Set(
        availableSlots
          .filter((slot) =>
            intervalsOverlap(
              new Date(slot.slot_start),
              new Date(slot.slot_end),
              draft.date,
              draft.endAt,
            ),
          )
          .map((slot) => `${slot.slot_start}|${slot.slot_end}`),
      ),
    [availableSlots, draft.date, draft.endAt],
  );
  const selectedSlot = useMemo(() => {
    if (!adviserId) {
      return null;
    }

    const manuallySelectedSlot =
      availableSlots.find(
        (slot) => `${slot.slot_start}|${slot.slot_end}` === selectedSlotKey,
      ) ?? null;

    if (manuallySelectedSlot) {
      return manuallySelectedSlot;
    }

    return pickSuggestedAvailabilitySlot(
      availableSlots,
      draft.date,
      draft.endAt,
    );
  }, [adviserId, availableSlots, draft.date, draft.endAt, selectedSlotKey]);
  const selectedSlotStart = selectedSlot?.slot_start ?? null;
  const selectedSlotEnd = selectedSlot?.slot_end ?? null;
  const canSubmit = Boolean(
    adviserId && selectedSlotStart && selectedSlotEnd && topic.trim(),
  );

  function handleScheduleTypeChange(value: ConsultationRequestType) {
    setRequestType(value);
    setSelectedSlotKey(null);
    setFieldErrors((current) => ({
      ...current,
      scheduleType: undefined,
      selectedTimeSlot: undefined,
    }));
    setSubmitError(null);

    if (value !== "defense") {
      setSelectedPanelistIds([]);
      setPanelistSearchTerm("");
    }
  }

  function handleAdviserChange(value: string) {
    setAdviserId(value);
    setSelectedSlotKey(null);
    setFieldErrors((current) => ({
      ...current,
      selectedAdviserId: undefined,
      selectedTimeSlot: undefined,
    }));
    setSubmitError(null);
    setSelectedPanelistIds((current) =>
      current.filter((item) => item !== value),
    );
  }

  function handlePanelistToggle(panelistId: string, checked: boolean) {
    setSelectedSlotKey(null);
    setFieldErrors((current) => ({
      ...current,
      selectedTimeSlot: undefined,
    }));
    setSubmitError(null);
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

    if (!adviserId) {
      nextFieldErrors.selectedAdviserId = "Please choose an adviser.";
    }

    if (!selectedSlotStart || !selectedSlotEnd) {
      nextFieldErrors.selectedTimeSlot =
        "Please choose an available time slot.";
    }

    if (!topic.trim()) {
      nextFieldErrors.topic = "Please enter a topic.";
    }

    if (Object.keys(nextFieldErrors).length > 0) {
      setFieldErrors(nextFieldErrors);
      setSubmitError(null);
      return;
    }

    if (!selectedSlotStart) {
      return;
    }

    setFieldErrors({});
    setSubmitError(null);

    try {
      await createScheduleMutation.mutateAsync({
        adviser_id: adviserId,
        type_id: scheduleTypeIdByValue[requestType],
        topic: topic.trim(),
        scheduled_at: selectedSlotStart,
      });

      setRequestType("consultation");
      setAdviserId("");
      setSelectedPanelistIds([]);
      setAdviserSearchTerm("");
      setPanelistSearchTerm("");
      setTimePeriod("all-day");
      setSelectedSlotKey(null);
      setTopic("");
      setDescription("");
      onClose();
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

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-gray-900/40 px-4 py-8 backdrop-blur-[2px]">
      <div className="flex min-h-full items-start justify-center">
        <div className="flex max-h-[calc(100vh-4rem)] w-full max-w-[32rem] flex-col overflow-hidden rounded-[1.75rem] border border-brand-subtle bg-surface-card shadow-elevated">
          <div className="flex shrink-0 items-start justify-between gap-4 px-6 py-6 sm:px-7">
            <div className="space-y-1.5">
              <h2 className="text-subheading">Create Consultation Request</h2>
              <p className="text-[1rem] leading-7 text-content-muted">
                Schedule a new consultation for the selected time range
              </p>
            </div>
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              className="rounded-full"
              onClick={onClose}
              aria-label="Close create request modal"
            >
              <X className="size-4" />
            </Button>
          </div>

          <div className="space-y-5 overflow-y-auto px-6 pb-6 sm:px-7 sm:pb-7">
            <div className="grid gap-3 rounded-[1.15rem] border border-brand-subtle bg-primary-tint/45 p-4 sm:grid-cols-2">
              <SummaryTile
                icon={CalendarDays}
                label="Date"
                value={requestDateFormatter.format(draft.date)}
              />
              <SummaryTile
                icon={Clock3}
                label="Suggested Window"
                value={suggestedWindowLabel}
              />
            </div>

            <ModalField icon={FileText} label="Consultation Type">
              <Select
                value={requestType ?? undefined}
                onValueChange={(value) =>
                  handleScheduleTypeChange(value as ConsultationRequestType)
                }
              >
                <SelectTrigger className="h-11 rounded-[0.95rem]">
                  <SelectValue placeholder="Select consultation type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="consultation">Consultation</SelectItem>
                  <SelectItem value="defense">Defense</SelectItem>
                </SelectContent>
              </Select>
              <InlineFieldError message={fieldErrors.scheduleType} />
            </ModalField>

            <ModalField icon={UserRound} label="Select Adviser">
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

                <div className="max-h-64 space-y-3 overflow-y-auto pr-1">
                  {isLoadingAdvisers ? (
                    <p className="rounded-[0.9rem] border border-dashed border-surface px-4 py-6 text-center text-body-sm text-content-muted">
                      Loading advisers...
                    </p>
                  ) : filteredAdvisers.length > 0 ? (
                    filteredAdvisers.map((adviser) => {
                      const isSelected = adviser.id === adviserId;

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
                <InlineFieldError message="Unable to load advisers right now." />
              ) : null}
              {!isLoadingAdvisers && advisers.length === 0 ? (
                <InlineFieldError message="No advisers are available right now." />
              ) : null}
              <InlineFieldError message={fieldErrors.selectedAdviserId} />
            </ModalField>

            {isDefenseRequest ? (
              <ModalField icon={UsersRound} label="Select Panelists (Optional)">
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

                    <div className="max-h-64 space-y-3 overflow-y-auto pr-1">
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
              </ModalField>
            ) : null}

            <ModalField icon={Clock3} label="Available Time Slots">
              <div className="space-y-4 rounded-[1rem] border border-surface bg-surface-card p-4 shadow-soft">
                {adviserId ? (
                  <>
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                      <div className="space-y-1">
                        <div className="text-body font-medium text-content-strong">
                          {isLoadingSlots
                            ? "Checking availability..."
                            : `${availableSlotCount} ${
                                availableSlotCount === 1
                                  ? isDefenseWithPanelists
                                    ? "common slot"
                                    : "slot"
                                  : isDefenseWithPanelists
                                    ? "common slots"
                                    : "slots"
                              } available on ${requestDateFormatter.format(draft.date)}`}
                        </div>
                        <p className="text-body-sm text-content-muted">
                          {isDefenseRequest
                            ? "Defense slots must be shared across your selected adviser and panelists."
                            : "Slots already exclude blocked windows, approved schedules, and Google Calendar conflicts."}
                        </p>
                      </div>

                      <div className="inline-flex self-start rounded-full bg-surface-muted p-1">
                        {requestTimePeriodOptions.map((option) => {
                          const active = timePeriod === option.value;

                          return (
                            <button
                              key={option.value}
                              type="button"
                              onClick={() => {
                                setTimePeriod(option.value);
                                setSelectedSlotKey(null);
                                setFieldErrors((current) => ({
                                  ...current,
                                  selectedTimeSlot: undefined,
                                }));
                                setSubmitError(null);
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
                      <div className="flex flex-col gap-2 text-body-sm text-content-muted">
                        <div className="flex items-start gap-2">
                          <Clock3 className="mt-0.5 size-4 shrink-0" />
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

                    {isLoadingSlots ? (
                      <div className="flex items-center justify-center gap-2 rounded-[0.9rem] border border-dashed border-surface px-4 py-8 text-body-sm text-content-muted">
                        <LoaderCircle className="size-4 animate-spin" />
                        Checking availability...
                      </div>
                    ) : slotsError ? (
                      <p className="rounded-[0.9rem] border border-destructive/20 bg-destructive/10 px-4 py-6 text-center text-body-sm text-destructive">
                        Unable to load adviser availability right now. Please
                        try again.
                      </p>
                    ) : availableSlots.length > 0 ? (
                      <div className="grid gap-3 sm:grid-cols-2">
                        {availableSlots.map((slot) => {
                          const isSelected =
                            selectedSlotStart === slot.slot_start &&
                            selectedSlotEnd === slot.slot_end;
                          const matchesSuggestedWindow = suggestedSlotKeys.has(
                            `${slot.slot_start}|${slot.slot_end}`,
                          );

                          return (
                            <button
                              key={slot.id}
                              type="button"
                              onClick={() => {
                                setSelectedSlotKey(
                                  `${slot.slot_start}|${slot.slot_end}`,
                                );
                                setFieldErrors((current) => ({
                                  ...current,
                                  selectedTimeSlot: undefined,
                                }));
                                setSubmitError(null);
                              }}
                              className={cn(
                                "rounded-[1rem] border px-4 py-3 text-left transition-colors",
                                isSelected
                                  ? "border-primary bg-primary-tint/35 shadow-[0_0_0_1px_color-mix(in_srgb,var(--primary)_40%,transparent)]"
                                  : "border-surface bg-emerald-50 text-emerald-900 hover:border-emerald-300 hover:bg-emerald-100",
                              )}
                            >
                              <div className="flex items-start justify-between gap-2">
                                <div className="min-w-0">
                                  <div
                                    className={cn(
                                      "text-[1rem] font-medium",
                                      isSelected
                                        ? "text-brand-strong"
                                        : "text-content-strong",
                                    )}
                                  >
                                    {formatAvailabilityTimeRange(
                                      slot.slot_start,
                                      slot.slot_end,
                                    )}
                                  </div>
                                  <div className="mt-2 flex flex-wrap items-center gap-2 text-body-sm text-content-muted">
                                    <span>
                                      {isSelected ? "Selected" : "Available"}
                                    </span>
                                    {matchesSuggestedWindow ? (
                                      <Badge variant="outline">
                                        Matches dragged window
                                      </Badge>
                                    ) : null}
                                  </div>
                                </div>
                                {isSelected ? (
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
                      <p className="rounded-[0.9rem] border border-dashed border-surface px-4 py-6 text-center text-body-sm text-content-muted">
                        {isDefenseWithPanelists
                          ? "No shared slots for all selected advisers on this date. Try another time period or adjust your panelists."
                          : "No available slots on this date for the selected adviser. Try another time period or use the full form to choose a different date."}
                      </p>
                    )}
                  </>
                ) : (
                  <p className="rounded-[0.9rem] border border-dashed border-surface px-4 py-6 text-center text-body-sm text-content-muted">
                    Choose an adviser to load the same slot availability shown
                    on the full consultation page.
                  </p>
                )}
              </div>
              <InlineFieldError message={fieldErrors.selectedTimeSlot} />
            </ModalField>

            <ModalField label="Topic / Title">
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
                className="h-11 rounded-[0.95rem]"
              />
              <InlineFieldError message={fieldErrors.topic} />
            </ModalField>

            <ModalField label="Description / Agenda">
              <Textarea
                value={description}
                onChange={(event) =>
                  setDescription(event.target.value.slice(0, 350))
                }
                placeholder="Provide details about what you'd like to discuss during this consultation..."
                className="min-h-[7.5rem] rounded-[0.95rem]"
              />
            </ModalField>

            {submitError ? (
              <div className="rounded-[1rem] border border-destructive/25 bg-destructive/10 px-4 py-3 text-body-sm text-destructive">
                {submitError}
              </div>
            ) : null}

            {selectedAdviser ? (
              <div className="rounded-[1rem] border border-surface bg-surface-muted-soft px-4 py-3 text-body-sm text-content-muted">
                Request will be sent to{" "}
                <span className="font-medium text-content-strong">
                  {selectedAdviser.name}
                </span>
                {" · "}
                {selectedAdviser.departmentCode}
              </div>
            ) : null}

            <div className="flex flex-col gap-3 pt-2 sm:flex-row">
              <Button
                type="button"
                variant="outline"
                className="h-11 flex-1 rounded-[0.95rem]"
                onClick={onClose}
              >
                Cancel
              </Button>
              <Button
                type="button"
                className="h-11 flex-1 rounded-[0.95rem]"
                disabled={!canSubmit || createScheduleMutation.isPending}
                onClick={handleSubmit}
              >
                {createScheduleMutation.isPending
                  ? "Submitting..."
                  : "Create Request"}
              </Button>
            </div>

            <div className="text-center text-body-sm text-content-muted">
              Need the full workflow?{" "}
              <Link
                href="/student/consultations/request"
                className="font-medium text-brand underline-offset-4 hover:text-brand-strong hover:underline"
              >
                Open the full request form
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function SummaryTile({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof CalendarDays;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-start gap-3 rounded-[1rem] bg-surface-card/65 px-4 py-4">
      <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-primary-tint text-brand-strong">
        <Icon className="size-5" />
      </div>
      <div className="space-y-0.5">
        <div className="text-body-sm text-content-muted">{label}</div>
        <div className="text-card-title">{value}</div>
      </div>
    </div>
  );
}

function ModalField({
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
      <div className="flex items-center gap-3 text-[1rem] font-medium text-content-strong">
        {Icon ? <Icon className="size-4" /> : null}
        <span>{label}</span>
      </div>
      {children}
    </div>
  );
}

function InlineFieldError({ message }: { message?: string }) {
  if (!message) {
    return null;
  }

  return <p className="text-body-sm text-destructive">{message}</p>;
}

function toDateInputValue(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function MonthDetailsRail({
  approvedCount,
  focusedDayEvents,
  focusDate,
  overlayCalendars,
  overlayEnabled,
  overlayError,
  pendingCount,
  primaryCalendarLabel,
  primaryCalendarOwnerId,
  onAddCalendar,
  onRemoveOverlayCalendar,
  selectedCalendarToneMap,
  totalEvents,
}: {
  approvedCount: number;
  focusedDayEvents: CalendarEvent[];
  focusDate: Date;
  overlayCalendars: CalendarOverlaySelection[];
  overlayEnabled: boolean;
  overlayError: string | null;
  pendingCount: number;
  primaryCalendarLabel: string;
  primaryCalendarOwnerId: string;
  onAddCalendar: () => void;
  onRemoveOverlayCalendar: (userId: string) => void;
  selectedCalendarToneMap: Map<string, CalendarEventTone>;
  totalEvents: number;
}) {
  return (
    <div className="space-y-6">
      <Card className="gap-0 rounded-[2rem] border-brand-subtle py-0 shadow-elevated">
        <CardHeader className="border-b border-surface px-5 py-5">
          <h2 className="text-section-title">Selected Day</h2>
          <p className="text-body-sm text-content-muted">
            {focusDate.toLocaleDateString("en-US", {
              weekday: "long",
              month: "long",
              day: "numeric",
              year: "numeric",
            })}
          </p>
        </CardHeader>
        <CardContent className="space-y-4 px-5 py-5">
          {focusedDayEvents.length > 0 ? (
            focusedDayEvents.map((event) => (
              <div
                key={event.id}
                className="rounded-[1.15rem] border border-surface bg-surface-muted-soft px-4 py-4"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="text-[1.05rem] leading-6 font-semibold text-content-strong">
                      {event.title}
                    </div>
                    <div className="mt-1 text-body-sm text-content-muted">
                      {event.ownerName} · {getRoleLabel(event.ownerRole)}
                    </div>
                    <div className="mt-1 text-body-sm">
                      {timeFormatter.format(event.startsAt)}
                    </div>
                    <div className="text-body-sm text-content-muted">
                      {getEventTypeLabel(event.type)}
                    </div>
                  </div>
                  <Badge variant={statusBadgeVariants[event.status]}>
                    {event.status === "approved" ? "Approved" : "Pending"}
                  </Badge>
                </div>
              </div>
            ))
          ) : (
            <div className="rounded-[1.15rem] border border-surface bg-surface-muted-soft px-4 py-4 text-body-sm">
              No scheduled events for this day.
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="gap-0 rounded-[2rem] border-brand-subtle py-0 shadow-elevated">
        <CardHeader className="border-b border-surface px-5 py-5">
          <h2 className="text-section-title">Month Snapshot</h2>
        </CardHeader>
        <CardContent className="grid gap-3 px-5 py-5">
          <SnapshotMetric label="Total events" value={String(totalEvents)} />
          <SnapshotMetric label="Approved" value={String(approvedCount)} />
          <SnapshotMetric label="Pending" value={String(pendingCount)} />
        </CardContent>
      </Card>

      {overlayEnabled ? (
        <CalendarOverlayRailCard
          overlayCalendars={overlayCalendars}
          overlayError={overlayError}
          primaryCalendarLabel={primaryCalendarLabel}
          primaryCalendarOwnerId={primaryCalendarOwnerId}
          selectedCalendarToneMap={selectedCalendarToneMap}
          onAddCalendar={onAddCalendar}
          onRemoveOverlayCalendar={onRemoveOverlayCalendar}
        />
      ) : null}
    </div>
  );
}

function SnapshotMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between rounded-[1rem] border border-surface bg-surface-muted-soft px-4 py-3">
      <span className="text-body-sm text-content-muted">{label}</span>
      <span className="text-[1.2rem] font-semibold text-content-strong">
        {value}
      </span>
    </div>
  );
}

function UpcomingEvents({ events }: { events: CalendarEvent[] }) {
  return (
    <Card className="gap-0 rounded-[2rem] border-brand-subtle py-0 shadow-elevated">
      <CardHeader className="border-b border-surface px-6 py-6 sm:px-7">
        <h2 className="text-section-title">Upcoming Events</h2>
      </CardHeader>
      <CardContent className="space-y-4 px-6 py-6 sm:px-7">
        {events.length > 0 ? (
          events.map((event) => (
            <div
              key={event.id}
              className="flex flex-col gap-4 rounded-[1.4rem] border border-surface bg-surface-card px-4 py-4 sm:flex-row sm:items-center sm:justify-between"
            >
              <div className="flex items-center gap-4">
                <div className="flex w-[4.1rem] shrink-0 flex-col items-center rounded-[1rem] bg-primary-tint px-3 py-2 text-brand-strong">
                  <span className="text-[0.95rem] leading-5 text-content-muted">
                    {shortMonthFormatter.format(event.startsAt)}
                  </span>
                  <span className="text-[2rem] leading-none font-semibold">
                    {event.startsAt.getDate()}
                  </span>
                </div>

                <div className="space-y-1">
                  <div className="text-[1.35rem] leading-7 font-semibold tracking-[-0.03em] text-content-strong">
                    {event.title}
                  </div>
                  <p className="text-body-sm text-content-muted">
                    {event.ownerName} · {getRoleLabel(event.ownerRole)}
                  </p>
                  <p className="text-body-sm">
                    {timeFormatter.format(event.startsAt)}
                  </p>
                  <p className="text-body-sm text-content-muted">
                    {getEventTypeLabel(event.type)}
                  </p>
                </div>
              </div>

              <Badge variant={statusBadgeVariants[event.status]}>
                {event.status === "approved" ? "Approved" : "Pending"}
              </Badge>
            </div>
          ))
        ) : (
          <div className="rounded-[1.4rem] border border-surface bg-surface-muted-soft px-4 py-5 text-body">
            No events are scheduled for this month yet.
          </div>
        )}
      </CardContent>
    </Card>
  );
}
