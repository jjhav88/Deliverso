"use server";

import { updateOrderFulfillmentStatus as transitionFulfillmentAction } from "@/modules/operations/actions";
import type { FulfillmentActionState } from "@/modules/operations/actions";

export type AdminOrderActionState = FulfillmentActionState;

export async function updateOrderFulfillmentStatus(
  previousState: AdminOrderActionState,
  formData: FormData,
): Promise<AdminOrderActionState> {
  return transitionFulfillmentAction(previousState, formData);
}

export async function cancelPaidOrderByAdmin(
  previousState: AdminOrderActionState,
  formData: FormData,
): Promise<AdminOrderActionState> {
  void previousState;
  const { createAdminRefundAction } = await import("@/modules/cancellations/admin-actions");
  const next = new FormData();
  next.set("orderId", String(formData.get("orderId") ?? ""));
  next.set("type", "FULL");
  next.set("reason", String(formData.get("reason") ?? "OTHER"));
  next.set("cancelsOrder", "1");
  next.set("confirm", String(formData.get("confirm") ?? ""));
  next.set("internalNote", String(formData.get("internalNote") ?? ""));
  return createAdminRefundAction(previousState, next);
}
