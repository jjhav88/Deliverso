import { NextResponse } from "next/server";
import { runMaintenanceJobs } from "@/modules/maintenance/jobs";
import { authorizeInternalJob, unauthorizedInternalResponse } from "@/server/security/cron-auth";
import { logInfo } from "@/server/logging/logger";
import { resolveRequestId } from "@/server/logging/request-id";

export const dynamic = "force-dynamic";

async function run(request: Request) {
  if (!authorizeInternalJob(request)) {
    return unauthorizedInternalResponse();
  }

  const requestId = resolveRequestId(request);
  const results = await runMaintenanceJobs();
  logInfo({
    event: "MAINTENANCE_RUN",
    requestId,
    processed: results.reduce((sum, item) => sum + item.processed, 0),
    updated: results.reduce((sum, item) => sum + item.updated, 0),
    failed: results.reduce((sum, item) => sum + item.failed, 0),
  });
  return NextResponse.json({ requestId, results });
}

export async function POST(request: Request) {
  return run(request);
}

export async function GET(request: Request) {
  return run(request);
}
