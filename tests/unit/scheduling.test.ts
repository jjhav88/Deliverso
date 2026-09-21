import { describe, expect, it } from "vitest";
import { isWithinSchedule, selectScheduledPlacements } from "@/lib/scheduling";
import { MAX_HERO_SHOWCASE_ITEMS } from "@/modules/home/demo/hero-showcase";
import { selectVisibleHeroShowcaseItems } from "@/modules/home/select-hero-showcase";

const now = new Date("2026-09-14T18:00:00.000Z");

describe("scheduling windows", () => {
  it("treats null bounds as open", () => {
    expect(isWithinSchedule(now, null, null)).toBe(true);
    expect(isWithinSchedule(now, undefined, undefined)).toBe(true);
  });

  it("excludes items before start or after end", () => {
    expect(
      isWithinSchedule(now, new Date("2026-09-15T00:00:00.000Z"), null),
    ).toBe(false);
    expect(
      isWithinSchedule(now, null, new Date("2026-09-14T12:00:00.000Z")),
    ).toBe(false);
  });
});

describe("visible hero showcase selection", () => {
  it("filters, sorts, and caps at three without requiring exactly three rows", () => {
    const items = [
      { id: "d", isActive: true, sortOrder: 40, startsAt: null, endsAt: null },
      { id: "b", isActive: true, sortOrder: 20, startsAt: null, endsAt: null },
      { id: "inactive", isActive: false, sortOrder: 5, startsAt: null, endsAt: null },
      { id: "a", isActive: true, sortOrder: 10, startsAt: null, endsAt: null },
      { id: "expired", isActive: true, sortOrder: 15, startsAt: null, endsAt: new Date("2026-01-01T00:00:00.000Z") },
      { id: "c", isActive: true, sortOrder: 30, startsAt: null, endsAt: null },
    ];

    const visible = selectVisibleHeroShowcaseItems(items, now);

    expect(MAX_HERO_SHOWCASE_ITEMS).toBe(3);
    expect(visible.map((item) => item.id)).toEqual(["a", "b", "c"]);
    expect(selectScheduledPlacements(items, now).map((item) => item.id)).toEqual([
      "a",
      "b",
      "c",
      "d",
    ]);
  });
});
