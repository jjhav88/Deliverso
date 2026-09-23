import type { Metadata } from "next";
import { hasLocale } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import { Container } from "@/components/layout/container";
import { Section } from "@/components/layout/section";
import { Link } from "@/i18n/navigation";
import { routing } from "@/i18n/routing";
import { isAppLocale } from "@/config/i18n";
import { requireCustomer } from "@/modules/customer-auth/queries";
import { listCustomerQuotations } from "@/modules/quotations/queries";
import { quotationStatusLabel } from "@/modules/quotations/domain/labels";
import { formatMoneyFromMinorUnits } from "@/lib/money/format";

export const dynamic = "force-dynamic";

type PageProps = {
  params: Promise<{ locale: string }>;
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale) || !isAppLocale(locale)) {
    return { robots: { index: false, follow: false } };
  }
  const t = await getTranslations({ locale, namespace: "quotations" });
  return { title: t("title"), robots: { index: false, follow: false } };
}

export default async function CustomerQuotationsPage({ params }: PageProps) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale) || !isAppLocale(locale)) {
    notFound();
  }
  setRequestLocale(locale);
  const customer = await requireCustomer("/cotizaciones");
  const t = await getTranslations("quotations");
  const items = await listCustomerQuotations(customer.id);

  return (
    <Section>
      <Container>
        <h1 className="type-display-l">{t("title")}</h1>
        {items.length === 0 ? (
          <p className="type-body mt-6 text-muted-foreground">{t("empty")}</p>
        ) : (
          <ul className="mt-8 grid gap-5">
            {items.map((item) => (
              <li key={item.quoteNumber} className="grid gap-1">
                <Link
                  href={{ pathname: "/cotizaciones/[quoteNumber]", params: { quoteNumber: item.quoteNumber } }}
                  className="type-label tracking-[0.12em] text-secondary"
                >
                  {item.quoteNumber}
                </Link>
                <p className="type-body-sm text-muted-foreground">
                  {item.productNameSnapshot} · {quotationStatusLabel(item.status, locale)} ·{" "}
                  {new Date(item.createdAt).toLocaleDateString(locale)}
                  {item.quotedTotalMinor != null
                    ? ` · ${formatMoneyFromMinorUnits(item.quotedTotalMinor, "MXN", locale)}`
                    : ""}
                  {item.validUntil ? ` · ${new Date(item.validUntil).toLocaleDateString(locale)}` : ""}
                </p>
              </li>
            ))}
          </ul>
        )}
      </Container>
    </Section>
  );
}
