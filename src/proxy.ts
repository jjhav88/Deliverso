import createIntlMiddleware from "next-intl/middleware";
import { NextRequest, NextResponse } from "next/server";
import { routing } from "@/i18n/routing";
import { isSeoIndexableRequest } from "@/modules/seo/env";
import { isPrivateSeoPath } from "@/modules/seo/robots-document";
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

function withSeoHeaders(response: NextResponse, request: NextRequest, pathname: string): NextResponse {
  if (!isSeoIndexableRequest(request.nextUrl.hostname) || isPrivateSeoPath(pathname)) {
    response.headers.set("X-Robots-Tag", "noindex, nofollow");
  }
  return response;
}

export default async function proxy(request: NextRequest) {
  const nextRequest = withPathnameHeader(request);
  const pathname = nextRequest.nextUrl.pathname;

  if (isAdminPath(pathname) || pathname.startsWith("/auth/")) {
    const response = await updateSupabaseSession(nextRequest);
    return withSeoHeaders(response, nextRequest, pathname);
  }

  if (pathname === "/locale-switch") {
    return withSeoHeaders(NextResponse.next(), nextRequest, pathname);
  }

  const intlResponse = intlMiddleware(nextRequest);
  const sessionResponse = await updateSupabaseSession(nextRequest, intlResponse);
  return withSeoHeaders(sessionResponse, nextRequest, pathname);
}

export const config = {
  matcher: "/((?!api|trpc|_next|_vercel|.*\\..*).*)",
};
