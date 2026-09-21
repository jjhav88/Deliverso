import { businessTimezone } from "@/config/fulfillment";

export type ZonedParts = {
  date: string;
  hour: number;
  minute: number;
  minutesOfDay: number;
  dayOfWeek: number;
};

const weekdayToIso: Record<string, number> = {
  Mon: 1,
  Tue: 2,
  Wed: 3,
  Thu: 4,
  Fri: 5,
  Sat: 6,
  Sun: 7,
};

export function getZonedParts(now: Date, timeZone = businessTimezone): ZonedParts {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    weekday: "short",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(now);

  const read = (type: string) => parts.find((part) => part.type === type)?.value ?? "";
  const date = `${read("year")}-${read("month")}-${read("day")}`;
  const hour = Number(read("hour"));
  const minute = Number(read("minute"));
  return {
    date,
    hour,
    minute,
    minutesOfDay: hour * 60 + minute,
    dayOfWeek: weekdayToIso[read("weekday")] ?? 1,
  };
}

export function parseClock(value: string): number | null {
  const match = /^([01]\d|2[0-3]):([0-5]\d)$/.exec(value);
  if (!match) {
    return null;
  }
  return Number(match[1]) * 60 + Number(match[2]);
}

export function addMinutesToDate(date: string, minutes: number): { date: string; minutesOfDay: number } {
  const [year, month, day] = date.split("-").map(Number);
  const utc = Date.UTC(year, month - 1, day) + minutes * 60_000;
  const next = new Date(utc);
  const y = next.getUTCFullYear();
  const m = String(next.getUTCMonth() + 1).padStart(2, "0");
  const d = String(next.getUTCDate()).padStart(2, "0");
  const minutesOfDay = next.getUTCHours() * 60 + next.getUTCMinutes();
  return { date: `${y}-${m}-${d}`, minutesOfDay };
}

export function addCalendarDays(date: string, days: number): string {
  const [year, month, day] = date.split("-").map(Number);
  const next = new Date(Date.UTC(year, month - 1, day + days));
  const y = next.getUTCFullYear();
  const m = String(next.getUTCMonth() + 1).padStart(2, "0");
  const d = String(next.getUTCDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function isoDayOfWeek(date: string): number {
  const [year, month, day] = date.split("-").map(Number);
  const utcDay = new Date(Date.UTC(year, month - 1, day)).getUTCDay();
  return utcDay === 0 ? 7 : utcDay;
}

export function calendarDateFromDb(value: Date): string {
  return value.toISOString().slice(0, 10);
}
