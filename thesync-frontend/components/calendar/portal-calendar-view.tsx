"use client";

import { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";

type CalendarView = "month" | "week";
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

type CalendarDayCell = {
  date: Date;
  inCurrentMonth: boolean;
};

const weekdayLabels = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const hours = Array.from({ length: 13 }, (_, index) => 8 + index);

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

const sampleEvents: CalendarEvent[] = [
  {
    id: "chapter-1-review",
    startsAt: new Date(2026, 4, 5, 14, 0),
    durationHours: 1,
    status: "approved",
    title: "Chapter 1 Review",
    tone: "brand",
    type: "consultation",
  },
  {
    id: "methodology-discussion",
    startsAt: new Date(2026, 4, 8, 10, 0),
    durationHours: 1,
    status: "pending",
    title: "Methodology Discussion",
    tone: "brand",
    type: "consultation",
  },
  {
    id: "data-analysis-review",
    startsAt: new Date(2026, 4, 12, 15, 0),
    durationHours: 1,
    status: "approved",
    title: "Data Analysis Review",
    tone: "brand",
    type: "consultation",
  },
  {
    id: "thesis-defense",
    startsAt: new Date(2026, 4, 15, 13, 0),
    durationHours: 1,
    status: "approved",
    title: "Thesis Defense",
    tone: "violet",
    type: "defense",
  },
  {
    id: "final-revisions",
    startsAt: new Date(2026, 4, 20, 11, 0),
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
    monthBar: "bg-primary-tint text-brand-strong",
    weekBlock:
      "bg-linear-to-b from-brand to-brand-strong text-brand-on shadow-glow",
  },
  violet: {
    monthBar: "bg-violet-soft text-violet",
    weekBlock:
      "bg-linear-to-b from-violet to-[#9333ea] text-white shadow-[0_18px_40px_rgba(147,51,234,0.24)]",
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

function getTitleForView(view: CalendarView, date: Date) {
  if (view === "month") {
    return monthFormatter.format(date);
  }

  return monthFormatter.format(startOfWeek(date));
}

function getEventTypeLabel(type: CalendarEventType) {
  return type === "consultation" ? "Consultation" : "Defense";
}

function getWeekEvents(date: Date) {
  const weekStart = startOfWeek(date);
  const weekEnd = addDays(weekStart, 7);

  return sampleEvents.filter((event) => {
    return event.startsAt >= weekStart && event.startsAt < weekEnd;
  });
}

export function PortalCalendarView() {
  const [view, setView] = useState<CalendarView>("month");
  const [focusDate, setFocusDate] = useState(new Date(2026, 4, 1));

  const monthCells = getMonthCells(focusDate);
  const monthEvents = sampleEvents
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
  const weekEvents = getWeekEvents(focusDate);
  const focusedDayEvents =
    monthEventMap.get(getEventDayKey(startOfDay(focusDate))) ?? [];
  const approvedCount = monthEvents.filter(
    (event) => event.status === "approved",
  ).length;
  const pendingCount = monthEvents.filter(
    (event) => event.status === "pending",
  ).length;

  function handleNavigate(direction: -1 | 1) {
    if (view === "month") {
      setFocusDate((currentDate) => addMonths(currentDate, direction));
      return;
    }

    setFocusDate((currentDate) => addDays(currentDate, direction * 7));
  }

  return (
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
                Switch weeks to review consultation windows and defense blocks
                at a glance.
              </span>
            </CardFooter>
          }
          onNavigate={handleNavigate}
          view={view}
        >
          <WeekGrid
            focusDate={focusDate}
            weekDays={weekDays}
            weekEvents={weekEvents}
          />
        </CalendarShell>
      )}
    </section>
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
  focusDate,
  weekDays,
  weekEvents,
}: {
  focusDate: Date;
  weekDays: Date[];
  weekEvents: CalendarEvent[];
}) {
  const gridStyle = {
    gridTemplateColumns: "9rem repeat(7, minmax(8.5rem, 1fr))",
    gridTemplateRows: `3.9rem repeat(${hours.length}, 3.75rem)`,
  } as const;

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

          {weekDays.map((day, dayIndex) => {
            const isFocusedDay = isSameDay(day, focusDate);

            return (
              <div
                key={day.toISOString()}
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
                    isFocusedDay ? "text-brand-strong" : "text-content-strong",
                  )}
                >
                  {day.getDate()}
                </div>
              </div>
            );
          })}

          {hours.flatMap((hour, hourIndex) => {
            return [
              <div
                key={`label-${hour}`}
                className="flex items-start justify-end border-r border-b border-surface px-3 pt-3 text-caption text-content-muted"
                style={{
                  gridColumnStart: 1,
                  gridRowStart: hourIndex + 2,
                }}
              >
                {timeFormatter.format(new Date(2026, 0, 1, hour, 0))}
              </div>,
              ...weekDays.map((day, dayIndex) => (
                <div
                  key={`${day.toISOString()}-${hour}`}
                  className="border-r border-b border-surface bg-surface-card"
                  style={{
                    gridColumnStart: dayIndex + 2,
                    gridRowStart: hourIndex + 2,
                  }}
                />
              )),
            ];
          })}

          {weekEvents.map((event) => {
            const dayIndex = weekDays.findIndex((day) =>
              isSameDay(day, event.startsAt),
            );
            const startRow = hours.findIndex(
              (hour) => hour === event.startsAt.getHours(),
            );

            if (dayIndex === -1 || startRow === -1) {
              return null;
            }

            return (
              <div
                key={event.id}
                className={cn(
                  "z-10 mx-1 my-1 rounded-[0.9rem] px-3 py-2 text-left",
                  eventToneClassNames[event.tone].weekBlock,
                )}
                style={{
                  gridColumnStart: dayIndex + 2,
                  gridRow: `${startRow + 2} / span ${event.durationHours}`,
                }}
              >
                <div className="text-[0.98rem] leading-5 font-medium">
                  {event.title}
                </div>
                <div className="mt-1 text-[0.8rem] leading-4 text-white/85">
                  {timeFormatter.format(event.startsAt)}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
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
