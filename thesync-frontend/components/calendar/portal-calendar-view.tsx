"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Clock3,
  FileText,
  UserRound,
  X,
} from "lucide-react";

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
import { useCreateSchedule } from "@/hooks/useSchedules";
import {
  buildScheduledAtIso,
  parseConsultationRequestError,
  scheduleTypeIdByValue,
  type ConsultationRequestFieldName,
} from "@/lib/consultation-request";
import { type ConsultationRequestType } from "@/lib/mock/student-consultations";
import { cn } from "@/lib/utils";

type CalendarView = "month" | "week";
type CalendarPortalRole = "student" | "adviser";
type CalendarEventTone = "brand" | "violet";
type CalendarEventStatus = "approved" | "pending";
type CalendarEventType = "consultation" | "defense";

type CalendarEvent = {
  id: string;
  startsAt: Date;
  durationHours: number;
  status: CalendarEventStatus;
  title: string;
  tone: CalendarEventTone;
  type: CalendarEventType;
};

export type PortalCalendarEvent = {
  id: string;
  startsAt: string;
  durationHours: number;
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
    status: "approved",
    title: "Chapter 1 Review",
    tone: "brand",
    type: "consultation",
  },
  {
    id: "methodology-discussion",
    startsAt: new Date(2026, 4, 8, 10, 0).toISOString(),
    durationHours: 1,
    status: "pending",
    title: "Methodology Discussion",
    tone: "brand",
    type: "consultation",
  },
  {
    id: "data-analysis-review",
    startsAt: new Date(2026, 4, 12, 15, 0).toISOString(),
    durationHours: 1,
    status: "approved",
    title: "Data Analysis Review",
    tone: "brand",
    type: "consultation",
  },
  {
    id: "thesis-defense",
    startsAt: new Date(2026, 4, 15, 13, 0).toISOString(),
    durationHours: 1,
    status: "approved",
    title: "Thesis Defense",
    tone: "violet",
    type: "defense",
  },
  {
    id: "final-revisions",
    startsAt: new Date(2026, 4, 20, 11, 0).toISOString(),
    durationHours: 1,
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
} as const;

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

