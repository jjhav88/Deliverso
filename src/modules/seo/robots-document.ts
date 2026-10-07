import type { MetadataRoute } from "next";

export const privateRobotPaths = [
  "/api/",
  "/admin",
  "/admin/",
  "/design-system",
  "/en/design-system",
  "/cuenta",
  "/cuenta/",
  "/en/account",
  "/en/account/",
  "/auth",
  "/auth/",
  "/checkout",
  "/checkout/",
  "/en/checkout",
  "/en/checkout/",
  "/pago",
  "/pago/",
  "/en/payment",
  "/en/payment/",
  "/pedido",
  "/pedido/",
  "/en/order",
  "/en/order/",
  "/carrito",
  "/carrito/",
  "/en/cart",
  "/en/cart/",
  "/cotizaciones",
  "/cotizaciones/",
  "/en/quotes",
  "/en/quotes/",
] as const;

const privatePathPrefixes = [
  "/admin",
  "/auth",
  "/api",
  "/cuenta",
  "/en/account",
  "/carrito",
  "/en/cart",
  "/checkout",
  "/en/checkout",
  "/pago",
  "/en/payment",
  "/pedido",
  "/en/order",
  "/cotizaciones",
  "/en/quotes",
  "/design-system",
  "/en/design-system",
  "/terminos",
  "/en/terms",
  "/aviso-de-privacidad",
  "/en/privacy",
  "/entregas-y-recogidas",
  "/en/delivery-and-pickup",
  "/cancelaciones-y-reembolsos",
  "/en/cancellations-and-refunds",
  "/cookies",
  "/en/cookies",
  "/privacidad",
  "/en/privacy/arco-rights",
] as const;

export function isPrivateSeoPath(pathname: string): boolean {
  return privatePathPrefixes.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
}

export function buildRobotsDocument(input: {
  indexable: boolean;
  sitemapUrl?: string;
}): MetadataRoute.Robots {
  if (!input.indexable) {
    return {
      rules: [{ userAgent: "*", disallow: "/" }],
    };
  }

  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [...privateRobotPaths],
      },
    ],
    sitemap: input.sitemapUrl,
  };
}
