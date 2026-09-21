import { parseClock } from "@/modules/checkout/domain/timezone";
import { hasOverlappingWindows, windowEndAfterStart } from "@/modules/checkout/domain/schedule";

export type ScheduleWindowInput = {
  id?: string | null;
  startTime: string;
  endTime: string;
  label: string | null;
};

export type ExistingScheduleWindow = {
  id: string;
  scheduleId: string;
  referenced: boolean;
};

export type ForeignWindowRef = {
  id: string;
  scheduleId: string;
};

export type WindowSyncErrorCode = "INVALID_WINDOW" | "OVERLAP" | "FOREIGN_WINDOW";

export type WindowSyncOp =
  | {
      type: "update";
      id: string;
      startTime: string;
      endTime: string;
      label: string | null;
      sortOrder: number;
    }
  | {
      type: "create";
      startTime: string;
      endTime: string;
      label: string | null;
      sortOrder: number;
      reconciled: boolean;
    }
  | { type: "delete"; id: string }
  | { type: "deactivate"; id: string };

export type WindowSyncPlan =
  | { ok: true; ops: WindowSyncOp[]; reconciled: boolean }
  | { ok: false; code: WindowSyncErrorCode; message: string };

export function isValidClock(value: string): boolean {
  return parseClock(value) !== null;
}

export function validateScheduleWindows(
  payload: readonly ScheduleWindowInput[],
): { ok: true } | { ok: false; code: Exclude<WindowSyncErrorCode, "FOREIGN_WINDOW">; message: string } {
  for (const window of payload) {
    if (!isValidClock(window.startTime) || !isValidClock(window.endTime)) {
      return { ok: false, code: "INVALID_WINDOW", message: "Cada franja debe tener un horario válido." };
    }
    if (!windowEndAfterStart(window.startTime, window.endTime)) {
      return {
        ok: false,
        code: "INVALID_WINDOW",
        message: "Cada franja debe terminar después de iniciar.",
      };
    }
  }
  if (hasOverlappingWindows(payload)) {
    return {
      ok: false,
      code: "OVERLAP",
      message: "Las franjas del mismo día no pueden solaparse.",
    };
  }
  return { ok: true };
}

export function planScheduleWindowSync(input: {
  scheduleId: string;
  payload: readonly ScheduleWindowInput[];
  existing: readonly ExistingScheduleWindow[];
  foreignById?: ReadonlyMap<string, ForeignWindowRef>;
}): WindowSyncPlan {
  const validation = validateScheduleWindows(input.payload);
  if (!validation.ok) {
    return validation;
  }

  const existingById = new Map(input.existing.map((window) => [window.id, window]));
  const foreignById = input.foreignById ?? new Map<string, ForeignWindowRef>();
  const keptIds = new Set<string>();
  const ops: WindowSyncOp[] = [];
  let reconciled = false;

  for (const [sortOrder, window] of input.payload.entries()) {
    const id = window.id?.trim() ?? "";
    if (!id) {
      ops.push({
        type: "create",
        startTime: window.startTime,
        endTime: window.endTime,
        label: window.label,
        sortOrder,
        reconciled: false,
      });
      continue;
    }

    const existing = existingById.get(id);
    if (existing) {
      ops.push({
        type: "update",
        id,
        startTime: window.startTime,
        endTime: window.endTime,
        label: window.label,
        sortOrder,
      });
      keptIds.add(id);
      continue;
    }

    const foreign = foreignById.get(id);
    if (foreign && foreign.scheduleId !== input.scheduleId) {
      return {
        ok: false,
        code: "FOREIGN_WINDOW",
        message: "Esa franja pertenece a otro horario.",
      };
    }

    ops.push({
      type: "create",
      startTime: window.startTime,
      endTime: window.endTime,
      label: window.label,
      sortOrder,
      reconciled: true,
    });
    reconciled = true;
  }

  for (const existing of input.existing) {
    if (keptIds.has(existing.id)) {
      continue;
    }
    ops.push(
      existing.referenced ? { type: "deactivate", id: existing.id } : { type: "delete", id: existing.id },
    );
  }

  return { ok: true, ops, reconciled };
}
