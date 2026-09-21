import { NextResponse } from "next/server";
import { dispatchPendingEmails } from "@/modules/email/dispatcher";
import { authorizeInternalJob, unauthorizedInternalResponse } from "@/server/security/cron-auth";
import { logInfo } from "@/server/logging/logger";
import { resolveRequestId } from "@/server/logging/request-id";

export const dynamic = "force-dynamic";

async function run(request: Request) {
  if (!authorizeInternalJob(request)) {
    return unauthorizedInternalResponse();
  }

  const requestId = resolveRequestId(request);
  const summary = await dispatchPendingEmails();
  logInfo({
    event: "EMAIL_DISPATCH_JOB",
    requestId,
    processed: summary.processed,
    updated: summary.sent,
    failed: summary.failed,
    skipped: summary.skipped,
  });
  return NextResponse.json({ ...summary, requestId });
}

export async function POST(request: Request) {
  return run(request);
}

export async function GET(request: Request) {
  return run(request);
}
