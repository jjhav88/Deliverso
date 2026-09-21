import type { MetadataRoute } from "next";
import { getPublicAppUrl } from "@/config/site";

export default function robots(): MetadataRoute.Robots {
  const sitemap = getPublicAppUrl()
    ? `${getPublicAppUrl()}/sitemap.xml`
    : undefined;

  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [
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
        ],
      },
    ],
    sitemap,
  };
}
