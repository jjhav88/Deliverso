import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { parseLocaleSwitchInput } from "@/modules/i18n/locale-switch";
import { resolveLocaleSwitch } from "@/modules/i18n/resolve-locale-switch";

export async function GET(request: NextRequest) {
  const parsed = parseLocaleSwitchInput(
    Object.fromEntries(request.nextUrl.searchParams.entries()),
  );

  if (!parsed) {
    return NextResponse.redirect(new URL("/", request.nextUrl.origin));
  }

  const resolved = await resolveLocaleSwitch(parsed);
  const href = internalDestination(resolved.href);
  return NextResponse.redirect(new URL(href, request.nextUrl.origin));
}

function internalDestination(href: string): string {
  if (!href.startsWith("/") || href.startsWith("//") || /https?:/i.test(href)) {
    return "/";
  }
  return href;
}
