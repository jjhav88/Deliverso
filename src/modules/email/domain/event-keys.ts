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

export function cancellationRequestedEventKey(requestId: string): string {
  return `cancellation:${requestId}:requested:${emailEventKeyVersion}`;
}

export function cancellationApprovedEventKey(requestId: string): string {
  return `cancellation:${requestId}:approved:${emailEventKeyVersion}`;
}

export function cancellationRejectedEventKey(requestId: string): string {
  return `cancellation:${requestId}:rejected:${emailEventKeyVersion}`;
}

export function orderCanceledEventKey(orderId: string): string {
  return `order:${orderId}:canceled:${emailEventKeyVersion}`;
}

export function refundSucceededEventKey(refundId: string): string {
  return `refund:${refundId}:succeeded:${emailEventKeyVersion}`;
}

export function refundFailedEventKey(refundId: string): string {
  return `refund:${refundId}:failed:${emailEventKeyVersion}`;
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
