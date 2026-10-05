import { businessTimezone } from "@/config/fulfillment";
import {
  addCalendarDays,
  calendarDateFromDb,
  getZonedParts,
  parseClock,
} from "@/modules/checkout/domain/timezone";
import type { FulfillmentStatus } from "@/modules/orders/domain/fulfillment-status";
import type { OrderStatus } from "@/modules/orders/domain/status";

export type BusinessDayRange = {
  today: string;
  tomorrow: string;
  nextSevenStart: string;
  nextSevenEnd: string;
};

const calendarDatePattern = /^(\d{4})-(\d{2})-(\d{2})$/;

export function getBusinessDayRange(
  now: Date = new Date(),
  timeZone = businessTimezone,
): BusinessDayRange {
  const today = getZonedParts(now, timeZone).date;
  return {
    today,
    tomorrow: addCalendarDays(today, 1),
    nextSevenStart: today,
    nextSevenEnd: addCalendarDays(today, 6),
  };
}

export function calendarDateToDb(date: string): Date {
  return new Date(`${date}T00:00:00.000Z`);
}

export function normalizeCalendarDate(value: Date | string | null | undefined): string | null {
  if (!value) {
    return null;
  }
  if (typeof value === "string") {
    const date = value.slice(0, 10);
    return calendarDatePattern.test(date) ? date : null;
  }
  if (Number.isNaN(value.getTime())) {
    return null;
  }
  const date = calendarDateFromDb(value);
  return calendarDatePattern.test(date) ? date : null;
}

export function isMissingOperationalSchedule(input: {
  requestedDate: Date | string | null | undefined;
  timeWindowStart: string | null | undefined;
  timeWindowEnd: string | null | undefined;
}): boolean {
  const date = normalizeCalendarDate(input.requestedDate);
  if (!date) {
    return true;
  }
  return parseClock(input.timeWindowStart ?? "") == null || parseClock(input.timeWindowEnd ?? "") == null;
}

export function isOrderOperationallyOverdue(input: {
  requestedDate: Date | string | null | undefined;
  timeWindowEnd: string | null | undefined;
  timeWindowStart?: string | null;
  fulfillmentStatus: FulfillmentStatus | string;
  orderStatus: OrderStatus | string;
  now?: Date;
  timeZone?: string;
}): boolean {
  if (
    input.orderStatus === "CANCELLED" ||
    input.fulfillmentStatus === "CANCELLED" ||
    input.fulfillmentStatus === "COMPLETED"
  ) {
    return false;
  }
  if (
    isMissingOperationalSchedule({
      requestedDate: input.requestedDate,
      timeWindowStart: input.timeWindowStart,
      timeWindowEnd: input.timeWindowEnd,
    })
  ) {
    return false;
  }
  const date = normalizeCalendarDate(input.requestedDate);
  const endMinutes = parseClock(input.timeWindowEnd ?? "");
  if (!date || endMinutes == null) {
    return false;
  }
  const zoned = getZonedParts(input.now ?? new Date(), input.timeZone ?? businessTimezone);
  if (date < zoned.date) {
    return true;
  }
  if (date > zoned.date) {
    return false;
  }
  return zoned.minutesOfDay > endMinutes;
}

export function compareOperationalSchedule(
  a: { requestedDate: string; timeWindowStart: string; overdue: boolean },
  b: { requestedDate: string; timeWindowStart: string; overdue: boolean },
): number {
  if (a.overdue !== b.overdue) {
    return a.overdue ? -1 : 1;
  }
  if (a.requestedDate !== b.requestedDate) {
    return a.requestedDate.localeCompare(b.requestedDate);
  }
  return (parseClock(a.timeWindowStart) ?? 0) - (parseClock(b.timeWindowStart) ?? 0);
}

export function formatOperationsDate(calendarDate: string, locale = "es-MX"): string {
  const match = calendarDatePattern.exec(calendarDate);
  if (!match) {
    return calendarDate;
  }
  const utc = new Date(Date.UTC(Number(match[1]), Number(match[2]) - 1, Number(match[3])));
  return new Intl.DateTimeFormat(locale, {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  }).format(utc);
}

export function formatOperationsClock(value: string, locale = "es-MX"): string {
  const minutes = parseClock(value);
  if (minutes == null) {
    return value;
  }
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  const utc = new Date(Date.UTC(2026, 0, 1, hours, mins));
  return new Intl.DateTimeFormat(locale, {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
    timeZone: "UTC",
  }).format(utc);
}

export function formatOperationsWindow(
  start: string,
  end: string,
  locale = "es-MX",
): string {
  return `${formatOperationsClock(start, locale)}–${formatOperationsClock(end, locale)}`;
}
