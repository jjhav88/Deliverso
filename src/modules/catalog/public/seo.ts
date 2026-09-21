import type { AppLocale } from "@/config/i18n";
import { supportedLocales } from "@/config/i18n";

export function resolveProductSeo(input: {
  name: string;
  shortDescription: string | null;
  seoTitle: string | null;
  seoDescription: string | null;
}): { title: string; description: string } {
  const title = input.seoTitle?.trim() || input.name;
  const description =
    input.seoDescription?.trim() ||
    input.shortDescription?.trim() ||
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
