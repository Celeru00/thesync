"use client";

import { useMemo } from "react";

import { useMySlots } from "@/hooks/useAvailability";
import type { AvailabilityRule } from "@/lib/api";
import {
  PortalCalendarView,
  type PortalCalendarEvent,
} from "@/components/calendar/portal-calendar-view";

const RECURRING_PREVIEW_DAYS = 120;

function normalizeTimeValue(value: string) {
  return value.slice(0, 5);
}

function getWeekdayIndex(date: Date) {
  return (date.getDay() + 6) % 7;
}

function buildOccurrenceIso(day: Date, timeValue: string) {
  const [hours, minutes] = normalizeTimeValue(timeValue).split(":").map(Number);
  return new Date(
    day.getFullYear(),
    day.getMonth(),
    day.getDate(),
    hours,
    minutes,
    0,
    0,
  ).toISOString();
}

function getRuleDurationHours(rule: AvailabilityRule) {
  const [startHours, startMinutes] = normalizeTimeValue(rule.start_time)
    .split(":")
    .map(Number);
  const [endHours, endMinutes] = normalizeTimeValue(rule.end_time)
    .split(":")
    .map(Number);
  const durationMinutes =
    endHours * 60 + endMinutes - (startHours * 60 + startMinutes);

  return Math.max(0.5, durationMinutes / 60);
}

function expandRuleToCalendarEvents(
  rule: AvailabilityRule,
  {
    fromDate,
    dayCount,
  }: {
    fromDate: Date;
    dayCount: number;
  },
): PortalCalendarEvent[] {
  const durationHours = getRuleDurationHours(rule);
  const events: PortalCalendarEvent[] = [];

  for (let offset = 0; offset < dayCount; offset += 1) {
    const day = new Date(fromDate);
    day.setDate(fromDate.getDate() + offset);

    if (getWeekdayIndex(day) !== rule.day_of_week) {
      continue;
    }

    const startsAt = buildOccurrenceIso(day, rule.start_time);
    events.push({
      id: `availability-${rule.id}-${startsAt}`,
      startsAt,
      durationHours,
      status: "approved",
      title: rule.is_blocked ? "Blocked" : "Available",
      tone: rule.is_blocked ? "rose" : "teal",
      type: "consultation",
      ownerId: rule.adviser_id,
      ownerName: "My Availability",
      ownerRole: "adviser",
      isPrimaryCalendar: true,
    });
  }

  return events;
}

function ruleToCalendarEvents(rule: AvailabilityRule): PortalCalendarEvent[] {
  const previewStart = new Date();
  previewStart.setHours(0, 0, 0, 0);

  return expandRuleToCalendarEvents(rule, {
    fromDate: previewStart,
    dayCount: RECURRING_PREVIEW_DAYS,
  });
}

function uniqueEvents(events: PortalCalendarEvent[]) {
  return Array.from(new Map(events.map((event) => [event.id, event])).values());
}

function buildAvailabilityEvents(rules: AvailabilityRule[]) {
  return {
    events: uniqueEvents(
      rules
        .filter((rule) => rule.day_of_week >= 0 && rule.day_of_week <= 4)
        .flatMap(ruleToCalendarEvents),
    ),
  };
}

type AdviserCalendarViewProps = {
  initialEvents: PortalCalendarEvent[];
  primaryCalendarLabel: string;
  primaryCalendarOwnerId: string;
};

export function AdviserCalendarView({
  initialEvents,
  primaryCalendarLabel,
  primaryCalendarOwnerId,
}: AdviserCalendarViewProps) {
  const { data: myRules = [] } = useMySlots();

  const availabilityEvents = useMemo(
    () => buildAvailabilityEvents(myRules).events,
    [myRules],
  );

  const allEvents = useMemo(
    () => [...initialEvents, ...availabilityEvents],
    [initialEvents, availabilityEvents],
  );

  return (
    <PortalCalendarView
      portalRole="adviser"
      events={allEvents}
      primaryCalendarLabel={primaryCalendarLabel}
      primaryCalendarOwnerId={primaryCalendarOwnerId}
    />
  );
}
