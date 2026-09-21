import { CART_MAX_QUANTITY } from "@/config/cart";

export function mergeCartQuantities(existing: number, incoming: number): number {
  return Math.min(CART_MAX_QUANTITY, existing + incoming);
}

export function cartBelongsToCustomer(
  cartCustomerId: string | null | undefined,
  customerId: string,
): boolean {
  return Boolean(cartCustomerId) && cartCustomerId === customerId;
}

export type LegacyCartDecision = "ignore" | "claim" | "merge" | "keep";

export function decideLegacyCartAction(input: {
  cookieCart: { id: string; customerId: string | null } | null;
  customerCartId: string | null;
  currentCustomerId: string;
}): LegacyCartDecision {
  const { cookieCart, customerCartId, currentCustomerId } = input;
  if (!cookieCart) {
    return "keep";
  }
  if (cookieCart.customerId && cookieCart.customerId !== currentCustomerId) {
    return "ignore";
  }
  if (!cookieCart.customerId) {
    return customerCartId ? "merge" : "claim";
  }
  if (customerCartId && cookieCart.id !== customerCartId) {
    return "merge";
  }
  return "keep";
}
