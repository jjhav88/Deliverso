import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export function GET() {
  return NextResponse.json({
    status: "ok",
    service: "deliverso",
    timestamp: new Date().toISOString(),
  });
}
