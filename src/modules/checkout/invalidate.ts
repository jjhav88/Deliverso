import "server-only";
import { getPrisma } from "@/server/db/prisma";
import { hasRuntimeDatabaseUrl } from "@/server/db/env";

export async function demoteReadyCheckoutDrafts(cartId: string): Promise<void> {
  if (!hasRuntimeDatabaseUrl()) {
    return;
  }

  await getPrisma().checkoutDraft.updateMany({
    where: { cartId, status: "READY_FOR_PAYMENT" },
    data: { status: "IN_PROGRESS" },
  });
}
