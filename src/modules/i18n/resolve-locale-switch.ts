import "server-only";
import { getPathname } from "@/i18n/navigation";
import type { AppLocale } from "@/config/i18n";
import type { StaticAppPathname } from "@/config/navigation";
import { getPrisma } from "@/server/db/prisma";
import { hasRuntimeDatabaseUrl } from "@/server/db/env";
import { pickTranslatedSlug, type LocaleSwitchInput } from "@/modules/i18n/locale-switch";
import { translationSlugs, type TranslationSlug } from "@/modules/catalog/public/seo";

export type LocaleSwitchResolution = {
  href: string;
  available: boolean;
};

export async function resolveLocaleSwitch(
  input: LocaleSwitchInput,
): Promise<LocaleSwitchResolution> {
  if (input.pathname === "/productos/[slug]" && input.slug) {
    const translations = await findPublishedProductSlugs(input.slug);
    const targetSlug = pickTranslatedSlug(translations, input.to);
    if (!targetSlug) {
      return {
        available: false,
        href: getPathname({ locale: input.to, href: "/productos" }),
      };
    }
    return {
      available: true,
      href: getPathname({
        locale: input.to,
        href: { pathname: "/productos/[slug]", params: { slug: targetSlug } },
      }),
    };
  }

  if (input.pathname === "/universos/[slug]" && input.slug) {
    const translations = await findActiveUniverseSlugs(input.slug);
    const targetSlug = pickTranslatedSlug(translations, input.to);
    if (!targetSlug) {
      return {
        available: false,
        href: getPathname({ locale: input.to, href: "/universos" }),
      };
    }
    return {
      available: true,
      href: getPathname({
        locale: input.to,
        href: { pathname: "/universos/[slug]", params: { slug: targetSlug } },
      }),
    };
  }

  if (
    (input.pathname === "/pago/[orderNumber]" ||
      input.pathname === "/pedido/[orderNumber]/confirmacion" ||
      input.pathname === "/cuenta/pedidos/[orderNumber]") &&
    input.slug
  ) {
    return {
      available: true,
      href: getPathname({
        locale: input.to,
        href: { pathname: input.pathname, params: { orderNumber: input.slug } },
      }),
    };
  }

  const pathname: StaticAppPathname =
    input.pathname === "/productos/[slug]"
      ? "/productos"
      : input.pathname === "/universos/[slug]"
        ? "/universos"
        : input.pathname === "/pago/[orderNumber]" ||
            input.pathname === "/pedido/[orderNumber]/confirmacion" ||
            input.pathname === "/cuenta/pedidos/[orderNumber]"
          ? "/cuenta"
          : input.pathname;

  return {
    available: true,
    href: getPathname({ locale: input.to, href: pathname }),
  };
}

export async function findPublishedProductSlugs(
  slug: string,
): Promise<TranslationSlug[]> {
  if (!hasRuntimeDatabaseUrl()) {
    return [];
  }

  const row = await getPrisma().product.findFirst({
    where: {
      status: "PUBLISHED",
      translations: { some: { slug } },
    },
    select: { translations: { select: { locale: true, slug: true } } },
  });

  return row ? translationSlugs(row.translations) : [];
}

export async function findActiveUniverseSlugs(
  slug: string,
): Promise<TranslationSlug[]> {
  if (!hasRuntimeDatabaseUrl()) {
    return [];
  }

  const row = await getPrisma().universe.findFirst({
    where: {
      isActive: true,
      translations: { some: { slug } },
    },
    select: { translations: { select: { locale: true, slug: true } } },
  });

  return row ? translationSlugs(row.translations) : [];
}

export function localesAvailableForSlug(
  currentLocale: AppLocale,
  translations: TranslationSlug[],
): AppLocale[] {
  const found = new Set(translations.map((item) => item.locale));
  found.add(currentLocale);
  return [...found];
}
