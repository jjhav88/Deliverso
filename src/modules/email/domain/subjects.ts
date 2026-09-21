import type { EmailTemplateType, OrderEmailView } from "@/modules/email/domain/types";

export function getEmailSubject(
  template: EmailTemplateType,
  locale: string,
  data?: Pick<OrderEmailView, "orderNumber" | "fulfillmentMethod">,
): string {
  const en = locale === "en-US";
  const orderNumber = data?.orderNumber ?? "";

  switch (template) {
    case "CUSTOMER_WELCOME":
      return en ? "Welcome to DELIVERSO" : "Bienvenido a DELIVERSO";
    case "ORDER_PAID":
      return en
        ? `We received your order ${orderNumber}`
        : `Recibimos tu pedido ${orderNumber}`;
    case "ORDER_CONFIRMED":
      return en
        ? `Your order ${orderNumber} was confirmed`
        : `Tu pedido ${orderNumber} fue confirmado`;
    case "ORDER_IN_PRODUCTION":
      return en
        ? `We are preparing your order ${orderNumber}`
        : `Ya estamos preparando tu pedido ${orderNumber}`;
    case "ORDER_READY":
      if (data?.fulfillmentMethod === "PICKUP") {
        return en ? "Your order is ready for pickup" : "Tu pedido está listo para recoger";
      }
      return en ? "Your order is ready" : "Tu pedido está listo";
    case "ORDER_OUT_FOR_DELIVERY":
      return en ? "Your order is on its way" : "Tu pedido va en camino";
    case "ORDER_COMPLETED":
      if (data?.fulfillmentMethod === "PICKUP") {
        return en ? "Order complete" : "Pedido completado";
      }
      return en ? "Your order was delivered" : "Tu pedido fue entregado";
  }
}
