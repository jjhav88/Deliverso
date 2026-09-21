import type { AppLocale } from "@/config/i18n";
import { supportedLocales } from "@/config/i18n";
import type { AppPathname } from "@/config/navigation";
import { appPathnames } from "@/config/navigation";

const internalPathnames = Object.keys(appPathnames) as AppPathname[];

export const localeSwitchSlugPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/i;

export type LocaleSwitchInput = {
  to: AppLocale;
  pathname: AppPathname;
  slug?: string;
};

export function parseLocaleSwitchInput(
  raw: Record<string, string | string[] | undefined>,
): LocaleSwitchInput | null {
  const to = first(raw.to);
  const pathname = first(raw.pathname);
  const slug = first(raw.slug);

  if (!to || !isAppLocale(to) || !pathname || !isInternalPathname(pathname)) {
    return null;
  }

  if (looksLikeExternal(pathname) || (slug && looksLikeExternal(slug))) {
    return null;
  }

  if (
    pathname === "/productos/[slug]" ||
    pathname === "/universos/[slug]" ||
    pathname === "/pago/[orderNumber]" ||
    pathname === "/pedido/[orderNumber]/confirmacion" ||
    pathname === "/cuenta/pedidos/[orderNumber]"
  ) {
    if (!slug || !localeSwitchSlugPattern.test(slug)) {
      return null;
    }
    return { to, pathname, slug };
  }

  if (slug) {
    return null;
  }

  return { to, pathname };
}

export function isInternalPathname(value: string): value is AppPathname {
  return internalPathnames.includes(value as AppPathname);
}

function isAppLocale(value: string): value is AppLocale {
  return (supportedLocales as readonly string[]).includes(value);
}

function looksLikeExternal(value: string): boolean {
  return (
    /https?:/i.test(value) ||
    value.includes("://") ||
    value.includes("//") ||
    value.includes("\\") ||
    value.includes(":")
  );
}

function first(value: string | string[] | undefined): string | undefined {
  const item = Array.isArray(value) ? value[0] : value;
  return item?.trim() || undefined;
}

export function parsePublicPathname(pathname: string): {
  kind: "product" | "universe" | "static";
  pathname: AppPathname;
  slug?: string;
} {
  const productEn = pathname.match(/^\/en\/products\/([^/]+)\/?$/);
  if (productEn?.[1]) {
    return { kind: "product", pathname: "/productos/[slug]", slug: productEn[1] };
  }
  const productEs = pathname.match(/^\/productos\/([^/]+)\/?$/);
  if (productEs?.[1]) {
    return { kind: "product", pathname: "/productos/[slug]", slug: productEs[1] };
  }
  const universeEn = pathname.match(/^\/en\/universes\/([^/]+)\/?$/);
  if (universeEn?.[1]) {
    return { kind: "universe", pathname: "/universos/[slug]", slug: universeEn[1] };
  }
  const universeEs = pathname.match(/^\/universos\/([^/]+)\/?$/);
  if (universeEs?.[1]) {
    return { kind: "universe", pathname: "/universos/[slug]", slug: universeEs[1] };
  }

  const orderPaths: Array<{ pattern: RegExp; pathname: AppPathname }> = [
    { pattern: /^\/pago\/([^/]+)\/?$/, pathname: "/pago/[orderNumber]" },
    { pattern: /^\/en\/payment\/([^/]+)\/?$/, pathname: "/pago/[orderNumber]" },
    { pattern: /^\/pedido\/([^/]+)\/confirmacion\/?$/, pathname: "/pedido/[orderNumber]/confirmacion" },
    { pattern: /^\/en\/order\/([^/]+)\/confirmation\/?$/, pathname: "/pedido/[orderNumber]/confirmacion" },
    { pattern: /^\/cuenta\/pedidos\/([^/]+)\/?$/, pathname: "/cuenta/pedidos/[orderNumber]" },
    { pattern: /^\/en\/account\/orders\/([^/]+)\/?$/, pathname: "/cuenta/pedidos/[orderNumber]" },
  ];
  for (const item of orderPaths) {
    const match = pathname.match(item.pattern);
    if (match?.[1]) {
      return { kind: "static", pathname: item.pathname, slug: match[1] };
    }
  }

  const staticPaths: Array<{ pattern: RegExp; pathname: AppPathname }> = [
    { pattern: /^\/en\/products\/?$/, pathname: "/productos" },
    { pattern: /^\/productos\/?$/, pathname: "/productos" },
    { pattern: /^\/en\/universes\/?$/, pathname: "/universos" },
    { pattern: /^\/universos\/?$/, pathname: "/universos" },
    { pattern: /^\/en\/about\/?$/, pathname: "/nosotros" },
    { pattern: /^\/nosotros\/?$/, pathname: "/nosotros" },
    { pattern: /^\/en\/contact\/?$/, pathname: "/contacto" },
    { pattern: /^\/contacto\/?$/, pathname: "/contacto" },
    { pattern: /^\/en\/cart\/?$/, pathname: "/carrito" },
    { pattern: /^\/carrito\/?$/, pathname: "/carrito" },
    { pattern: /^\/(?:en\/)?checkout\/?$/, pathname: "/checkout" },
    { pattern: /^\/en\/account\/login\/?$/, pathname: "/cuenta/iniciar-sesion" },
    { pattern: /^\/cuenta\/iniciar-sesion\/?$/, pathname: "/cuenta/iniciar-sesion" },
    { pattern: /^\/en\/account\/register\/?$/, pathname: "/cuenta/registro" },
    { pattern: /^\/cuenta\/registro\/?$/, pathname: "/cuenta/registro" },
    { pattern: /^\/en\/account\/forgot-password\/?$/, pathname: "/cuenta/recuperar-contrasena" },
    { pattern: /^\/cuenta\/recuperar-contrasena\/?$/, pathname: "/cuenta/recuperar-contrasena" },
    { pattern: /^\/en\/account\/reset-password\/?$/, pathname: "/cuenta/restablecer-contrasena" },
    { pattern: /^\/cuenta\/restablecer-contrasena\/?$/, pathname: "/cuenta/restablecer-contrasena" },
    { pattern: /^\/en\/account\/?$/, pathname: "/cuenta" },
    { pattern: /^\/cuenta\/?$/, pathname: "/cuenta" },
    { pattern: /^\/en\/terms\/?$/, pathname: "/terminos" },
    { pattern: /^\/terminos\/?$/, pathname: "/terminos" },
    { pattern: /^\/en\/privacy\/?$/, pathname: "/aviso-de-privacidad" },
    { pattern: /^\/aviso-de-privacidad\/?$/, pathname: "/aviso-de-privacidad" },
    { pattern: /^\/(?:en\/)?design-system\/?$/, pathname: "/design-system" },
    { pattern: /^\/en\/?$/, pathname: "/" },
    { pattern: /^\/$/, pathname: "/" },
  ];

  const staticMatch = staticPaths.find((item) => item.pattern.test(pathname || "/"));
  return { kind: "static", pathname: staticMatch?.pathname ?? "/" };
}

export function pickTranslatedSlug(
  translations: readonly { locale: string; slug: string }[],
  target: AppLocale,
): string | null {
  return translations.find((item) => item.locale === target)?.slug ?? null;
}

export function localeSwitchHref(input: LocaleSwitchInput): string {
  const params = new URLSearchParams({
    to: input.to,
    pathname: input.pathname,
  });
  if (input.slug) {
    params.set("slug", input.slug);
  }
  return `/locale-switch?${params.toString()}`;
}
