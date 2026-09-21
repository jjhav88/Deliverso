import type { FulfillmentMethod } from "@/modules/checkout/domain/fulfillment";
import { parseClock } from "@/modules/checkout/domain/timezone";

export function windowEndAfterStart(startTime: string, endTime: string): boolean {
  const start = parseClock(startTime);
  const end = parseClock(endTime);
  return start !== null && end !== null && end > start;
}

export function windowsOverlap(
  a: { startTime: string; endTime: string },
  b: { startTime: string; endTime: string },
): boolean {
  const aStart = parseClock(a.startTime);
  const aEnd = parseClock(a.endTime);
  const bStart = parseClock(b.startTime);
  const bEnd = parseClock(b.endTime);
  if (aStart === null || aEnd === null || bStart === null || bEnd === null) {
    return false;
  }
  return aStart < bEnd && bStart < aEnd;
}

export function hasOverlappingWindows(
  windows: readonly { startTime: string; endTime: string; isActive?: boolean }[],
): boolean {
  const active = windows.filter((window) => window.isActive !== false);
  for (let i = 0; i < active.length; i += 1) {
    for (let j = i + 1; j < active.length; j += 1) {
      if (windowsOverlap(active[i], active[j])) {
        return true;
      }
    }
  }
  return false;
}

export function isBlackoutForMethod(
  blackouts: readonly {
    date: string;
    fulfillmentMethod: FulfillmentMethod | null;
    isActive: boolean;
  }[],
  date: string,
  method: FulfillmentMethod,
): boolean {
  return blackouts.some(
    (item) =>
      item.isActive &&
      item.date === date &&
      (item.fulfillmentMethod === null || item.fulfillmentMethod === method),
  );
}
