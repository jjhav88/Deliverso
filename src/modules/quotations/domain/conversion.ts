import type { FulfillmentMethod } from "@/modules/checkout/domain/fulfillment";
import { canCustomerAccept, isQuoteExpired } from "@/modules/quotations/domain/lifecycle";
import { isValidQuotedTotal } from "@/modules/quotations/domain/money";
import type { QuotationStatus } from "@/modules/quotations/domain/types";

export type QuotationConversionInput = {
  ownerId: string;
  customerId: string;
  status: QuotationStatus;
  now: Date;
  validUntil: Date | null;
  hasActiveOffer: boolean;
  alreadyHasOrder: boolean;
  totals: { subtotalMinor: number; deliveryFeeMinor: number; totalMinor: number } | null;
  fulfillmentMethod: FulfillmentMethod | null;
  hasAddress: boolean;
  hasPickup: boolean;
};

export type QuotationConversionResult =
  | { ok: true; idempotent: boolean }
  | {
      ok: false;
      code: "NOT_FOUND" | "EXPIRED" | "UNAVAILABLE" | "INVALID_TOTAL" | "ADDRESS_REQUIRED" | "PICKUP_REQUIRED";
    };

export function evaluateQuotationConversion(input: QuotationConversionInput): QuotationConversionResult {
  if (input.ownerId !== input.customerId) {
    return { ok: false, code: "NOT_FOUND" };
  }
  if (input.alreadyHasOrder) {
    return { ok: true, idempotent: true };
  }
  if (!input.hasActiveOffer || !canCustomerAccept(input.status, input.now, input.validUntil)) {
    return { ok: false, code: isQuoteExpired(input.now, input.validUntil) ? "EXPIRED" : "UNAVAILABLE" };
  }
  if (!input.totals || !isValidQuotedTotal(input.totals)) {
    return { ok: false, code: "INVALID_TOTAL" };
  }
  if (input.fulfillmentMethod === "DELIVERY" && !input.hasAddress) {
    return { ok: false, code: "ADDRESS_REQUIRED" };
  }
  if (input.fulfillmentMethod === "PICKUP" && !input.hasPickup) {
    return { ok: false, code: "PICKUP_REQUIRED" };
  }
  return { ok: true, idempotent: false };
}

export function nextOfferVersion(currentMaxVersion: number): number {
  return Math.max(0, currentMaxVersion) + 1;
}