function getWeekEvents(date: Date, events: CalendarEvent[]) {
  const weekStart = startOfWeek(date);
  const weekEnd = addDays(weekStart, 7);

  return events.filter((event) => {
    return event.startsAt >= weekStart && event.startsAt < weekEnd;
  });
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

export function PortalCalendarView({
  portalRole = "student",
  events = sampleEvents,
}: {
  portalRole?: CalendarPortalRole;
  events?: PortalCalendarEvent[];
}) {
  const [view, setView] = useState<CalendarView>("month");
  const [focusDate, setFocusDate] = useState(() => getInitialFocusDate(events));
  const [requestDraft, setRequestDraft] = useState<RequestDraft | null>(null);
  const [selectedWeekEvent, setSelectedWeekEvent] =
    useState<CalendarEvent | null>(null);
  const calendarEvents = useMemo<CalendarEvent[]>(
    () =>
      events
        .map((event) => {
          const startsAt = parsePortalEventDate(event.startsAt);

          if (!startsAt) {
            return null;
          }

          return {
            ...event,
            startsAt,
          };
        })
        .filter((event): event is CalendarEvent => event !== null),
    [events],
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
  const weekEvents = getWeekEvents(focusDate, calendarEvents);
  const focusedDayEvents =
    monthEventMap.get(getEventDayKey(startOfDay(focusDate))) ?? [];
  const approvedCount = monthEvents.filter(
    (event) => event.status === "approved",
  ).length;
  const pendingCount = monthEvents.filter(
    (event) => event.status === "pending",
  ).length;
  const canCreateRequests = portalRole === "student";

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
                pendingCount={pendingCount}
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
            <WeekGrid
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
                        {timeFormatter.format(event.startsAt)}
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
  canCreateRequests,
  focusDate,
  onEventSelect,
  onRequestSlotSelect,
  weekDays,
  weekEvents,
}: {
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
    () => weekEvents.filter((event) => !isAllDayEvent(event)),
    [weekEvents],
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
  const gridStyle = {
    gridTemplateColumns: "9rem repeat(7, minmax(8.5rem, 1fr))",
    gridTemplateRows: `3.9rem 3.25rem repeat(${weekTimeSlots.length}, 1.875rem)`,
  } as const;
  const occupiedSlots = useMemo(() => {
    const slots = new Set<string>();

    for (const event of timedWeekEvents) {
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

      const slotSpan = Math.max(1, event.durationHours * 2);

      for (let offset = 0; offset < slotSpan; offset += 1) {
        slots.add(`${dayIndex}-${startSlotIndex + offset}`);
      }
    }

    return slots;
  }, [displayStartMinutes, timedWeekEvents, weekDays, weekTimeSlots.length]);

  useEffect(() => {
    dragSelectionRef.current = dragSelection;
  }, [dragSelection]);

  const finalizeDragSelection = useCallback(() => {
    const currentSelection = dragSelectionRef.current;

    if (!currentSelection) {
      return;
    }

    const startSlotIndex = Math.min(
      currentSelection.startSlotIndex,
      currentSelection.endSlotIndex,
    );
    const endSlotIndex = Math.max(
      currentSelection.startSlotIndex,
      currentSelection.endSlotIndex,
    );
    const selectedDay = weekDays[currentSelection.dayIndex];
    const startAt = buildSlotDate(selectedDay, weekTimeSlots[startSlotIndex]);
    const endAt = addMinutes(
      buildSlotDate(selectedDay, weekTimeSlots[endSlotIndex]),
      30,
    );

    setDragSelection(null);
    onRequestSlotSelect(startAt, endAt);
  }, [onRequestSlotSelect, weekDays, weekTimeSlots]);

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
    if (!canCreateRequests || occupiedSlots.has(`${dayIndex}-${slotIndex}`)) {
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

      if (occupiedSlots.has(`${dayIndex}-${slotIndex}`)) {
        return currentSelection;
      }

      return {
        ...currentSelection,
        endSlotIndex: slotIndex,
      };
    });
  }

  function isSlotSelected(dayIndex: number, slotIndex: number) {
    if (!dragSelection || dragSelection.dayIndex !== dayIndex) {
      return false;
    }

    const startSlotIndex = Math.min(
      dragSelection.startSlotIndex,
      dragSelection.endSlotIndex,
    );
    const endSlotIndex = Math.max(
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
                        {event.title}
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
                const occupied = occupiedSlots.has(`${dayIndex}-${slotIndex}`);
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

            return (
              <button
                key={event.id}
                type="button"
                onClick={() => onEventSelect(event)}
                title={event.title}
                className={cn(
                  "z-10 mx-1 my-1 flex h-[calc(100%-0.5rem)] flex-col justify-between overflow-hidden rounded-[0.8rem] px-2.5 py-2 text-left transition-shadow hover:shadow-[0_14px_28px_rgba(45,94,255,0.1)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-offset-2",
                  eventToneClassNames[event.tone].weekBlock,
                )}
                style={{
                  gridColumnStart: dayIndex + 2,
                  gridRow: `${startRow + 3} / span ${Math.max(1, event.durationHours * 2)}`,
                }}
              >
                <div className="min-h-0 flex-1 overflow-hidden">
                  <div
                    className={cn(
                      "text-content-strong",
                      isCompactEvent
                        ? "line-clamp-2 text-[0.72rem] leading-[0.84rem] font-medium tracking-[-0.01em]"
                        : "line-clamp-2 text-[0.82rem] leading-[0.98rem] font-medium tracking-[-0.01em]",
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
                    Type
                  </div>
                  <div className="mt-2 text-[0.98rem] font-medium text-content-strong">
                    {getEventTypeLabel(event.type)}
                  </div>
                </div>

                <div className="rounded-[1rem] border border-surface bg-surface-card px-4 py-4">
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
  onClose,
}: {
  draft: RequestDraft;
  onClose: () => void;
}) {
  const [requestType, setRequestType] = useState<ConsultationRequestType>();
  const [adviserId, setAdviserId] = useState("");
  const [topic, setTopic] = useState("");
  const [description, setDescription] = useState("");
  const [fieldErrors, setFieldErrors] = useState<
    Partial<Record<ConsultationRequestFieldName, string>>
  >({});
  const [submitError, setSubmitError] = useState<string | null>(null);
  const { data: advisers = [], isLoading: isLoadingAdvisers } = useAdvisers();
  const createScheduleMutation = useCreateSchedule();

  const selectedAdviser = useMemo(
    () => advisers.find((adviser) => adviser.id === adviserId) ?? null,
    [adviserId, advisers],
  );
  const canSubmit = Boolean(requestType && adviserId && topic.trim());

  async function handleSubmit() {
    const nextFieldErrors: Partial<
      Record<ConsultationRequestFieldName, string>
    > = {};

    if (!requestType) {
      nextFieldErrors.scheduleType = "Please select a consultation type.";
    }

    if (!adviserId) {
      nextFieldErrors.selectedAdviserId = "Please choose an adviser.";
    }

    if (!topic.trim()) {
      nextFieldErrors.topic = "Please enter a topic.";
    }

    if (Object.keys(nextFieldErrors).length > 0) {
      setFieldErrors(nextFieldErrors);
      setSubmitError(null);
      return;
    }

    if (!requestType) {
      return;
    }

    setFieldErrors({});
    setSubmitError(null);

    try {
      await createScheduleMutation.mutateAsync({
        adviser_id: adviserId,
        type_id: scheduleTypeIdByValue[requestType],
        topic: topic.trim(),
        scheduled_at: buildScheduledAtIso(
          toDateInputValue(draft.date),
          toTimeInputValue(draft.date),
        ),
      });

      setRequestType(undefined);
      setAdviserId("");
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/40 px-4 py-8 backdrop-blur-[2px]">
      <div className="w-full max-w-[32rem] rounded-[1.75rem] border border-brand-subtle bg-surface-card shadow-elevated">
        <div className="flex items-start justify-between gap-4 px-6 py-6 sm:px-7">
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

        <div className="space-y-5 px-6 pb-6 sm:px-7 sm:pb-7">
          <div className="grid gap-3 rounded-[1.15rem] border border-brand-subtle bg-primary-tint/45 p-4 sm:grid-cols-2">
            <SummaryTile
              icon={CalendarDays}
              label="Date"
              value={requestDateFormatter.format(draft.date)}
            />
            <SummaryTile
              icon={Clock3}
              label="Time"
              value={`${timeFormatter.format(draft.date)} - ${timeFormatter.format(
                draft.endAt,
              )}`}
            />
          </div>

          <ModalField icon={FileText} label="Consultation Type">
            <Select
              value={requestType ?? undefined}
              onValueChange={(value) => {
                setRequestType(value as ConsultationRequestType);
                setFieldErrors((current) => ({
                  ...current,
                  scheduleType: undefined,
                }));
                setSubmitError(null);
              }}
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
            <Select
              value={adviserId || undefined}
              onValueChange={(value) => {
                setAdviserId(value);
                setFieldErrors((current) => ({
                  ...current,
                  selectedAdviserId: undefined,
                }));
                setSubmitError(null);
              }}
            >
              <SelectTrigger className="h-11 rounded-[0.95rem]">
                <SelectValue
                  placeholder={
                    isLoadingAdvisers
                      ? "Loading advisers..."
                      : "Choose your adviser"
                  }
                />
              </SelectTrigger>
              <SelectContent>
                {advisers.map((adviser) => (
                  <SelectItem key={adviser.id} value={adviser.id}>
                    {adviser.name} ({adviser.departmentCode})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <InlineFieldError message={fieldErrors.selectedAdviserId} />
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

function toTimeInputValue(date: Date) {
  return `${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}`;
}

function MonthDetailsRail({
  approvedCount,
  focusedDayEvents,
  focusDate,
  pendingCount,
  totalEvents,
}: {
  approvedCount: number;
  focusedDayEvents: CalendarEvent[];
  focusDate: Date;
  pendingCount: number;
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
