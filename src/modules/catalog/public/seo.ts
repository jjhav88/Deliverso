import type { AppLocale } from "@/config/i18n";
import { supportedLocales } from "@/config/i18n";
import { excerptForSeo, isUsefulLocalizedCopy } from "@/modules/seo/content";

export function resolveProductSeo(input: {
  name: string;
  shortDescription: string | null;
  description?: string | null;
  seoTitle: string | null;
  seoDescription: string | null;
}): { title: string; description: string } {
  const title = input.seoTitle?.trim() || input.name;
  const description =
    excerptForSeo(input.seoDescription) ||
    excerptForSeo(input.shortDescription) ||
    excerptForSeo(input.description) ||
    input.name;

  return { title, description };
}

export function localesWithTranslation(
  translations: readonly { locale: string }[],
): AppLocale[] {
  return supportedLocales.filter((locale) =>
    translations.some((item) => item.locale === locale),
  );
}

export type TranslationSlug = {
  locale: AppLocale;
  slug: string;
};

export function translationSlugs(
  translations: readonly { locale: string; slug: string }[],
): TranslationSlug[] {
  return translations.flatMap((item) =>
    item.locale === "es-MX" || item.locale === "en-US"
      ? [{ locale: item.locale, slug: item.slug }]
      : [],
  );
}

export function indexableTranslationSlugs(
  translations: readonly {
    locale: string;
    slug: string;
    name: string;
    shortDescription?: string | null;
    description?: string | null;
  }[],
): TranslationSlug[] {
  return translationSlugs(translations).filter((item) => {
    const row = translations.find((entry) => entry.locale === item.locale);
    return (
      Boolean(row) &&
      isUsefulLocalizedCopy({
        locale: row!.locale,
        name: row!.name,
        shortDescription: row!.shortDescription,
        description: row!.description,
      })
    );
  });
}
