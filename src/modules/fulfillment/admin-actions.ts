"use server";

import { revalidatePath } from "next/cache";
import { writeAdminAuditLog } from "@/modules/audit/write-admin-audit-log";
import { requireRole } from "@/modules/auth/authorization/require-role";
import {
  normalizeMexicanPostalCode,
  parsePostalCodeListDetailed,
} from "@/modules/checkout/domain/postal-code";
import { isFulfillmentMethod } from "@/modules/checkout/domain/fulfillment";
import { moneyInputToMinor } from "@/modules/catalog/money-input";
import { getPrisma } from "@/server/db/prisma";
import { Prisma } from "@/generated/prisma/client";
import type { FulfillmentAdminState } from "@/modules/fulfillment/admin-action-state";
import { planScheduleWindowSync } from "@/modules/fulfillment/domain/sync-windows";

function refresh() {
  revalidatePath("/admin/settings");
}

function refreshCheckoutAvailability() {
  revalidatePath("/checkout");
  revalidatePath("/en/checkout");
}

function formString(value: FormDataEntryValue | null): string {
  return typeof value === "string" ? value : "";
}

function parseScheduleWindows(formData: FormData) {
  const starts = formData.getAll("startTime").map(formString);
  const ends = formData.getAll("endTime").map(formString);
  const labels = formData.getAll("label").map(formString);
  const windowIds = formData.getAll("windowId").map(formString);
  return starts
    .map((startTime, index) => ({
      id: windowIds[index] || "",
      startTime,
      endTime: ends[index] ?? "",
      label: labels[index]?.trim() || null,
    }))
    .filter((window) => window.startTime || window.endTime || window.id);
}

function staleScheduleState(): FulfillmentAdminState {
  return {
    error: "La configuración cambió. Actualizamos la información; inténtalo nuevamente.",
    success: null,
    code: "STALE_SCHEDULE_STATE",
  };
}

function isPrismaKnownError(error: unknown): error is Prisma.PrismaClientKnownRequestError {
  return error instanceof Prisma.PrismaClientKnownRequestError;
}

export async function saveDeliveryZoneAction(
  previousState: FulfillmentAdminState,
  formData: FormData,
): Promise<FulfillmentAdminState> {
  void previousState;
  const admin = await requireRole(["ADMIN", "SUPER_ADMIN"]);
  const id = String(formData.get("id") ?? "");
  const name = String(formData.get("name") ?? "").trim();
  const sortOrder = Number(formData.get("sortOrder") ?? 0);
  const isActive = formData.get("isActive") === "on";
  if (!name) {
    return { error: "El nombre de la zona es obligatorio.", success: null };
  }

  let fee: number;
  let minimum: number | null;
  try {
    const parsedFee = moneyInputToMinor(String(formData.get("deliveryFee") ?? ""));
    fee = parsedFee ?? 0;
    const rawMin = String(formData.get("minimumOrder") ?? "").trim();
    minimum = rawMin ? moneyInputToMinor(rawMin) : null;
  } catch {
    return { error: "El costo o el mínimo no son válidos.", success: null };
  }

  const { codes, invalid } = parsePostalCodeListDetailed(String(formData.get("postalCodes") ?? ""));
  if (invalid.length > 0) {
    return {
      error: `Códigos postales inválidos: ${invalid.join(", ")}. Usa exactamente 5 dígitos y conserva ceros iniciales.`,
      success: null,
    };
  }
  const prisma = getPrisma();
  const zone = id
    ? await prisma.deliveryZone.update({
        where: { id },
        data: { name, isActive, sortOrder: Number.isFinite(sortOrder) ? sortOrder : 0, deliveryFeeMinor: fee, minimumOrderMinor: minimum },
      })
    : await prisma.deliveryZone.create({
        data: { name, isActive, sortOrder: Number.isFinite(sortOrder) ? sortOrder : 0, deliveryFeeMinor: fee, minimumOrderMinor: minimum },
      });

  await prisma.deliveryPostalCode.deleteMany({ where: { deliveryZoneId: zone.id } });
  if (codes.length > 0) {
    await prisma.deliveryPostalCode.createMany({
      data: codes.map((postalCode) => ({
        deliveryZoneId: zone.id,
        countryCode: "MX",
        postalCode,
      })),
      skipDuplicates: true,
    });
  }

  await writeAdminAuditLog({
    actorAdminId: admin.id,
    action: id ? "DELIVERY_ZONE_UPDATED" : "DELIVERY_ZONE_CREATED",
    resourceType: "DeliveryZone",
    resourceId: zone.id,
    metadata: { name, active: isActive },
  });
  refresh();
  return { error: null, success: "Zona guardada." };
}

