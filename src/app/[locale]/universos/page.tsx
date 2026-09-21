import type { Metadata } from "next";
import { hasLocale } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import { Container } from "@/components/layout/container";
import { Section } from "@/components/layout/section";
import { routing } from "@/i18n/routing";
import { isAppLocale } from "@/config/i18n";
import { CatalogBreadcrumbs } from "@/modules/catalog/components/catalog-breadcrumbs";
import { UniverseCard } from "@/modules/catalog/components/universe-card";
import { getActiveUniverses } from "@/modules/catalog/public/queries";
import { absoluteUrl, localizedPath } from "@/modules/catalog/public/canonical";
import "@/modules/catalog/catalog.css";

export const dynamic = "force-dynamic";

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

  const t = await getTranslations({ locale, namespace: "universes.meta" });
  const path = localizedPath(locale, "/universos");
  const languages = {
    "es-MX": absoluteUrl(localizedPath("es-MX", "/universos")),
    "en-US": absoluteUrl(localizedPath("en-US", "/universos")),
  };

  return {
    title: t("title"),
    description: t("description"),
    robots: { index: true, follow: true },
    alternates: {
      canonical: absoluteUrl(path) ?? path,
      languages: Object.fromEntries(
        Object.entries(languages).filter(([, url]) => Boolean(url)),
      ),
    },
  };
}

export default async function UniversesPage({ params }: PageProps) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale) || !isAppLocale(locale)) {
    notFound();
  }

  setRequestLocale(locale);
  const t = await getTranslations("universes");
  const universes = await getActiveUniverses(locale);

  return (
    <Section className="catalog-hero">
      <Container>
        <CatalogBreadcrumbs
          label={t("breadcrumbs")}
          items={[
            { label: t("home"), href: "/" },
            { label: t("list"), current: true },
          ]}
        />
        <p className="type-label mt-8 tracking-[0.2em] text-secondary">
          {t("eyebrow")}
        </p>
        <h1 className="type-display-l mt-3 text-pretty">{t("title")}</h1>
        <p className="type-body mt-4 max-w-xl text-pretty text-muted-foreground">
          {t("intro")}
        </p>

        {universes.length === 0 ? (
          <p className="type-body mt-16 text-muted-foreground">{t("empty")}</p>
        ) : (
          <div className="catalog-universe-grid mt-12">
            {universes.map((universe) => (
              <UniverseCard
                key={universe.id}
                universe={universe}
                ctaLabel={t("cta")}
              />
            ))}
          </div>
        )}
      </Container>
    </Section>
  );
}
