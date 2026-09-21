import createIntlMiddleware from "next-intl/middleware";
import { NextRequest, NextResponse } from "next/server";
import { routing } from "@/i18n/routing";
import { updateSupabaseSession } from "@/server/supabase/proxy";

const intlMiddleware = createIntlMiddleware(routing);

function isAdminPath(pathname: string): boolean {
  return pathname === "/admin" || pathname.startsWith("/admin/");
}

function withPathnameHeader(request: NextRequest): NextRequest {
  const headers = new Headers(request.headers);
  headers.set("x-deliverso-pathname", request.nextUrl.pathname);
  return new NextRequest(request.url, {
    method: request.method,
    headers,
  });
}

export default async function proxy(request: NextRequest) {
  const nextRequest = withPathnameHeader(request);
  const pathname = nextRequest.nextUrl.pathname;

  if (isAdminPath(pathname) || pathname.startsWith("/auth/")) {
    return updateSupabaseSession(nextRequest);
  }

  if (pathname === "/locale-switch") {
    return NextResponse.next();
  }

  const intlResponse = intlMiddleware(nextRequest);
  return updateSupabaseSession(nextRequest, intlResponse);
}

export const config = {
  matcher: "/((?!api|trpc|_next|_vercel|.*\\..*).*)",
};
