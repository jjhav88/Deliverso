export const emailModes = ["disabled", "sandbox", "enabled"] as const;
export type EmailMode = (typeof emailModes)[number];

export const emailOutboxStatuses = [
  "PENDING",
  "PROCESSING",
  "SENT",
  "FAILED",
  "DEAD",
] as const;
export type EmailOutboxStatus = (typeof emailOutboxStatuses)[number];

export const emailTemplateTypes = [
  "CUSTOMER_WELCOME",
  "ORDER_PAID",
  "ORDER_CONFIRMED",
  "ORDER_IN_PRODUCTION",
  "ORDER_READY",
  "ORDER_OUT_FOR_DELIVERY",
  "ORDER_COMPLETED",
  "QUOTE_RECEIVED",
  "QUOTE_NEEDS_INFO",
  "QUOTE_OFFERED",
  "QUOTE_ACCEPTED",
  "QUOTE_DECLINED",
  "QUOTE_EXPIRED",
] as const;
export type EmailTemplateType = (typeof emailTemplateTypes)[number];

export type SendEmailInput = {
  to: string;
  subject: string;
  html: string;
  text: string;
  replyTo?: string;
  idempotencyKey?: string;
};

export type EmailProviderResult =
  | { ok: true; messageId: string | null }
  | { ok: false; code: string; message: string; permanent?: boolean };

export interface EmailProvider {
  send(input: SendEmailInput): Promise<EmailProviderResult>;
}

export type QueueTransactionalEmailInput = {
  template: EmailTemplateType;
  eventKey: string;
  recipientEmail: string;
  recipientName?: string | null;
  locale: string;
  referenceType?: string;
  referenceId?: string;
};

export type OrderEmailItemOption = {
  groupName: string;
  optionName: string;
};

export type OrderEmailItem = {
  productName: string;
  variantName: string | null;
  quantity: number;
  lineTotalMinor: number;
  options: OrderEmailItemOption[];
};

export type OrderEmailView = {
  orderNumber: string;
  customerName: string;
  items: OrderEmailItem[];
  itemsSubtotalMinor: number;
  deliveryFeeMinor: number;
  grandTotalMinor: number;
  promotionLabel?: string | null;
  promotionCode?: string | null;
  promotionDiscountMinor?: number;
  fulfillmentMethod: "DELIVERY" | "PICKUP";
  requestedDate: string;
  timeWindow: string;
  addressSummary: string | null;
  addressLines: string[];
  pickupName: string | null;
  pickupAddress: string | null;
  locale: string;
  displayCurrencyCode: string | null;
  displayTotalMinor: number | null;
  displayExchangeProvider: string | null;
  displayExchangeRate: string | null;
  displayExchangeSourceDate: string | null;
};

export type WelcomeEmailView = {
  customerName: string | null;
  locale: string;
};

export type QuoteEmailView = {
  quoteNumber: string;
  productName: string;
  requestTitle: string | null;
  requestDescription: string;
  locale: string;
  quotedSubtotalMinor: number | null;
  deliveryFeeMinor: number | null;
  quotedTotalMinor: number | null;
  validUntil: string | null;
};

export type RenderedEmail = {
  subject: string;
  html: string;
  text: string;
};
