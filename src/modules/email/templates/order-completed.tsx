import { renderOrderEmail } from "@/modules/email/templates/render";
import type { OrderEmailView } from "@/modules/email/domain/types";

export function OrderCompletedTemplate(view: OrderEmailView, publicUrl?: string) {
  return renderOrderEmail("ORDER_COMPLETED", view, publicUrl);
}
