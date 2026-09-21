export const cartCookie = {
  name: "deliverso_cart",
  maxAge: 60 * 60 * 24 * 30,
  path: "/",
  sameSite: "lax",
} as const;

export const CART_TTL_MS = cartCookie.maxAge * 1000;
export const CART_MAX_QUANTITY = 99;
export const CART_MIN_QUANTITY = 1;
