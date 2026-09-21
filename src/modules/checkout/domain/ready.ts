import { isDraftExpired, type CheckoutDraftStatus } from "@/modules/checkout/domain/status";
import { canCustomerStartCheckout } from "@/modules/checkout/domain/cart-gate";
import { canEnterCheckout } from "@/modules/checkout/domain/cart-gate";
import {
  fulfillmentInvariantHolds,
  meetsMinimumOrder,
  type FulfillmentMethod,
} from "@/modules/checkout/domain/fulfillment";
import { isRequestedSlotValid } from "@/modules/checkout/domain/dates";
import type { ScheduleDay } from "@/modules/checkout/domain/dates";

export type CheckoutReadyIssue =
  | "CUSTOMER_INACTIVE"
  | "CART_EMPTY"
  | "CART_INVALID"
  | "CONTACT_INVALID"
  | "FULFILLMENT_INVALID"
  | "ADDRESS_INVALID"
  | "PICKUP_INVALID"
  | "ZONE_INACTIVE"
  | "MINIMUM_ORDER"
  | "SLOT_INVALID"
  | "PRICING_INVALID"
  | "DRAFT_EXPIRED";

export type ReadyInput = {
  now: Date;
  customerStatus: "ACTIVE" | "BLOCKED";
  draftStatus: CheckoutDraftStatus;
  expiresAt: Date;
  contactName: string | null;
  contactEmail: string | null;
  contactPhone: string | null;
  fulfillmentMethod: FulfillmentMethod | null;
  deliveryZoneId: string | null;
  pickupLocationId: string | null;
  requestedDate: string | null;
  timeWindowId: string | null;
  itemsSubtotalMinor: number;
  pricingValid: boolean;
  cart: {
    itemCount: number;
    items: readonly { valid: boolean }[];
    issues: readonly { code: string }[];
  };
  zone: { id: string; isActive: boolean; minimumOrderMinor: number | null } | null;
  pickup: { id: string; isActive: boolean } | null;
  address: { postalCode: string; street: string; city: string; state: string; countryCode: string } | null;
  leadMinutes: number;
  schedule: readonly ScheduleDay[];
  blackouts: readonly {
    date: string;
    fulfillmentMethod: FulfillmentMethod | null;
    isActive: boolean;
  }[];
};

export function evaluateCheckoutReady(input: ReadyInput): CheckoutReadyIssue[] {
  const issues: CheckoutReadyIssue[] = [];
  if (!canCustomerStartCheckout(input.customerStatus)) {
    issues.push("CUSTOMER_INACTIVE");
  }
  if (isDraftExpired(input.expiresAt, input.now) || input.draftStatus === "EXPIRED") {
    issues.push("DRAFT_EXPIRED");
  }
  if (!canEnterCheckout(input.cart)) {
    issues.push(input.cart.itemCount === 0 ? "CART_EMPTY" : "CART_INVALID");
  }
  if (!input.pricingValid || input.itemsSubtotalMinor < 0) {
    issues.push("PRICING_INVALID");
  }
  if (!input.contactName?.trim() || !input.contactEmail?.trim() || !input.contactPhone?.trim()) {
    issues.push("CONTACT_INVALID");
  }
  if (
    !fulfillmentInvariantHolds({
      method: input.fulfillmentMethod,
      deliveryZoneId: input.deliveryZoneId,
      pickupLocationId: input.pickupLocationId,
    })
  ) {
    issues.push("FULFILLMENT_INVALID");
  }
  if (input.fulfillmentMethod === "DELIVERY") {
    if (!input.address?.postalCode || !input.address.street || !input.address.city || !input.address.state) {
      issues.push("ADDRESS_INVALID");
    }
    if (!input.zone || !input.zone.isActive || input.zone.id !== input.deliveryZoneId) {
      issues.push("ZONE_INACTIVE");
    }
    if (input.zone && !meetsMinimumOrder(input.itemsSubtotalMinor, input.zone.minimumOrderMinor)) {
      issues.push("MINIMUM_ORDER");
    }
  }
  if (input.fulfillmentMethod === "PICKUP") {
    if (!input.pickup || !input.pickup.isActive || input.pickup.id !== input.pickupLocationId) {
      issues.push("PICKUP_INVALID");
    }
  }
  if (
    !input.fulfillmentMethod ||
    !input.requestedDate ||
    !input.timeWindowId ||
    !isRequestedSlotValid({
      now: input.now,
      leadMinutes: input.leadMinutes,
      method: input.fulfillmentMethod,
      date: input.requestedDate,
      windowId: input.timeWindowId,
      schedule: input.schedule,
      blackouts: input.blackouts,
    })
  ) {
    issues.push("SLOT_INVALID");
  }
  return issues;
}

export function canMarkCheckoutReady(input: ReadyInput): boolean {
  return evaluateCheckoutReady(input).length === 0;
}
