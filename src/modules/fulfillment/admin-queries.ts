import "server-only";
import { getPrisma } from "@/server/db/prisma";
import { hasRuntimeDatabaseUrl } from "@/server/db/env";
import type { FulfillmentMethod } from "@/modules/checkout/domain/fulfillment";

const methods: FulfillmentMethod[] = ["DELIVERY", "PICKUP"];

export async function ensureWeeklySchedules() {
  if (!hasRuntimeDatabaseUrl()) {
    return [];
  }
  const prisma = getPrisma();
  for (const method of methods) {
    for (let day = 1; day <= 7; day += 1) {
      await prisma.fulfillmentWeeklySchedule.upsert({
        where: { fulfillmentMethod_dayOfWeek: { fulfillmentMethod: method, dayOfWeek: day } },
        update: {},
        create: { fulfillmentMethod: method, dayOfWeek: day, isActive: false },
      });
    }
  }
  return prisma.fulfillmentWeeklySchedule.findMany({
    orderBy: [{ fulfillmentMethod: "asc" }, { dayOfWeek: "asc" }],
    include: { windows: { orderBy: { sortOrder: "asc" } } },
  });
}

export async function getFulfillmentAdminState() {
  if (!hasRuntimeDatabaseUrl()) {
    return {
      zones: [],
      pickups: [],
      schedules: [],
      blackouts: [],
      configured: false,
    };
  }

  const prisma = getPrisma();
  const [zones, pickups, schedules, blackouts] = await Promise.all([
    prisma.deliveryZone.findMany({
      orderBy: { sortOrder: "asc" },
      include: { postalCodes: { orderBy: { postalCode: "asc" } } },
    }),
    prisma.pickupLocation.findMany({ orderBy: { sortOrder: "asc" } }),
    ensureWeeklySchedules(),
    prisma.fulfillmentBlackoutDate.findMany({ orderBy: { date: "asc" } }),
  ]);

  const hasCoverage =
    pickups.some((item) => item.isActive) ||
    zones.some((zone) => zone.isActive && zone.postalCodes.length > 0);
  const hasWindows = schedules.some(
    (day) => day.isActive && day.windows.some((window) => window.isActive),
  );

  return {
    zones: zones.map((zone) => ({
      id: zone.id,
      name: zone.name,
      isActive: zone.isActive,
      sortOrder: zone.sortOrder,
      deliveryFeeMinor: zone.deliveryFeeMinor,
      minimumOrderMinor: zone.minimumOrderMinor,
      postalCodes: zone.postalCodes.map((code) => ({ postalCode: code.postalCode })),
    })),
    pickups: pickups.map((pickup) => ({
      id: pickup.id,
      name: pickup.name,
      isActive: pickup.isActive,
      sortOrder: pickup.sortOrder,
      addressLine: pickup.addressLine,
      city: pickup.city,
      state: pickup.state,
      postalCode: pickup.postalCode,
      instructions: pickup.instructions,
    })),
    schedules: schedules.map((day) => ({
      id: day.id,
      fulfillmentMethod: day.fulfillmentMethod,
      dayOfWeek: day.dayOfWeek,
      isActive: day.isActive,
      windows: day.windows
        .filter((window) => window.isActive)
        .map((window) => ({
          id: window.id,
          startTime: window.startTime,
          endTime: window.endTime,
          label: window.label,
          isActive: window.isActive,
        })),
    })),
    blackouts: blackouts.map((item) => ({
      id: item.id,
      date: item.date.toISOString().slice(0, 10),
      fulfillmentMethod: item.fulfillmentMethod,
      reason: item.reason,
      isActive: item.isActive,
    })),
    configured: hasCoverage && hasWindows,
  };
}
