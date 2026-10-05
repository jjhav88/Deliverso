import { describe, expect, it } from "vitest";
import {
  compareOperationalSchedule,
  getBusinessDayRange,
  isMissingOperationalSchedule,
  isOrderOperationallyOverdue,
} from "@/modules/operations/domain/dates";

describe("business day range", () => {
  it("uses Mexico City today, not UTC", () => {
    const now = new Date("2026-10-06T05:30:00.000Z");
    const range = getBusinessDayRange(now);
    expect(range.today).toBe("2026-10-05");
    expect(range.tomorrow).toBe("2026-10-06");
    expect(range.nextSevenStart).toBe("2026-10-05");
    expect(range.nextSevenEnd).toBe("2026-10-11");
  });

  it("stays on the UTC day when Mexico City matches", () => {
    const now = new Date("2026-10-05T18:00:00.000Z");
    expect(getBusinessDayRange(now).today).toBe("2026-10-05");
    expect(getBusinessDayRange(now).tomorrow).toBe("2026-10-06");
  });
});

describe("overdue", () => {
  const base = {
    requestedDate: "2026-10-05",
    timeWindowStart: "10:00",
    timeWindowEnd: "11:00",
    fulfillmentStatus: "IN_PRODUCTION" as const,
    orderStatus: "PAID" as const,
  };

  it("marks a past window today as overdue", () => {
    expect(
      isOrderOperationallyOverdue({
        ...base,
        now: new Date("2026-10-05T18:30:00.000Z"),
      }),
    ).toBe(true);
  });

  it("does not mark a future window today as overdue", () => {
    expect(
      isOrderOperationallyOverdue({
        ...base,
        timeWindowEnd: "23:45",
        now: new Date("2026-10-05T18:30:00.000Z"),
      }),
    ).toBe(false);
  });

  it("marks yesterday as overdue", () => {
    expect(
      isOrderOperationallyOverdue({
        ...base,
        requestedDate: "2026-10-04",
        now: new Date("2026-10-05T18:00:00.000Z"),
      }),
    ).toBe(true);
  });

  it("does not mark tomorrow as overdue", () => {
    expect(
      isOrderOperationallyOverdue({
        ...base,
        requestedDate: "2026-10-06",
        now: new Date("2026-10-05T18:00:00.000Z"),
      }),
    ).toBe(false);
  });

  it("does not mark completed or cancelled as overdue", () => {
    expect(
      isOrderOperationallyOverdue({
        ...base,
        fulfillmentStatus: "COMPLETED",
        now: new Date("2026-10-05T20:00:00.000Z"),
      }),
    ).toBe(false);
    expect(
      isOrderOperationallyOverdue({
        ...base,
        orderStatus: "CANCELLED",
        now: new Date("2026-10-05T20:00:00.000Z"),
      }),
    ).toBe(false);
  });

  it("respects the Mexico City day boundary", () => {
    expect(
      isOrderOperationallyOverdue({
        ...base,
        requestedDate: "2026-10-05",
        timeWindowEnd: "23:00",
        now: new Date("2026-10-06T05:30:00.000Z"),
      }),
    ).toBe(true);
  });
});

describe("missing schedule", () => {
  it("flags operational orders without a valid fulfillment date or window", () => {
    expect(
      isMissingOperationalSchedule({
        requestedDate: null,
        timeWindowStart: "10:00",
        timeWindowEnd: "11:00",
      }),
    ).toBe(true);
    expect(
      isMissingOperationalSchedule({
        requestedDate: "2026-10-05",
        timeWindowStart: "",
        timeWindowEnd: "11:00",
      }),
    ).toBe(true);
    expect(
      isMissingOperationalSchedule({
        requestedDate: "2026-10-05",
        timeWindowStart: "10:00",
        timeWindowEnd: "11:00",
      }),
    ).toBe(false);
  });

  it("does not treat missing schedule as overdue", () => {
    expect(
      isOrderOperationallyOverdue({
        requestedDate: "2026-10-05",
        timeWindowStart: "",
        timeWindowEnd: "not-a-time",
        fulfillmentStatus: "CONFIRMED",
        orderStatus: "PAID",
        now: new Date("2026-10-05T20:00:00.000Z"),
      }),
    ).toBe(false);
  });
});

describe("sort order", () => {
  it("puts overdue first then date and time", () => {
    const overdue = { requestedDate: "2026-10-05", timeWindowStart: "16:00", overdue: true };
    const laterToday = { requestedDate: "2026-10-05", timeWindowStart: "18:00", overdue: false };
    const earlierToday = { requestedDate: "2026-10-05", timeWindowStart: "09:00", overdue: false };
    const tomorrow = { requestedDate: "2026-10-06", timeWindowStart: "08:00", overdue: false };
    const sorted = [tomorrow, laterToday, overdue, earlierToday].sort(compareOperationalSchedule);
    expect(sorted.map((item) => `${item.requestedDate}-${item.timeWindowStart}`)).toEqual([
      "2026-10-05-16:00",
      "2026-10-05-09:00",
      "2026-10-05-18:00",
      "2026-10-06-08:00",
    ]);
  });
});
