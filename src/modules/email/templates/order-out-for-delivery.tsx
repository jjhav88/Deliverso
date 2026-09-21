import { renderOrderEmail } from "@/modules/email/templates/render";
import type { OrderEmailView } from "@/modules/email/domain/types";

export function OrderOutForDeliveryTemplate(view: OrderEmailView, publicUrl?: string) {
  return renderOrderEmail("ORDER_OUT_FOR_DELIVERY", view, publicUrl);
}
