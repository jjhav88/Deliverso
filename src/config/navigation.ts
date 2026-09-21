import type { AppLocale } from "@/config/i18n";

export const appPathnames = {
  "/": "/",
  "/productos": {
    "es-MX": "/productos",
    "en-US": "/products",
  },
  "/productos/[slug]": {
    "es-MX": "/productos/[slug]",
    "en-US": "/products/[slug]",
  },
  "/universos": {
    "es-MX": "/universos",
    "en-US": "/universes",
  },
  "/universos/[slug]": {
    "es-MX": "/universos/[slug]",
    "en-US": "/universes/[slug]",
  },
  "/nosotros": {
    "es-MX": "/nosotros",
    "en-US": "/about",
  },
  "/contacto": {
    "es-MX": "/contacto",
    "en-US": "/contact",
  },
  "/carrito": {
    "es-MX": "/carrito",
    "en-US": "/cart",
  },
  "/checkout": {
    "es-MX": "/checkout",
    "en-US": "/checkout",
  },
  "/pago/[orderNumber]": {
    "es-MX": "/pago/[orderNumber]",
    "en-US": "/payment/[orderNumber]",
  },
  "/pedido/[orderNumber]/confirmacion": {
    "es-MX": "/pedido/[orderNumber]/confirmacion",
    "en-US": "/order/[orderNumber]/confirmation",
  },
  "/cuenta/pedidos/[orderNumber]": {
    "es-MX": "/cuenta/pedidos/[orderNumber]",
    "en-US": "/account/orders/[orderNumber]",
  },
  "/cuenta": {
    "es-MX": "/cuenta",
    "en-US": "/account",
  },
  "/cuenta/iniciar-sesion": {
    "es-MX": "/cuenta/iniciar-sesion",
    "en-US": "/account/login",
  },
  "/cuenta/registro": {
    "es-MX": "/cuenta/registro",
    "en-US": "/account/register",
  },
  "/cuenta/recuperar-contrasena": {
    "es-MX": "/cuenta/recuperar-contrasena",
    "en-US": "/account/forgot-password",
  },
  "/cuenta/restablecer-contrasena": {
    "es-MX": "/cuenta/restablecer-contrasena",
    "en-US": "/account/reset-password",
  },
  "/terminos": {
    "es-MX": "/terminos",
    "en-US": "/terms",
  },
  "/aviso-de-privacidad": {
    "es-MX": "/aviso-de-privacidad",
    "en-US": "/privacy",
  },
  "/design-system": "/design-system",
} as const;

export type AppPathname = keyof typeof appPathnames;

export type StaticAppPathname = Exclude<
  AppPathname,
  | "/productos/[slug]"
  | "/universos/[slug]"
  | "/pago/[orderNumber]"
  | "/pedido/[orderNumber]/confirmacion"
  | "/cuenta/pedidos/[orderNumber]"
>;

export type MainNavKey =
  | "home"
  | "products"
  | "universes"
  | "about"
  | "contact";

export type MainNavItem = {
  key: MainNavKey;
  href: StaticAppPathname;
};

export const mainNavigation = [
  { key: "home", href: "/" },
  { key: "products", href: "/productos" },
  { key: "universes", href: "/universos" },
  { key: "about", href: "/nosotros" },
  { key: "contact", href: "/contacto" },
] as const satisfies readonly MainNavItem[];

export const cartHref = "/carrito" satisfies StaticAppPathname;
export const accountHref = "/cuenta" satisfies StaticAppPathname;
export const accountLoginHref = "/cuenta/iniciar-sesion" satisfies StaticAppPathname;

export const localeShortLabels: Record<AppLocale, string> = {
  "es-MX": "ES",
  "en-US": "EN",
};
