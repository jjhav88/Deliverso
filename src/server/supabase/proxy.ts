import { createServerClient } from "@supabase/ssr";
import { type NextRequest, NextResponse } from "next/server";

function readEnv(name: string): string | undefined {
  const value = process.env[name]?.trim();
  return value ? value : undefined;
}

function passthrough(request: NextRequest, isAdmin: boolean) {
  if (!isAdmin) {
    return NextResponse.next({ request });
  }

  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-admin-pathname", request.nextUrl.pathname);
  return NextResponse.next({
    request: { headers: requestHeaders },
  });
}

/**
 * Refreshes Supabase Auth cookies onto the given response.
 * Skips silently when Auth env is not configured so the storefront stays up.
 */
export async function updateSupabaseSession(
  request: NextRequest,
  baseResponse?: NextResponse,
) {
  const url = readEnv("NEXT_PUBLIC_SUPABASE_URL") ?? readEnv("SUPABASE_URL");
  const publishableKey = readEnv("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY");
  const isAdmin =
    request.nextUrl.pathname === "/admin" || request.nextUrl.pathname.startsWith("/admin/");
  const response = baseResponse ?? passthrough(request, isAdmin);

  if (!url || !publishableKey) {
    return response;
  }

  const supabase = createServerClient(url, publishableKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => {
          request.cookies.set(name, value);
        });
        cookiesToSet.forEach(({ name, value, options }) => {
          response.cookies.set(name, value, options);
        });
      },
    },
  });

  await supabase.auth.getUser();
  return response;
}
