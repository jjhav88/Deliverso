import { NextRequest, NextResponse } from "next/server";
import { claimOrMergeLegacyCart } from "@/modules/cart/claim";
import { associateCartCookie, findCustomerShopperCart } from "@/server/cart/session";
import { getSafeCustomerPath } from "@/modules/customer-auth/domain/safe-path";
import { canCustomerShop } from "@/modules/customer-auth/domain/status";
import { ensureCustomerAccount } from "@/modules/customer-auth/queries";
import { createSupabaseServerClient } from "@/server/supabase/server";
import { hasSupabaseAuthConfig } from "@/server/supabase/env";

function parseIso(value: unknown): Date | null {
  if (typeof value !== "string" || !value) {
    return null;
  }
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

export async function GET(request: NextRequest) {
  const next = getSafeCustomerPath(request.nextUrl.searchParams.get("next"), "/cuenta");
  const login = `/cuenta/iniciar-sesion?next=${encodeURIComponent(next)}`;

  if (!hasSupabaseAuthConfig()) {
    return NextResponse.redirect(new URL(login, request.url));
  }

  const supabase = await createSupabaseServerClient();
  const code = request.nextUrl.searchParams.get("code");
  const tokenHash = request.nextUrl.searchParams.get("token_hash");
  const type = request.nextUrl.searchParams.get("type");

  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (error) {
      return NextResponse.redirect(new URL(`${login}&reason=confirm`, request.url));
    }
  } else if (tokenHash && type) {
    const { error } = await supabase.auth.verifyOtp({
      type: type as "signup" | "recovery" | "email",
      token_hash: tokenHash,
    });
    if (error) {
      return NextResponse.redirect(new URL(`${login}&reason=confirm`, request.url));
    }
  } else {
    return NextResponse.redirect(new URL(login, request.url));
  }

  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user?.email || !data.user.email_confirmed_at) {
    return NextResponse.redirect(new URL(`${login}&reason=confirm`, request.url));
  }

  const customer = await ensureCustomerAccount({
    authUserId: data.user.id,
    email: data.user.email,
    termsAcceptedAt: parseIso(data.user.user_metadata?.termsAcceptedAt),
    privacyAcceptedAt: parseIso(data.user.user_metadata?.privacyAcceptedAt),
    locale: next.startsWith("/en") ? "en-US" : "es-MX",
  });

  if (customer && canCustomerShop(customer.status)) {
    await claimOrMergeLegacyCart(customer.id);
    const shopperCart = await findCustomerShopperCart(customer.id);
    if (shopperCart) {
      await associateCartCookie(shopperCart.id);
    }
  }

  return NextResponse.redirect(new URL(next, request.url));
}
