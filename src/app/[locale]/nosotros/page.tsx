import type { Metadata } from "next";
import { hasLocale } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import { Container } from "@/components/layout/container";
import { Section } from "@/components/layout/section";
import { routing } from "@/i18n/routing";
import { isAppLocale } from "@/config/i18n";
import { CatalogBreadcrumbs } from "@/modules/catalog/components/catalog-breadcrumbs";
import { JsonLd } from "@/modules/catalog/components/json-ld";
import { buildBreadcrumbJsonLd } from "@/modules/catalog/public/json-ld";
import {
  buildCanonicalUrl,
  buildLocaleAlternates,
  localizedPath,
  publicPageMetadata,
} from "@/modules/seo/urls";

type PageProps = {
  params: Promise<{ locale: string }>;
};

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale) || !isAppLocale(locale)) {
    return {};
  }

  const t = await getTranslations({ locale, namespace: "aboutPage" });
  return publicPageMetadata({
    title: t("metaTitle"),
    description: t("metaDescription"),
    pathname: localizedPath(locale, "/nosotros"),
    locale,
    languages: buildLocaleAlternates("/nosotros"),
  });
}

export default async function AboutPage({ params }: PageProps) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale) || !isAppLocale(locale)) {
    notFound();
  }

  setRequestLocale(locale);
  const t = await getTranslations("aboutPage");
  const path = localizedPath(locale, "/nosotros");
  const url = buildCanonicalUrl(path) ?? path;

  return (
    <Section>
      <Container>
        <CatalogBreadcrumbs
          label={t("title")}
          items={[
            { label: t("home"), href: "/" },
            { label: t("title"), current: true },
          ]}
        />
        <JsonLd
          data={buildBreadcrumbJsonLd({
            items: [
              { name: t("home"), url: buildCanonicalUrl(localizedPath(locale, "/")) ?? "/" },
              { name: t("title"), url },
            ],
          })}
        />
        <p className="type-label mt-8 tracking-[0.2em] text-secondary">
          {t("eyebrow")}
        </p>
        <h1 className="type-display-l mt-3 text-pretty">{t("title")}</h1>
        <p className="type-h3 mt-6 max-w-2xl text-pretty">{t("lead")}</p>
        <p className="type-body mt-4 max-w-2xl text-pretty text-muted-foreground">
          {t("body")}
        </p>
      </Container>
    </Section>
  );
}
