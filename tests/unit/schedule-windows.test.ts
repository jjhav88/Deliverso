import { describe, expect, it } from "vitest";
import { hasOverlappingWindows, windowEndAfterStart } from "@/modules/checkout/domain/schedule";
import {
  planScheduleWindowSync,
  validateScheduleWindows,
} from "@/modules/fulfillment/domain/sync-windows";

const scheduleId = "schedule-friday";

function existing(id: string, referenced = false) {
  return { id, scheduleId, referenced };
}

describe("schedule window sync", () => {
  it("A) updates an existing window id", () => {
    const plan = planScheduleWindowSync({
      scheduleId,
      existing: [existing("win-1")],
      payload: [{ id: "win-1", startTime: "10:00", endTime: "14:00", label: "Mañana" }],
    });
    expect(plan.ok).toBe(true);
    if (!plan.ok) {
      return;
    }
    expect(plan.reconciled).toBe(false);
    expect(plan.ops).toEqual([
      {
        type: "update",
        id: "win-1",
        startTime: "10:00",
        endTime: "14:00",
        label: "Mañana",
        sortOrder: 0,
      },
    ]);
  });

  it("B) creates a window without id", () => {
    const plan = planScheduleWindowSync({
      scheduleId,
      existing: [],
      payload: [{ id: "", startTime: "10:00", endTime: "14:00", label: null }],
    });
    expect(plan.ok).toBe(true);
    if (!plan.ok) {
      return;
    }
    expect(plan.ops).toEqual([
      {
        type: "create",
        startTime: "10:00",
        endTime: "14:00",
        label: null,
        sortOrder: 0,
        reconciled: false,
      },
    ]);
  });

  it("C) reconciles a stale id without treating it as an update", () => {
    const plan = planScheduleWindowSync({
      scheduleId,
      existing: [],
      payload: [{ id: "stale-id", startTime: "10:00", endTime: "14:00", label: "Mañana" }],
    });
    expect(plan.ok).toBe(true);
    if (!plan.ok) {
      return;
    }
    expect(plan.reconciled).toBe(true);
    expect(plan.ops.some((op) => op.type === "update")).toBe(false);
    expect(plan.ops).toEqual([
      {
        type: "create",
        startTime: "10:00",
        endTime: "14:00",
        label: "Mañana",
        sortOrder: 0,
        reconciled: true,
      },
    ]);
  });

  it("D) rejects an id that belongs to another schedule", () => {
    const plan = planScheduleWindowSync({
      scheduleId,
      existing: [],
      payload: [{ id: "foreign-1", startTime: "10:00", endTime: "14:00", label: null }],
      foreignById: new Map([["foreign-1", { id: "foreign-1", scheduleId: "schedule-other" }]]),
    });
    expect(plan).toEqual({
      ok: false,
      code: "FOREIGN_WINDOW",
      message: "Esa franja pertenece a otro horario.",
    });
  });

  it("E) deletes an unreferenced window missing from the payload", () => {
    const plan = planScheduleWindowSync({
      scheduleId,
      existing: [existing("keep"), existing("drop")],
      payload: [{ id: "keep", startTime: "10:00", endTime: "14:00", label: null }],
    });
    expect(plan.ok).toBe(true);
    if (!plan.ok) {
      return;
    }
    expect(plan.ops.some((op) => op.type === "delete" && op.id === "drop")).toBe(true);
    expect(plan.ops.some((op) => op.type === "deactivate")).toBe(false);
  });

  it("F) deactivates a referenced window instead of deleting it", () => {
    const plan = planScheduleWindowSync({
      scheduleId,
      existing: [existing("used", true)],
      payload: [],
    });
    expect(plan.ok).toBe(true);
    if (!plan.ok) {
      return;
    }
    expect(plan.ops).toEqual([{ type: "deactivate", id: "used" }]);
  });

  it("G) rejects overlapping windows before any write", () => {
    expect(hasOverlappingWindows([
      { startTime: "10:00", endTime: "14:00" },
      { startTime: "13:00", endTime: "16:00" },
    ])).toBe(true);
    const plan = planScheduleWindowSync({
      scheduleId,
      existing: [],
      payload: [
        { id: "", startTime: "10:00", endTime: "14:00", label: null },
        { id: "", startTime: "13:00", endTime: "16:00", label: null },
      ],
    });
    expect(plan).toEqual({
      ok: false,
      code: "OVERLAP",
      message: "Las franjas del mismo día no pueden solaparse.",
    });
  });

  it("H) rejects end <= start", () => {
    expect(windowEndAfterStart("14:00", "10:00")).toBe(false);
    expect(windowEndAfterStart("10:00", "10:00")).toBe(false);
    expect(validateScheduleWindows([{ startTime: "14:00", endTime: "10:00", label: null }])).toEqual({
      ok: false,
      code: "INVALID_WINDOW",
      message: "Cada franja debe terminar después de iniciar.",
    });
  });

  it("I) is idempotent for the same payload", () => {
    const input = {
      scheduleId,
      existing: [existing("win-1"), existing("win-2")],
      payload: [
        { id: "win-1", startTime: "10:00", endTime: "14:00", label: null },
        { id: "win-2", startTime: "14:00", endTime: "18:00", label: null },
      ],
    };
    const first = planScheduleWindowSync(input);
    const second = planScheduleWindowSync(input);
    expect(first).toEqual(second);
    expect(first.ok && first.ops.every((op) => op.type === "update")).toBe(true);
  });

  it("J) after persist and refresh, a second save only updates", () => {
    const first = planScheduleWindowSync({
      scheduleId,
      existing: [],
      payload: [
        { id: "", startTime: "10:00", endTime: "14:00", label: null },
        { id: "stale", startTime: "14:00", endTime: "18:00", label: null },
      ],
    });
    expect(first.ok).toBe(true);
    if (!first.ok) {
      return;
    }
    const persisted = first.ops
      .filter((op) => op.type === "create")
      .map((op, index) => existing(`persisted-${index}`));
    const second = planScheduleWindowSync({
      scheduleId,
      existing: persisted,
      payload: [
        { id: "persisted-0", startTime: "10:00", endTime: "14:00", label: null },
        { id: "persisted-1", startTime: "15:00", endTime: "19:00", label: null },
      ],
    });
    expect(second.ok).toBe(true);
    if (!second.ok) {
      return;
    }
    expect(second.reconciled).toBe(false);
    expect(second.ops.every((op) => op.type === "update")).toBe(true);
    expect(second.ops.some((op) => op.type === "update" && op.endTime === "19:00")).toBe(true);
  });

  it("allows adjacent boundaries 10:00–14:00 and 14:00–18:00", () => {
    const plan = planScheduleWindowSync({
      scheduleId,
      existing: [],
      payload: [
        { id: "", startTime: "10:00", endTime: "14:00", label: null },
        { id: "", startTime: "14:00", endTime: "18:00", label: null },
      ],
    });
    expect(plan.ok).toBe(true);
  });
});
