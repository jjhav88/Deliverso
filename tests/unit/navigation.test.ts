import { describe, expect, it } from "vitest";
import {
  appPathnames,
  cartHref,
  mainNavigation,
} from "@/config/navigation";

describe("mainNavigation", () => {
  it("exposes a single public nav source without labels", () => {
    const keys = mainNavigation.map((item) => item.key);
    const hrefs = mainNavigation.map((item) => item.href);

    expect(keys).toEqual([
      "home",
      "products",
      "universes",
      "about",
      "contact",
    ]);
    expect(new Set(hrefs).size).toBe(hrefs.length);
    expect(hrefs.every((href) => href in appPathnames)).toBe(true);
  });

  it("keeps cart as an independent path", () => {
    expect(cartHref).toBe("/carrito");
    expect(cartHref in appPathnames).toBe(true);
    expect(appPathnames["/carrito"]).toEqual({
      "es-MX": "/carrito",
      "en-US": "/cart",
    });
    expect(mainNavigation.map((item) => item.key)).not.toContain("cart");
  });

  it("localizes account and legal paths", () => {
    expect(appPathnames["/cuenta"]).toEqual({
      "es-MX": "/cuenta",
      "en-US": "/account",
    });
    expect(appPathnames["/cuenta/iniciar-sesion"]).toEqual({
      "es-MX": "/cuenta/iniciar-sesion",
      "en-US": "/account/login",
    });
    expect(appPathnames["/cuenta/registro"]).toEqual({
      "es-MX": "/cuenta/registro",
      "en-US": "/account/register",
    });
    expect(appPathnames["/cuenta/recuperar-contrasena"]).toEqual({
      "es-MX": "/cuenta/recuperar-contrasena",
      "en-US": "/account/forgot-password",
    });
    expect(appPathnames["/checkout"]).toEqual({
      "es-MX": "/checkout",
      "en-US": "/checkout",
    });
    expect(appPathnames["/pago/[orderNumber]"]).toEqual({
      "es-MX": "/pago/[orderNumber]",
      "en-US": "/payment/[orderNumber]",
    });
    expect(appPathnames["/cuenta/pedidos/[orderNumber]"]).toEqual({
      "es-MX": "/cuenta/pedidos/[orderNumber]",
      "en-US": "/account/orders/[orderNumber]",
    });
    expect(appPathnames["/cotizaciones"]).toEqual({
      "es-MX": "/cotizaciones",
      "en-US": "/quotes",
    });
    expect(appPathnames["/cotizaciones/nueva/[productSlug]"]).toEqual({
      "es-MX": "/cotizaciones/nueva/[productSlug]",
      "en-US": "/quotes/new/[productSlug]",
    });
    expect(appPathnames["/cotizaciones/[quoteNumber]"]).toEqual({
      "es-MX": "/cotizaciones/[quoteNumber]",
      "en-US": "/quotes/[quoteNumber]",
    });
  });
});
