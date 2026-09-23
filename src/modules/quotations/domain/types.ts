export const quotationStatuses = [
  "SUBMITTED",
  "IN_REVIEW",
  "NEEDS_INFO",
  "QUOTED",
  "ACCEPTED",
  "DECLINED",
  "EXPIRED",
  "CANCELED",
  "CONVERTED",
] as const;
export type QuotationStatus = (typeof quotationStatuses)[number];

export const quotationEventTypes = [
  "QUOTE_SUBMITTED",
  "QUOTE_REVIEW_STARTED",
  "QUOTE_INFO_REQUESTED",
  "QUOTE_UPDATED_BY_CUSTOMER",
  "QUOTE_OFFERED",
  "QUOTE_ACCEPTED",
  "QUOTE_DECLINED",
  "QUOTE_EXPIRED",
  "QUOTE_CANCELED",
  "QUOTE_CONVERTED",
] as const;
export type QuotationEventType = (typeof quotationEventTypes)[number];

export function isQuotationStatus(value: string): value is QuotationStatus {
  return (quotationStatuses as readonly string[]).includes(value);
}
