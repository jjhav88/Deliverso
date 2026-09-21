import "server-only";
import { cookies } from "next/headers";
import { cartCookie } from "@/config/cart";

/** Permitido en Server Components. Solo lectura. */
export async function readCartToken(): Promise<string | null> {
  const store = await cookies();
  const value = store.get(cartCookie.name)?.value?.trim();
  return value || null;
}

/** Solo Server Actions o Route Handlers. Nunca durante render. */
export async function writeCartToken(rawToken: string): Promise<void> {
  const store = await cookies();
  store.set(cartCookie.name, rawToken, {
    httpOnly: true,
    path: cartCookie.path,
    maxAge: cartCookie.maxAge,
    sameSite: cartCookie.sameSite,
    secure: process.env.NODE_ENV === "production",
  });
}

/** Solo Server Actions o Route Handlers. Nunca durante render. */
export async function clearCartToken(): Promise<void> {
  const store = await cookies();
  store.delete(cartCookie.name);
}
