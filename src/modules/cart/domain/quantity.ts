import { CART_MAX_QUANTITY, CART_MIN_QUANTITY } from "@/config/cart";

export function parseCartQuantity(value: unknown): number | null {
  const numeric =
    typeof value === "number"
      ? value
      : typeof value === "string"
        ? Number.parseInt(value, 10)
        : Number.NaN;

  if (!Number.isInteger(numeric)) {
    return null;
  }
  if (numeric < CART_MIN_QUANTITY || numeric > CART_MAX_QUANTITY) {
    return null;
  }
  return numeric;
}
