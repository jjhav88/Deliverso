import { fulfillmentHorizonDays } from "@/config/fulfillment";
import type { FulfillmentMethod } from "@/modules/checkout/domain/fulfillment";
import { isBlackoutForMethod } from "@/modules/checkout/domain/schedule";
import {
  addCalendarDays,
  addMinutesToDate,
  getZonedParts,
  isoDayOfWeek,
  parseClock,
  type ZonedParts,
} from "@/modules/checkout/domain/timezone";

export type ScheduleDay = {
  dayOfWeek: number;
  isActive: boolean;
  windows: readonly { id: string; startTime: string; endTime: string; isActive: boolean; label?: string | null }[];
};

export type AvailableSlot = {
  id: string;
  startTime: string;
  endTime: string;
  label: string | null;
};

export type AvailableDate = {
  date: string;
  slots: AvailableSlot[];
};

export function earliestFulfillment(now: Date, leadMinutes: number, timeZone?: string): {
  date: string;
  minutesOfDay: number;
} {
  const parts = getZonedParts(now, timeZone);
  return addMinutesToDate(parts.date, parts.minutesOfDay + Math.max(0, leadMinutes));
}

export function isSlotAfterEarliest(input: {
  date: string;
  startTime: string;
  earliest: { date: string; minutesOfDay: number };
}): boolean {
  const start = parseClock(input.startTime);
  if (start === null) {
    return false;
  }
  if (input.date > input.earliest.date) {
    return true;
  }
  if (input.date < input.earliest.date) {
    return false;
  }
  return start >= input.earliest.minutesOfDay;
}

export function getAvailableFulfillmentDates(input: {
  now: Date;
  leadMinutes: number;
  method: FulfillmentMethod;
  schedule: readonly ScheduleDay[];
  blackouts: readonly {
    date: string;
    fulfillmentMethod: FulfillmentMethod | null;
    isActive: boolean;
  }[];
  horizonDays?: number;
  timeZone?: string;
}): AvailableDate[] {
  const today = getZonedParts(input.now, input.timeZone);
  const earliest = earliestFulfillment(input.now, input.leadMinutes, input.timeZone);
  const horizon = input.horizonDays ?? fulfillmentHorizonDays;
  const byDay = new Map(input.schedule.map((day) => [day.dayOfWeek, day]));
  const dates: AvailableDate[] = [];

  for (let offset = 0; offset < horizon; offset += 1) {
    const date = addCalendarDays(today.date, offset);
    if (date < earliest.date) {
      continue;
    }
    const day = byDay.get(isoDayOfWeek(date));
    if (!day || !day.isActive) {
      continue;
    }
    if (isBlackoutForMethod(input.blackouts, date, input.method)) {
      continue;
    }
    const slots = day.windows
      .filter((window) => window.isActive)
      .filter((window) => isSlotAfterEarliest({ date, startTime: window.startTime, earliest }))
      .map((window) => ({
        id: window.id,
        startTime: window.startTime,
        endTime: window.endTime,
        label: window.label ?? null,
      }));
    if (slots.length > 0) {
      dates.push({ date, slots });
    }
  }

  return dates;
}

export function isRequestedSlotValid(input: {
  now: Date;
  leadMinutes: number;
  method: FulfillmentMethod;
  date: string;
  windowId: string;
  schedule: readonly ScheduleDay[];
  blackouts: readonly {
    date: string;
    fulfillmentMethod: FulfillmentMethod | null;
    isActive: boolean;
  }[];
  timeZone?: string;
}): boolean {
  const available = getAvailableFulfillmentDates(input);
  return available.some(
    (day) => day.date === input.date && day.slots.some((slot) => slot.id === input.windowId),
  );
}

export function isPastDate(date: string, today: ZonedParts): boolean {
  return date < today.date;
}
