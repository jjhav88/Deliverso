import type { QuotationStatus } from "@/modules/quotations/domain/types";

export function canCustomerCancel(status: QuotationStatus): boolean {
  return status === "SUBMITTED" || status === "IN_REVIEW" || status === "NEEDS_INFO";
}

export function canCustomerReply(status: QuotationStatus): boolean {
  return status === "NEEDS_INFO";
}

export function canCustomerDecline(status: QuotationStatus): boolean {
  return status === "QUOTED";
}

export function canCustomerAccept(status: QuotationStatus, now: Date, validUntil: Date | null): boolean {
  return status === "QUOTED" && !isQuoteExpired(now, validUntil);
}

export function canAdminStartReview(status: QuotationStatus): boolean {
  return status === "SUBMITTED";
}

export function canAdminRequestInfo(status: QuotationStatus): boolean {
  return status === "SUBMITTED" || status === "IN_REVIEW";
}

export function canAdminOffer(status: QuotationStatus): boolean {
  return status === "SUBMITTED" || status === "IN_REVIEW" || status === "NEEDS_INFO" || status === "QUOTED";
}

export function canAdminCancel(status: QuotationStatus): boolean {
  return (
    status !== "CONVERTED" &&
    status !== "CANCELED" &&
    status !== "EXPIRED" &&
    status !== "DECLINED" &&
    status !== "ACCEPTED"
  );
}

export function isQuoteExpired(now: Date, validUntil: Date | null): boolean {
  return Boolean(validUntil && validUntil.getTime() <= now.getTime());
}

export function canAccessCustomerQuotation(ownerId: string, customerId: string): boolean {
  return ownerId === customerId;
}

export function nextStatusAfterCustomerReply(): QuotationStatus {
  return "IN_REVIEW";
}
