import { businessTimezone } from "@/config/fulfillment";
import { getZonedParts } from "@/modules/checkout/domain/timezone";

export function mexicoCityLocalToUtc(local: string, timeZone = businessTimezone): Date | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})$/.exec(local.trim());
  if (!match) {
    return null;
  }
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const hour = Number(match[4]);
  const minute = Number(match[5]);
  let utc = Date.UTC(year, month - 1, day, hour, minute, 0);
  const parts = getZonedParts(new Date(utc), timeZone);
  const wanted = `${match[1]}-${match[2]}-${match[3]}`;
  const wantedMinutes = hour * 60 + minute;
  const dateDelta = wanted === parts.date ? 0 : wanted > parts.date ? 1 : -1;
  utc += (wantedMinutes - parts.minutesOfDay + dateDelta * 24 * 60) * 60_000;
  return new Date(utc);
}

export function utcToMexicoCityLocal(value: Date | null, timeZone = businessTimezone): string {
  if (!value) {
    return "";
  }
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(value);
  const read = (type: string) => parts.find((part) => part.type === type)?.value ?? "";
  return `${read("year")}-${read("month")}-${read("day")}T${read("hour")}:${read("minute")}`;
}
