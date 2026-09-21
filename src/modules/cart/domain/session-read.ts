import { generateCartToken, hashCartToken } from "@/modules/cart/domain/token";

export type ShopperCartStatus = "ACTIVE" | "PENDING_PAYMENT";

export type ShopperCartRow = {
  id: string;
  status: ShopperCartStatus | "CHECKED_OUT" | "ABANDONED";
  expiresAt: Date;
};

export function isCartExpired(expiresAt: Date, now = new Date()): boolean {
  return expiresAt.getTime() <= now.getTime();
}

/**
 * Elige el carrito operable del customer. No muta cookies ni DB.
 * PENDING_PAYMENT vencido se conserva (M13). ACTIVE vencido se omite.
 */
export function pickShopperCart<T extends ShopperCartRow>(
  rows: readonly T[],
  now = new Date(),
): T | null {
  for (const row of rows) {
    if (row.status !== "PENDING_PAYMENT" && isCartExpired(row.expiresAt, now)) {
      continue;
    }
    return row;
  }
  return null;
}

export function sumCartItemQuantities(items: readonly { quantity: number }[]): number {
  return items.reduce((sum, item) => sum + item.quantity, 0);
}

export function resolveHeaderCartCount(input: {
  signedIn: boolean;
  quantities: readonly number[] | null;
}): number {
  if (!input.signedIn || !input.quantities) {
    return 0;
  }
  return sumCartItemQuantities(input.quantities.map((quantity) => ({ quantity })));
}

export type DeviceCookiePlan =
  | { action: "keep" }
  | { action: "rotate"; nextRaw: string; nextHash: string };

/**
 * Cookie = raw token. DB = SHA-256. Nunca se reconstruye el raw desde el hash.
 * Si el dispositivo no tiene cookie (cross-device), se rota a un token nuevo.
 */
export function planDeviceCookieAssociation(
  rawToken: string | null,
  tokenHash: string,
  generate = generateCartToken,
  hash = hashCartToken,
): DeviceCookiePlan {
  if (rawToken && hash(rawToken) === tokenHash) {
    return { action: "keep" };
  }
  const nextRaw = generate();
  return { action: "rotate", nextRaw, nextHash: hash(nextRaw) };
}
