import { promotionStatuses, type PromotionStatus } from "@/modules/promotions/domain/types";

export const promotionStatusUpdateError = "No pudimos actualizar la promoción.";

export function isPromotionStatus(value: string): value is PromotionStatus {
  return (promotionStatuses as readonly string[]).includes(value);
}

export function canTransitionPromotionStatus(from: PromotionStatus, to: PromotionStatus): boolean {
  if (from === to) {
    return false;
  }
  if (from === "ARCHIVED") {
    return false;
  }
  if (to === "ACTIVE") {
    return from === "DRAFT" || from === "PAUSED";
  }
  if (to === "PAUSED") {
    return from === "ACTIVE";
  }
  if (to === "ARCHIVED") {
    return from === "ACTIVE" || from === "PAUSED" || from === "DRAFT";
  }
  if (to === "DRAFT") {
    return from === "PAUSED";
  }
  return false;
}

export function auditActionForPromotionStatus(status: PromotionStatus) {
  if (status === "ACTIVE") {
    return "PROMOTION_ACTIVATED" as const;
  }
  if (status === "PAUSED") {
    return "PROMOTION_PAUSED" as const;
  }
  if (status === "ARCHIVED") {
    return "PROMOTION_ARCHIVED" as const;
  }
  return "PROMOTION_UPDATED" as const;
}

export function promotionStatusWriteData(status: PromotionStatus, updatedByAdminId: string) {
  return { status, updatedByAdminId };
}

export function parsePromotionStatusForm(formData: FormData):
  | { ok: true; promotionId: string; status: PromotionStatus }
  | { ok: false; error: string } {
  const promotionId = String(formData.get("promotionId") ?? formData.get("id") ?? "").trim();
  const rawStatus = String(formData.get("status") ?? "").trim();
  if (!promotionId || !isPromotionStatus(rawStatus)) {
    return { ok: false, error: promotionStatusUpdateError };
  }
  return { ok: true, promotionId, status: rawStatus };
}