export async function savePickupLocationAction(
  previousState: FulfillmentAdminState,
  formData: FormData,
): Promise<FulfillmentAdminState> {
  void previousState;
  const admin = await requireRole(["ADMIN", "SUPER_ADMIN"]);
  const id = String(formData.get("id") ?? "");
  const name = String(formData.get("name") ?? "").trim();
  const addressLine = String(formData.get("addressLine") ?? "").trim();
  const city = String(formData.get("city") ?? "").trim();
  const state = String(formData.get("state") ?? "").trim();
  const postalCode = normalizeMexicanPostalCode(formData.get("postalCode"));
  if (!name || !addressLine || !city || !state) {
    return { error: "Completa el punto de recogida.", success: null };
  }
  if (!postalCode) {
    return {
      error: "El código postal debe tener exactamente 5 dígitos. Conserva ceros iniciales.",
      success: null,
    };
  }

  const data = {
    name,
    addressLine,
    city,
    state,
    postalCode,
    countryCode: "MX",
    instructions: String(formData.get("instructions") ?? "").trim() || null,
    isActive: formData.get("isActive") === "on",
    sortOrder: Number(formData.get("sortOrder") ?? 0) || 0,
  };

  const location = id
    ? await getPrisma().pickupLocation.update({ where: { id }, data })
    : await getPrisma().pickupLocation.create({ data });

  await writeAdminAuditLog({
    actorAdminId: admin.id,
    action: id ? "PICKUP_LOCATION_UPDATED" : "PICKUP_LOCATION_CREATED",
    resourceType: "PickupLocation",
    resourceId: location.id,
    metadata: { name, active: data.isActive },
  });
  refresh();
  return { error: null, success: "Punto de recogida guardado." };
}

