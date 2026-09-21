import { businessTimezone } from "@/config/fulfillment";
import type { EmailTemplateType } from "@/modules/email/domain/types";

export function formatCustomerCalendarDate(
  calendarDate: string,
  locale: string,
  timeZone = businessTimezone,
): string {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(calendarDate);
  if (!match) {
    return calendarDate;
  }
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const utcNoon = new Date(Date.UTC(year, month - 1, day, 12, 0, 0));
  return new Intl.DateTimeFormat(locale === "en-US" ? "en-US" : "es-MX", {
    timeZone,
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(utcNoon);
}

export function formatCustomerTimeWindow(value: string): string {
  const range = value.includes("·") ? (value.split("·").at(-1)?.trim() ?? value) : value;
  return range.replace(/(\d{1,2}:\d{2}):\d{2}/g, "$1");
}

export function formatAddressLines(input: {
  street?: string | null;
  exteriorNumber?: string | null;
  locality?: string | null;
  city?: string | null;
  state?: string | null;
  postalCode?: string | null;
  summary?: string | null;
}): string[] {
  const street = [input.street, input.exteriorNumber].filter(Boolean).join(" ").trim();
  const lines = [
    street,
    input.locality?.trim() ?? "",
    [input.city, input.state].filter(Boolean).join(", "),
    input.postalCode ? `C.P. ${input.postalCode}` : "",
  ].filter(Boolean);
  if (lines.length > 0) {
    return lines;
  }
  return input.summary ? [input.summary] : [];
}

export function getEmailHeadline(
  template: EmailTemplateType,
  locale: string,
  method?: "DELIVERY" | "PICKUP",
): string {
  const en = locale === "en-US";
  switch (template) {
    case "CUSTOMER_WELCOME":
      return en ? "Welcome to DELIVERSO" : "Bienvenido a DELIVERSO";
    case "ORDER_PAID":
      return en ? "We received your order!" : "¡Recibimos tu pedido!";
    case "ORDER_CONFIRMED":
      return en ? "Your order is confirmed" : "Tu pedido está confirmado";
    case "ORDER_IN_PRODUCTION":
      return en ? "We're already creating your order" : "Ya estamos creando tu pedido";
    case "ORDER_READY":
      if (method === "PICKUP") {
        return en ? "Your order is ready for pickup" : "Tu pedido está listo para recoger";
      }
      return en ? "Your order is ready" : "Tu pedido está listo";
    case "ORDER_OUT_FOR_DELIVERY":
      return en ? "Your order is on its way" : "Tu pedido va en camino";
    case "ORDER_COMPLETED":
      if (method === "PICKUP") {
        return en ? "Order complete" : "Pedido completado";
      }
      return en ? "Your order was delivered" : "Tu pedido fue entregado";
  }
}

export function getEmailIntro(
  template: EmailTemplateType,
  locale: string,
  method?: "DELIVERY" | "PICKUP",
): string {
  const en = locale === "en-US";
  switch (template) {
    case "CUSTOMER_WELCOME":
      return en
        ? "Thank you for creating your account. You can now discover products, customize them, keep your cart, and review your orders."
        : "Gracias por crear tu cuenta. Ahora puedes descubrir productos, personalizarlos, conservar tu carrito y consultar tus pedidos.";
    case "ORDER_PAID":
      return en
        ? "Your payment is confirmed, and your order is now part of our universe of flavors."
        : "Tu pago fue confirmado y tu pedido ya forma parte de nuestro universo de sabores.";
    case "ORDER_CONFIRMED":
      return en
        ? "Everything is set. We've reserved your order for the date and time you chose."
        : "Todo está listo. Hemos reservado tu pedido para la fecha y horario seleccionados.";
    case "ORDER_IN_PRODUCTION":
      return en
        ? "Our team has begun preparing it with the care every DELIVERSO creation deserves."
        : "Nuestro equipo comenzó a prepararlo con el cuidado y detalle que merece cada creación DELIVERSO.";
    case "ORDER_READY":
      if (method === "PICKUP") {
        return en
          ? "Your order is waiting for you at our pickup point."
          : "Tu pedido ya te espera en nuestro punto de recogida.";
      }
      return en
        ? "It's finished and ready to begin its journey to you."
        : "Terminamos de prepararlo y está listo para iniciar su recorrido hacia ti.";
    case "ORDER_OUT_FOR_DELIVERY":
      return en
        ? "It has left DELIVERSO and is on its way to you."
        : "Ya salió de DELIVERSO y está en ruta hacia ti.";
    case "ORDER_COMPLETED":
      if (method === "PICKUP") {
        return en
          ? "Thank you for picking up your order and for choosing DELIVERSO."
          : "Gracias por recoger tu pedido y por elegir DELIVERSO.";
      }
      return en
        ? "We hope you enjoy every bite. Thank you for letting us be part of your moment."
        : "Esperamos que disfrutes cada bocado. Gracias por dejarnos formar parte de tu momento.";
  }
}

export function containsInternalId(value: string): boolean {
  return /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i.test(value);
}
