import "server-only";
import { cartBelongsToCustomer } from "@/modules/cart/domain/ownership";
import { getCurrentCartRecord, getOrCreateCurrentCart, type CartRecord } from "@/server/cart/session";
import {
  AUTH_REQUIRED_MESSAGE,
  CUSTOMER_BLOCKED_MESSAGE,
  type AuthenticatedCustomer,
} from "@/modules/customer-auth/action-state";
import { getOptionalCustomer } from "@/modules/customer-auth/queries";
import { canCustomerShop } from "@/modules/customer-auth/domain/status";
import { isCartWritable } from "@/modules/orders/domain/ownership";

export const CART_LOCKED_MESSAGE =
  "Tu pedido está pendiente de pago. Cancélalo o termínalo antes de modificar el carrito.";

export async function resolveWritableCart(): Promise<
  | { ok: true; customer: AuthenticatedCustomer; cart: CartRecord }
  | { ok: false; error: string; create: boolean }
> {
  const customer = await getOptionalCustomer();
  if (!customer) {
    return { ok: false, error: AUTH_REQUIRED_MESSAGE, create: false };
  }
  if (!canCustomerShop(customer.status)) {
    return { ok: false, error: CUSTOMER_BLOCKED_MESSAGE, create: false };
  }

  const cart = await getOrCreateCurrentCart();
  if (!cart || !cartBelongsToCustomer(cart.customerId, customer.id)) {
    return { ok: false, error: "No fue posible crear el carrito.", create: false };
  }
  if (!isCartWritable(cart.status)) {
    return { ok: false, error: CART_LOCKED_MESSAGE, create: false };
  }

  return { ok: true, customer, cart };
}

export async function resolveReadableCart(): Promise<
  | { ok: true; customer: AuthenticatedCustomer; cart: CartRecord }
  | { ok: false; error: string }
> {
  const customer = await getOptionalCustomer();
  if (!customer) {
    return { ok: false, error: AUTH_REQUIRED_MESSAGE };
  }
  if (!canCustomerShop(customer.status)) {
    return { ok: false, error: CUSTOMER_BLOCKED_MESSAGE };
  }

  const cart = await getCurrentCartRecord();
  if (!cart || !cartBelongsToCustomer(cart.customerId, customer.id)) {
    return { ok: false, error: "Carrito no encontrado." };
  }

  return { ok: true, customer, cart };
}
