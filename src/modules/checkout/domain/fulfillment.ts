export const fulfillmentMethods = ["DELIVERY", "PICKUP"] as const;

export type FulfillmentMethod = (typeof fulfillmentMethods)[number];

export function isFulfillmentMethod(value: string): value is FulfillmentMethod {
  return (fulfillmentMethods as readonly string[]).includes(value);
}

export function deliveryFeeMinor(
  method: FulfillmentMethod | null | undefined,
  zoneFeeMinor: number | null | undefined,
): number {
  if (method === "PICKUP") {
    return 0;
  }
  if (method === "DELIVERY") {
    return Math.max(0, zoneFeeMinor ?? 0);
  }
  return 0;
}

export function meetsMinimumOrder(
  itemsSubtotalMinor: number,
  minimumOrderMinor: number | null | undefined,
): boolean {
  if (minimumOrderMinor === null || minimumOrderMinor === undefined) {
    return true;
  }
  return itemsSubtotalMinor >= minimumOrderMinor;
}

export function estimatedTotalMinor(itemsSubtotalMinor: number, feeMinor: number): number {
  return Math.max(0, itemsSubtotalMinor) + Math.max(0, feeMinor);
}

export function fulfillmentInvariantHolds(input: {
  method: FulfillmentMethod | null | undefined;
  deliveryZoneId: string | null | undefined;
  pickupLocationId: string | null | undefined;
}): boolean {
  if (input.method === "DELIVERY") {
    return Boolean(input.deliveryZoneId) && !input.pickupLocationId;
  }
  if (input.method === "PICKUP") {
    return Boolean(input.pickupLocationId) && !input.deliveryZoneId;
  }
  return false;
}
