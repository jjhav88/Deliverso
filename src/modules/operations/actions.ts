"use server";

import { requireAdmin } from "@/modules/auth/authorization/require-admin";
import { transitionFulfillmentStatus } from "@/modules/operations/transition";

export type FulfillmentActionState = {
  error: string | null;
  success: string | null;
};

export const emptyFulfillmentActionState: FulfillmentActionState = {
  error: null,
  success: null,
};

export async function updateOrderFulfillmentStatus(
  previousState: FulfillmentActionState,
  formData: FormData,
): Promise<FulfillmentActionState> {
  void previousState;
  const admin = await requireAdmin("/admin/operations");
  const result = await transitionFulfillmentStatus({
    orderId: String(formData.get("orderId") ?? ""),
    nextStatus: String(formData.get("fulfillmentStatus") ?? ""),
    actorAdminId: admin.id,
  });
  if (!result.ok) {
    return { error: result.error, success: null };
  }
  return { error: null, success: "Estado actualizado." };
}
