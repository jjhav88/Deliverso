import type { PromotionReservationStatus } from "@/modules/promotions/domain/types";

export function reservationCountsTowardLimit(input: {
  status: PromotionReservationStatus;
  expiresAt: Date;
  now: Date;
}): boolean {
  if (input.status === "CONSUMED") {
    return true;
  }
  if (input.status === "RESERVED" && input.expiresAt.getTime() > input.now.getTime()) {
    return true;
  }
  return false;
}

export function canAcceptReservation(input: {
  usedCount: number;
  limit: number | null | undefined;
}): boolean {
  if (input.limit == null) {
    return true;
  }
  return input.usedCount < input.limit;
}

export function nextReservationStatusOnPayment(status: PromotionReservationStatus): PromotionReservationStatus {
  return status === "RELEASED" ? "RELEASED" : "CONSUMED";
}

export function nextReservationStatusOnCancel(status: PromotionReservationStatus): PromotionReservationStatus {
  return status === "CONSUMED" ? "CONSUMED" : "RELEASED";
}
