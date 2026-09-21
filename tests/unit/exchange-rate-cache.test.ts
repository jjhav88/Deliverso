import { describe, expect, it } from "vitest";
import {
  classifyFxSnapshotSet,
  FX_FRESH_TTL_MS,
  FX_STALE_TTL_MS,
} from "@/server/exchange-rates/policy";

describe("FX cache policy", () => {
  it("keeps a 12h fresh window and 96h stale fallback", () => {
    expect(FX_FRESH_TTL_MS).toBe(12 * 60 * 60 * 1000);
    expect(FX_STALE_TTL_MS).toBe(96 * 60 * 60 * 1000);
    expect(FX_STALE_TTL_MS).toBeGreaterThan(FX_FRESH_TTL_MS);
  });

  it("does not invent a 1:1 fallback when the set is expired or incomplete", () => {
    const now = new Date("2026-09-16T12:00:00Z");
    expect(classifyFxSnapshotSet([], now, 4)).toBe("incomplete");
    expect(
      classifyFxSnapshotSet(
        [new Date(now.getTime() - FX_STALE_TTL_MS - 1)],
        now,
        1,
      ),
    ).toBe("expired");
  });
});
