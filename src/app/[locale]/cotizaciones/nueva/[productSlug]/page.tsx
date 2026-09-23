import type { Metadata } from "next";
import { hasLocale } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import { Container } from "@/components/layout/container";
import { Section } from "@/components/layout/section";
import { getPathname } from "@/i18n/navigation";
import { routing } from "@/i18n/routing";
import { isAppLocale } from "@/config/i18n";
import { requireCustomer } from "@/modules/customer-auth/queries";
import { getPublishedCustomQuoteProduct } from "@/modules/quotations/queries";
import { QuoteRequestForm } from "@/modules/quotations/components/quote-request-form";

export const dynamic = "force-dynamic";

type PageProps = {
  params: Promise<{ locale: string; productSlug: string }>;
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale) || !isAppLocale(locale)) {
    return { robots: { index: false, follow: false } };
  }
  const t = await getTranslations({ locale, namespace: "quotations" });
  return { title: t("newTitle"), robots: { index: false, follow: false } };
}

export default async function NewQuotationPage({ params }: PageProps) {
  const { locale, productSlug } = await params;
  if (!hasLocale(routing.locales, locale) || !isAppLocale(locale)) {
    notFound();
  }
  setRequestLocale(locale);
  const next = getPathname({
    locale,
    href: { pathname: "/cotizaciones/nueva/[productSlug]", params: { productSlug } },
  });
  await requireCustomer(next);
  const product = await getPublishedCustomQuoteProduct(productSlug, locale);
  if (!product) {
    notFound();
  }
  const t = await getTranslations("quotations");
  const translation =
    product.translations.find((item) => item.locale === locale) ??
    product.translations.find((item) => item.locale === "es-MX");

  return (
    <Section>
      <Container>
        <h1 className="type-display-l">{t("newTitle")}</h1>
        <p className="type-body mt-4 text-muted-foreground">{t("product")}: {translation?.name}</p>
        <div className="mt-10 max-w-xl">
          <QuoteRequestForm
            productId={product.id}
            productName={translation?.name ?? productSlug}
            labels={{
              title: t("requestTitle"),
              description: t("description"),
              descriptionHelp: t("descriptionHelp"),
              eventDate: t("eventDate"),
              guestCount: t("guestCount"),
              notes: t("notes"),
              attachments: t("attachments"),
              attachmentsHelp: t("attachmentsHelp"),
              submit: t("submit"),
            }}
          />
        </div>
      </Container>
    </Section>
  );
}
