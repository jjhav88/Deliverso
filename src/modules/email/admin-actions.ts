"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/modules/auth/authorization/require-admin";
import { writeAdminAuditLog } from "@/modules/audit/write-admin-audit-log";
import { getPrisma } from "@/server/db/prisma";
import { isDevSandboxSendAllowed } from "@/server/email/env";
import { dispatchPendingEmails } from "@/modules/email/dispatcher";
import { queueTransactionalEmail } from "@/modules/email/queue";
import { isEmailTemplateType } from "@/modules/email/domain/template-guard";

export async function retryEmailOutbox(formData: FormData): Promise<void> {
  const admin = await requireAdmin("/admin/settings");
  const id = String(formData.get("outboxId") ?? "");
  if (!id) {
    return;
  }

  const row = await getPrisma().emailOutbox.findUnique({
    where: { id },
    select: { id: true, status: true },
  });
  if (!row || (row.status !== "FAILED" && row.status !== "DEAD")) {
    return;
  }

  await getPrisma().emailOutbox.update({
    where: { id: row.id },
    data: {
      status: "PENDING",
      nextAttemptAt: new Date(),
    },
  });

  await writeAdminAuditLog({
    actorAdminId: admin.id,
    action: "EMAIL_RETRY_REQUESTED",
    resourceType: "EmailOutbox",
    resourceId: row.id,
  });
  revalidatePath("/admin/settings");
}

export async function sendSandboxTemplateTest(formData: FormData): Promise<void> {
  await requireAdmin("/admin/settings/email-preview");
  if (!isDevSandboxSendAllowed()) {
    return;
  }
  const template = String(formData.get("template") ?? "");
  if (!isEmailTemplateType(template)) {
    return;
  }

  await queueTransactionalEmail({
    template,
    eventKey: `admin-test:${template}:${Date.now()}`,
    recipientEmail: "preview@deliverso.local",
    recipientName: "Preview",
    locale: String(formData.get("locale") || "es-MX"),
    referenceType: "Preview",
    referenceId: "sample",
  });
  await dispatchPendingEmails();
  revalidatePath("/admin/settings");
}
