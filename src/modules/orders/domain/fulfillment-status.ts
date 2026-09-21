import type { FulfillmentMethod } from "@/modules/checkout/domain/fulfillment";

export const fulfillmentStatuses = [
  "PENDING",
  "CONFIRMED",
  "IN_PRODUCTION",
  "READY",
  "OUT_FOR_DELIVERY",
  "COMPLETED",
  "CANCELLED",
] as const;

export type FulfillmentStatus = (typeof fulfillmentStatuses)[number];

export function isFulfillmentStatus(value: string): value is FulfillmentStatus {
  return (fulfillmentStatuses as readonly string[]).includes(value);
}

export function canTransitionFulfillmentStatus(input: {
  from: FulfillmentStatus;
  to: FulfillmentStatus;
  method: FulfillmentMethod;
  orderPaid: boolean;
}): boolean {
  if (input.from === input.to) {
    return true;
  }
  if (!input.orderPaid && input.to !== "CANCELLED") {
    return false;
  }
  if (input.from === "COMPLETED" || input.from === "CANCELLED") {
    return false;
  }
  if (input.to === "CANCELLED") {
    return true;
  }

  const allowed = nextFulfillmentStatuses(input.from, input.method);
  return allowed.includes(input.to);
}

export function nextFulfillmentStatuses(
  from: FulfillmentStatus,
  method: FulfillmentMethod,
): FulfillmentStatus[] {
  switch (from) {
    case "PENDING":
      return ["CONFIRMED"];
    case "CONFIRMED":
      return ["IN_PRODUCTION"];
    case "IN_PRODUCTION":
      return ["READY"];
    case "READY":
      return method === "DELIVERY" ? ["OUT_FOR_DELIVERY"] : ["COMPLETED"];
    case "OUT_FOR_DELIVERY":
      return method === "DELIVERY" ? ["COMPLETED"] : [];
    default:
      return [];
  }
}
