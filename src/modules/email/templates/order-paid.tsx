import { renderOrderEmail } from "@/modules/email/templates/render";
import type { OrderEmailView } from "@/modules/email/domain/types";

export function OrderPaidTemplate(view: OrderEmailView, publicUrl?: string) {
  return renderOrderEmail("ORDER_PAID", view, publicUrl);
}
