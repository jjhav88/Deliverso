import "server-only";
import { getPrisma } from "@/server/db/prisma";
import type { AdminAuditAction } from "@/modules/auth/domain/audit-actions";

type WriteAdminAuditLogInput = {
  actorAdminId?: string | null;
  action: AdminAuditAction | (string & {});
  resourceType?: string;
  resourceId?: string;
  metadata?: Record<string, string | number | boolean | null>;
};

export async function writeAdminAuditLog(input: WriteAdminAuditLogInput) {
  await getPrisma().adminAuditLog.create({
    data: {
      actorAdminId: input.actorAdminId ?? null,
      action: input.action,
      resourceType: input.resourceType,
      resourceId: input.resourceId,
      metadata: input.metadata,
    },
  });
}
