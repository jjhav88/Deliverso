import type { EmailTemplateType } from "@/modules/email/domain/types";

export function templateForFulfillmentStatus(status: string): EmailTemplateType | null {
  switch (status) {
    case "CONFIRMED":
      return "ORDER_CONFIRMED";
    case "IN_PRODUCTION":
      return "ORDER_IN_PRODUCTION";
    case "READY":
      return "ORDER_READY";
    case "OUT_FOR_DELIVERY":
      return "ORDER_OUT_FOR_DELIVERY";
    case "COMPLETED":
      return "ORDER_COMPLETED";
    default:
      return null;
  }
}
