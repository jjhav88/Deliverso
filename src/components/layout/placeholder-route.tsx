import type { Metadata } from "next";
import { hasLocale } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import { PlaceholderPage } from "@/components/layout/placeholder-page";
import { routing } from "@/i18n/routing";

export type PlaceholderSection =
  | "products"
  | "universes"
  | "about"
  | "contact"
  | "cart";

type PlaceholderRouteProps = {
  params: Promise<{ locale: string }>;
  section: PlaceholderSection;
};

export async function getPlaceholderMetadata(
  locale: string,
  section: PlaceholderSection,
): Promise<Metadata> {
  if (!hasLocale(routing.locales, locale)) {
    return { robots: { index: false, follow: false } };
  }

  const t = await getTranslations({
    locale,
    namespace: `placeholders.${section}`,
  });

  return {
    title: t("title"),
    description: t("body"),
    robots: {
      index: false,
      follow: false,
    },
  };
}

export async function PlaceholderRoute({
  params,
  section,
}: PlaceholderRouteProps) {
  const { locale } = await params;

  if (!hasLocale(routing.locales, locale)) {
    notFound();
  }

  setRequestLocale(locale);
  const t = await getTranslations(`placeholders.${section}`);
  const common = await getTranslations("placeholders");

  return (
    <PlaceholderPage
      eyebrow={common("eyebrow")}
      title={t("title")}
      body={t("body")}
    />
  );
}
