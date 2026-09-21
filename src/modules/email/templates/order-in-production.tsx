import { renderOrderEmail } from "@/modules/email/templates/render";
import type { OrderEmailView } from "@/modules/email/domain/types";

export function OrderInProductionTemplate(view: OrderEmailView, publicUrl?: string) {
  return renderOrderEmail("ORDER_IN_PRODUCTION", view, publicUrl);
}
