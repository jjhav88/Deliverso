"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { writeAdminAuditLog } from "@/modules/audit/write-admin-audit-log";
import { requireRole } from "@/modules/auth/authorization/require-role";
import { isCustomerStatus } from "@/modules/customer-auth/domain/status";
import { getPrisma } from "@/server/db/prisma";

export async function setCustomerStatusAction(formData: FormData): Promise<void> {
  const admin = await requireRole(["ADMIN", "SUPER_ADMIN"]);
  const id = String(formData.get("id") ?? "");
  const status = String(formData.get("status") ?? "");
  if (!id || !isCustomerStatus(status)) {
    redirect("/admin/customers");
  }

  const existing = await getPrisma().customerAccount.findUnique({
    where: { id },
    select: { id: true, status: true },
  });
  if (!existing || existing.status === status) {
    redirect(`/admin/customers/${id}`);
  }

  await getPrisma().customerAccount.update({
    where: { id },
    data: { status },
  });

  await writeAdminAuditLog({
    actorAdminId: admin.id,
    action: status === "BLOCKED" ? "CUSTOMER_BLOCKED" : "CUSTOMER_REACTIVATED",
    resourceType: "CustomerAccount",
    resourceId: id,
    metadata: { from: existing.status, to: status },
  });

  revalidatePath("/admin/customers");
  revalidatePath(`/admin/customers/${id}`);
  redirect(`/admin/customers/${id}?ok=status`);
}
