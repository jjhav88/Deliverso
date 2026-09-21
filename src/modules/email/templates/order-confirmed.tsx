import { renderOrderEmail } from "@/modules/email/templates/render";
import type { OrderEmailView } from "@/modules/email/domain/types";

export function OrderConfirmedTemplate(view: OrderEmailView, publicUrl?: string) {
  return renderOrderEmail("ORDER_CONFIRMED", view, publicUrl);
}
