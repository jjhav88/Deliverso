import type { EmailTemplateType } from "@/modules/email/domain/types";

export const emailEventKeyVersion = "v1";

export function welcomeEventKey(customerId: string): string {
  return `customer:${customerId}:welcome:${emailEventKeyVersion}`;
}

export function orderPaidEventKey(orderId: string): string {
  return `order:${orderId}:paid:${emailEventKeyVersion}`;
}

export function fulfillmentEventKey(orderId: string, status: string): string {
  return `order:${orderId}:fulfillment:${status}:${emailEventKeyVersion}`;
}

export function eventKeyForTemplate(input: {
  template: EmailTemplateType;
  customerId?: string;
  orderId?: string;
  fulfillmentStatus?: string;
}): string {
  if (input.template === "CUSTOMER_WELCOME" && input.customerId) {
    return welcomeEventKey(input.customerId);
  }
  if (input.template === "ORDER_PAID" && input.orderId) {
    return orderPaidEventKey(input.orderId);
  }
  if (input.orderId && input.fulfillmentStatus) {
    return fulfillmentEventKey(input.orderId, input.fulfillmentStatus);
  }
  throw new Error("EMAIL_EVENT_KEY_INCOMPLETE");
}
