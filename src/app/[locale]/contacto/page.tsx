import type { Metadata } from "next";
import { hasLocale } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import { Mail, MapPin, Phone } from "lucide-react";
import { Container } from "@/components/layout/container";
import { Section } from "@/components/layout/section";
import { routing } from "@/i18n/routing";
import { isAppLocale } from "@/config/i18n";
import { Link } from "@/i18n/navigation";
import { CatalogBreadcrumbs } from "@/modules/catalog/components/catalog-breadcrumbs";
import { JsonLd } from "@/modules/catalog/components/json-ld";
import { buildBreadcrumbJsonLd } from "@/modules/catalog/public/json-ld";
import { getPublicSiteSettings } from "@/modules/settings/queries";
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

  const t = await getTranslations({ locale, namespace: "contactPage" });
  return publicPageMetadata({
    title: t("metaTitle"),
    description: t("metaDescription"),
    pathname: localizedPath(locale, "/contacto"),
    locale,
    languages: buildLocaleAlternates("/contacto"),
  });
}

export default async function ContactPage({ params }: PageProps) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale) || !isAppLocale(locale)) {
    notFound();
  }

  setRequestLocale(locale);
  const t = await getTranslations("contactPage");
  const settings = await getPublicSiteSettings();
  const path = localizedPath(locale, "/contacto");
  const url = buildCanonicalUrl(path) ?? path;
  const email = settings?.contactEmail ?? null;
  const whatsapp = settings?.whatsapp ?? null;
  const whatsappHref = settings?.whatsappHref ?? null;
  const address = settings?.physicalAddress ?? null;
  const hasChannels = Boolean(email || whatsapp || address);

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
        <p className="type-body mt-4 max-w-2xl text-pretty text-muted-foreground">
          {t("intro")}
        </p>

        {hasChannels ? (
          <ul className="mt-10 flex max-w-xl flex-col gap-4">
            {email ? (
              <li>
                <a
                  href={`mailto:${email}`}
                  className="inline-flex items-center gap-3 type-body hover:text-secondary"
                >
                  <Mail aria-hidden="true" className="h-4 w-4 shrink-0" strokeWidth={1.6} />
                  <span>
                    <span className="type-label mr-2 tracking-[0.12em] text-muted-foreground">
                      {t("email")}
                    </span>
                    {email}
                  </span>
                </a>
              </li>
            ) : null}
            {whatsapp ? (
              <li>
                {whatsappHref ? (
                  <a
                    href={whatsappHref}
                    className="inline-flex items-center gap-3 type-body hover:text-secondary"
                    rel="noreferrer"
                    target="_blank"
                  >
                    <Phone aria-hidden="true" className="h-4 w-4 shrink-0" strokeWidth={1.6} />
                    <span>
                      <span className="type-label mr-2 tracking-[0.12em] text-muted-foreground">
                        {t("whatsapp")}
                      </span>
                      {whatsapp}
                    </span>
                  </a>
                ) : (
                  <p className="inline-flex items-center gap-3 type-body">
                    <Phone aria-hidden="true" className="h-4 w-4 shrink-0" strokeWidth={1.6} />
                    <span>
                      <span className="type-label mr-2 tracking-[0.12em] text-muted-foreground">
                        {t("whatsapp")}
                      </span>
                      {whatsapp}
                    </span>
                  </p>
                )}
              </li>
            ) : null}
            {address ? (
              <li className="inline-flex items-start gap-3 type-body">
                <MapPin aria-hidden="true" className="mt-0.5 h-4 w-4 shrink-0" strokeWidth={1.6} />
                <span>
                  <span className="type-label mr-2 tracking-[0.12em] text-muted-foreground">
                    {t("address")}
                  </span>
                  {address}
                </span>
              </li>
            ) : null}
          </ul>
        ) : (
          <p className="type-body mt-10 max-w-xl text-muted-foreground">{t("empty")}</p>
        )}
        <p className="type-caption mt-10 max-w-xl text-muted-foreground">
          {t("privacyNotice")}{" "}
          <Link href="/aviso-de-privacidad" className="text-secondary">
            {t("privacyLink")}
          </Link>
        </p>
      </Container>
    </Section>
  );
}
