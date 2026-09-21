import { NextResponse } from "next/server";
import { Prisma } from "@/generated/prisma/client";
import { getPrisma } from "@/server/db/prisma";
import { hasRuntimeDatabaseUrl } from "@/server/db/env";
import { isTransientDatabaseError } from "@/server/db/errors";
import { hasSupabaseAuthConfig } from "@/server/supabase/env";
import { hasStripeConfig } from "@/server/stripe/env";

export const dynamic = "force-dynamic";

export async function GET() {
  if (!hasRuntimeDatabaseUrl()) {
    return NextResponse.json({ status: "unavailable", checks: { app: true, database: false } }, { status: 503 });
  }

  try {
    await getPrisma().$queryRaw(Prisma.sql`SELECT 1`);
    return NextResponse.json({
      status: "ready",
      checks: {
        app: true,
        database: true,
        supabaseConfigured: hasSupabaseAuthConfig(),
        stripeConfigured: hasStripeConfig(),
      },
    });
  } catch (error) {
    if (!isTransientDatabaseError(error) && error) {
      return NextResponse.json({ status: "unavailable", checks: { app: true, database: false } }, { status: 503 });
    }
    return NextResponse.json({ status: "unavailable", checks: { app: true, database: false } }, { status: 503 });
  }
}
