import { deliveryFeeMinor, estimatedTotalMinor, type FulfillmentMethod } from "@/modules/checkout/domain/fulfillment";

export function buildCheckoutTotals(input: {
  itemsSubtotalMinor: number;
  method: FulfillmentMethod | null | undefined;
  zoneFeeMinor: number | null | undefined;
}) {
  const fee = deliveryFeeMinor(input.method, input.zoneFeeMinor);
  return {
    itemsSubtotalMinor: Math.max(0, input.itemsSubtotalMinor),
    deliveryFeeMinor: fee,
    estimatedTotalMinor: estimatedTotalMinor(input.itemsSubtotalMinor, fee),
    currency: "MXN" as const,
  };
}

export type CheckoutStep = "datos" | "entrega" | "fecha" | "revisar";

export function nextCheckoutStep(input: {
  hasContact: boolean;
  hasFulfillment: boolean;
  hasSlot: boolean;
  requested?: string | null;
}): CheckoutStep {
  const allowed: CheckoutStep[] = ["datos"];
  if (input.hasContact) allowed.push("entrega");
  if (input.hasContact && input.hasFulfillment) allowed.push("fecha");
  if (input.hasContact && input.hasFulfillment && input.hasSlot) allowed.push("revisar");

  if (input.requested === "datos" || input.requested === "entrega" || input.requested === "fecha" || input.requested === "revisar") {
    if (allowed.includes(input.requested)) {
      return input.requested;
    }
  }
  return allowed[allowed.length - 1] ?? "datos";
}