export async function saveScheduleDayAction(
  previousState: FulfillmentAdminState,
  formData: FormData,
): Promise<FulfillmentAdminState> {
  void previousState;
  const admin = await requireRole(["ADMIN", "SUPER_ADMIN"]);
  const methodRaw = formString(formData.get("fulfillmentMethod"));
  const dayOfWeek = Number.parseInt(formString(formData.get("dayOfWeek")), 10);
  if (!isFulfillmentMethod(methodRaw) || !Number.isInteger(dayOfWeek) || dayOfWeek < 1 || dayOfWeek > 7) {
    return { error: "Horario inválido.", success: null, code: "INVALID_SCHEDULE" };
  }

  const parsedWindows = parseScheduleWindows(formData);
  if (parsedWindows.some((window) => Boolean(window.startTime) !== Boolean(window.endTime))) {
    return {
      error: "Cada franja debe tener un horario válido.",
      success: null,
      code: "INVALID_WINDOW",
    };
  }
  const windows = parsedWindows.filter((window) => window.startTime && window.endTime);
  const prisma = getPrisma();

  try {
    const saved = await prisma.$transaction(async (tx) => {
      const schedule = await tx.fulfillmentWeeklySchedule.findUnique({
        where: {
          fulfillmentMethod_dayOfWeek: {
            fulfillmentMethod: methodRaw,
            dayOfWeek,
          },
        },
        include: {
          windows: {
            include: { _count: { select: { drafts: true } } },
          },
        },
      });
      if (!schedule) {
        return { kind: "missing" as const };
      }

      const clientScheduleId = formString(formData.get("scheduleId"));
      if (clientScheduleId && clientScheduleId !== schedule.id) {
        return { kind: "stale" as const };
      }

      const payloadIds = windows.map((window) => window.id).filter(Boolean);
      const unknownIds = payloadIds.filter((id) => !schedule.windows.some((row) => row.id === id));
      const foreignRows =
        unknownIds.length > 0
          ? await tx.fulfillmentTimeWindow.findMany({
              where: { id: { in: unknownIds } },
              select: { id: true, scheduleId: true },
            })
          : [];

      const plan = planScheduleWindowSync({
        scheduleId: schedule.id,
        payload: windows,
        existing: schedule.windows.map((row) => ({
          id: row.id,
          scheduleId: row.scheduleId,
          referenced: row._count.drafts > 0,
        })),
        foreignById: new Map(foreignRows.map((row) => [row.id, row])),
      });
      if (!plan.ok) {
        return { kind: "invalid" as const, plan };
      }

      await tx.fulfillmentWeeklySchedule.update({
        where: { id: schedule.id },
        data: { isActive: formData.get("isActive") === "on" },
      });

      let reconciled = plan.reconciled;
      for (const op of plan.ops) {
        if (op.type === "update") {
          const updated = await tx.fulfillmentTimeWindow.updateMany({
            where: { id: op.id, scheduleId: schedule.id },
            data: {
              startTime: op.startTime,
              endTime: op.endTime,
              label: op.label,
              isActive: true,
              sortOrder: op.sortOrder,
            },
          });
          if (updated.count === 0) {
            await tx.fulfillmentTimeWindow.create({
              data: {
                scheduleId: schedule.id,
                startTime: op.startTime,
                endTime: op.endTime,
                label: op.label,
                isActive: true,
                sortOrder: op.sortOrder,
              },
            });
            reconciled = true;
          }
        } else if (op.type === "create") {
          await tx.fulfillmentTimeWindow.create({
            data: {
              scheduleId: schedule.id,
              startTime: op.startTime,
              endTime: op.endTime,
              label: op.label,
              isActive: true,
              sortOrder: op.sortOrder,
            },
          });
        } else if (op.type === "delete") {
          await tx.fulfillmentTimeWindow.deleteMany({
            where: { id: op.id, scheduleId: schedule.id, drafts: { none: {} } },
          });
        } else {
          await tx.fulfillmentTimeWindow.updateMany({
            where: { id: op.id, scheduleId: schedule.id },
            data: { isActive: false },
          });
        }
      }

      const persisted = await tx.fulfillmentTimeWindow.findMany({
        where: { scheduleId: schedule.id, isActive: true },
        orderBy: { sortOrder: "asc" },
        select: { id: true, startTime: true, endTime: true, label: true },
      });

      return {
        kind: "ok" as const,
        scheduleId: schedule.id,
        windows: persisted,
        reconciled,
      };
    });

    if (saved.kind === "missing") {
      return { error: "Horario inválido.", success: null, code: "INVALID_SCHEDULE" };
    }
    if (saved.kind === "stale") {
      return staleScheduleState();
    }
    if (saved.kind === "invalid") {
      return { error: saved.plan.message, success: null, code: saved.plan.code };
    }

    await writeAdminAuditLog({
      actorAdminId: admin.id,
      action: "FULFILLMENT_SCHEDULE_UPDATED",
      resourceType: "FulfillmentWeeklySchedule",
      resourceId: saved.scheduleId,
    });
    refresh();
    refreshCheckoutAvailability();
    return {
      error: null,
      success: saved.reconciled
        ? "Horario guardado. Actualizamos franjas desactualizadas."
        : "Horario guardado correctamente.",
      code: saved.reconciled ? "RECONCILED_WINDOWS" : null,
      windows: saved.windows,
      revision: `${Date.now()}`,
    };
  } catch (error) {
    if (isPrismaKnownError(error) && error.code === "P2025") {
      return staleScheduleState();
    }
    return {
      error: "No pudimos guardar el horario. Inténtalo de nuevo.",
      success: null,
      code: "SCHEDULE_SAVE_FAILED",
    };
  }
}

export async function saveBlackoutAction(
  previousState: FulfillmentAdminState,
  formData: FormData,
): Promise<FulfillmentAdminState> {
  void previousState;
  const admin = await requireRole(["ADMIN", "SUPER_ADMIN"]);
  const id = String(formData.get("id") ?? "");
  const date = String(formData.get("date") ?? "");
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return { error: "Fecha inválida.", success: null };
  }
  const methodRaw = String(formData.get("fulfillmentMethod") ?? "");
  const fulfillmentMethod = isFulfillmentMethod(methodRaw) ? methodRaw : null;
  const data = {
    date: new Date(`${date}T00:00:00.000Z`),
    fulfillmentMethod,
    reason: String(formData.get("reason") ?? "").trim() || null,
    isActive: formData.get("isActive") !== "off",
  };

  const row = id
    ? await getPrisma().fulfillmentBlackoutDate.update({ where: { id }, data })
    : await getPrisma().fulfillmentBlackoutDate.create({ data });

  await writeAdminAuditLog({
    actorAdminId: admin.id,
    action: id ? "BLACKOUT_DATE_UPDATED" : "BLACKOUT_DATE_CREATED",
    resourceType: "FulfillmentBlackoutDate",
    resourceId: row.id,
    metadata: { date },
  });
  refresh();
  return { error: null, success: "Fecha no disponible guardada." };
}
