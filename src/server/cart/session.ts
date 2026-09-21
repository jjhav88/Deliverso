import "server-only";
import { CART_TTL_MS } from "@/config/cart";
import { generateCartToken, hashCartToken } from "@/modules/cart/domain/token";
import {
  pickShopperCart,
  planDeviceCookieAssociation,
  type ShopperCartStatus,
} from "@/modules/cart/domain/session-read";
import { getOptionalCustomer } from "@/modules/customer-auth/queries";
import { canCustomerShop } from "@/modules/customer-auth/domain/status";
import { hasRuntimeDatabaseUrl } from "@/server/db/env";
import { getPrisma } from "@/server/db/prisma";
import { clearCartToken, readCartToken, writeCartToken } from "@/server/cart/cookie";

export type CartRecord = {
  id: string;
  status: "ACTIVE" | "PENDING_PAYMENT" | "CHECKED_OUT" | "ABANDONED";
  customerId: string | null;
  expiresAt: Date;
};

type CartRow = CartRecord & { tokenHash: string };

const SHOPPER_STATUSES: ShopperCartStatus[] = ["PENDING_PAYMENT", "ACTIVE"];

async function loadCustomerShopperCarts(
  customerId: string,
  statuses: ShopperCartStatus[],
): Promise<CartRow[]> {
  return getPrisma().cart.findMany({
    where: { customerId, status: { in: statuses } },
    orderBy: [{ status: "desc" }, { updatedAt: "desc" }],
    select: { id: true, status: true, customerId: true, expiresAt: true, tokenHash: true },
  });
}

function toCartRecord(row: CartRow): CartRecord {
  return {
    id: row.id,
    status: row.status,
    customerId: row.customerId,
    expiresAt: row.expiresAt,
  };
}

async function markAbandoned(cartId: string): Promise<void> {
  await getPrisma().cart.update({
    where: { id: cartId },
    data: { status: "ABANDONED" },
  });
}

/**
 * Mutation only. Genera un token de dispositivo nuevo si la cookie no coincide.
 * No recupera el raw token original desde el hash.
 */
export async function associateCartCookie(cartId: string): Promise<void> {
  const cart = await getPrisma().cart.findUnique({
    where: { id: cartId },
    select: { id: true, tokenHash: true },
  });
  if (!cart) {
    return;
  }

  const plan = planDeviceCookieAssociation(await readCartToken(), cart.tokenHash);
  if (plan.action === "keep") {
    return;
  }

  await getPrisma().cart.update({
    where: { id: cart.id },
    data: { tokenHash: plan.nextHash },
  });
  await writeCartToken(plan.nextRaw);
}

export async function findCustomerShopperCart(
  customerId: string,
  statuses: ShopperCartStatus[] = SHOPPER_STATUSES,
): Promise<CartRecord | null> {
  if (!hasRuntimeDatabaseUrl()) {
    return null;
  }
  const picked = pickShopperCart(await loadCustomerShopperCarts(customerId, statuses));
  return picked ? toCartRecord(picked) : null;
}

/** Carrito ACTIVE del customer. Solo lectura. */
export async function getCustomerActiveCart(customerId: string): Promise<CartRecord | null> {
  return findCustomerShopperCart(customerId, ["ACTIVE"]);
}

export async function getActiveCartForCustomer(customerId: string): Promise<CartRecord | null> {
  return getCustomerActiveCart(customerId);
}

/** @deprecated Usa findCustomerShopperCart. Solo lectura; no escribe cookies. */
export async function getShopperCartForCustomer(
  customerId: string,
  statuses: ShopperCartStatus[] = SHOPPER_STATUSES,
): Promise<CartRecord | null> {
  return findCustomerShopperCart(customerId, statuses);
}

export async function getCurrentCart(): Promise<CartRecord | null> {
  return getCurrentCartRecord();
}

export async function getCurrentCartRecord(): Promise<CartRecord | null> {
  if (!hasRuntimeDatabaseUrl()) {
    return null;
  }

  const customer = await getOptionalCustomer();
  if (!customer || !canCustomerShop(customer.status)) {
    return null;
  }

  return findCustomerShopperCart(customer.id);
}

export async function getOrCreateCurrentCart(): Promise<CartRecord | null> {
  if (!hasRuntimeDatabaseUrl()) {
    return null;
  }

  const customer = await getOptionalCustomer();
  if (!customer || !canCustomerShop(customer.status)) {
    return null;
  }

  const rows = await loadCustomerShopperCarts(customer.id, SHOPPER_STATUSES);
  for (const row of rows) {
    if (row.status !== "PENDING_PAYMENT" && pickShopperCart([row]) === null) {
      await markAbandoned(row.id);
    }
  }

  const existing = pickShopperCart(rows);
  if (existing) {
    await associateCartCookie(existing.id);
    return toCartRecord(existing);
  }

  const raw = generateCartToken();
  const now = new Date();
  const cart = await getPrisma().cart.create({
    data: {
      tokenHash: hashCartToken(raw),
      status: "ACTIVE",
      customerId: customer.id,
      expiresAt: new Date(now.getTime() + CART_TTL_MS),
    },
    select: { id: true, status: true, customerId: true, expiresAt: true },
  });
  await writeCartToken(raw);
  return cart;
}

export async function touchCart(cartId: string): Promise<void> {
  await getPrisma().cart.update({
    where: { id: cartId },
    data: { expiresAt: new Date(Date.now() + CART_TTL_MS) },
  });
}

export async function abandonAndClear(cartId: string): Promise<void> {
  await getPrisma().cart.update({
    where: { id: cartId },
    data: { status: "ABANDONED" },
  });
  await clearCartToken();
}

export async function readLegacyCookieCart() {
  const raw = await readCartToken();
  if (!raw || !hasRuntimeDatabaseUrl()) {
    return null;
  }

  const cart = await getPrisma().cart.findUnique({
    where: { tokenHash: hashCartToken(raw) },
    select: {
      id: true,
      status: true,
      customerId: true,
      expiresAt: true,
    },
  });

  if (!cart || cart.status !== "ACTIVE" || pickShopperCart([cart]) === null) {
    return null;
  }

  return cart;
}
