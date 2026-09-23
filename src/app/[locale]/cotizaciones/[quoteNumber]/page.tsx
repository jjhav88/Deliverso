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
import { getCustomerQuotation } from "@/modules/quotations/queries";
import { quotationStatusLabel } from "@/modules/quotations/domain/labels";
import {
  canCustomerAccept,
  canCustomerCancel,
  canCustomerReply,
} from "@/modules/quotations/domain/lifecycle";
import { QuoteCustomerActions } from "@/modules/quotations/components/quote-customer-actions";
import { formatMoneyFromMinorUnits } from "@/lib/money/format";

export const dynamic = "force-dynamic";

type PageProps = {
  params: Promise<{ locale: string; quoteNumber: string }>;
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale) || !isAppLocale(locale)) {
    return { robots: { index: false, follow: false } };
  }
  const t = await getTranslations({ locale, namespace: "quotations" });
  return { title: t("detailTitle"), robots: { index: false, follow: false } };
}

export default async function CustomerQuotationDetailPage({ params }: PageProps) {
  const { locale, quoteNumber } = await params;
  if (!hasLocale(routing.locales, locale) || !isAppLocale(locale)) {
    notFound();
  }
  setRequestLocale(locale);
  const customer = await requireCustomer("/cotizaciones");
  const quote = await getCustomerQuotation({ customerId: customer.id, quoteNumber });
  if (!quote) {
    notFound();
  }
  const t = await getTranslations("quotations");
  const now = new Date();
  const offer = quote.activeOffer;
  const needsAddress = quote.status === "QUOTED" && offer?.fulfillmentMethod === "DELIVERY" && !quote.address;

  return (
    <Section>
      <Container>
        <Link href="/cotizaciones" className="type-caption text-secondary">
          {t("back")}
        </Link>
        <h1 className="type-display-l mt-4">{quote.quoteNumber}</h1>
        <p className="type-body mt-3">{quote.productNameSnapshot}</p>
        <p className="type-body-sm mt-2 text-muted-foreground">
          {t("status")}: {quotationStatusLabel(quote.status, locale)}
        </p>
        {quote.requestTitle ? <p className="type-h3 mt-8">{quote.requestTitle}</p> : null}
        <p className="type-body mt-4 whitespace-pre-wrap">{quote.requestDescription}</p>
        {quote.eventDate ? (
          <p className="type-body-sm mt-4 text-muted-foreground">
            {t("eventDate")}: {new Date(quote.eventDate).toLocaleDateString(locale)}
          </p>
        ) : null}
        {quote.guestCount ? (
          <p className="type-body-sm text-muted-foreground">
            {t("guestCount")}: {quote.guestCount}
          </p>
        ) : null}

        {quote.attachments.length > 0 ? (
          <section className="mt-10">
            <h2 className="type-h3">{t("attachmentsSection")}</h2>
            <ul className="mt-4 grid gap-4 sm:grid-cols-2">
              {quote.attachments.map((item) => (
                <li key={item.id}>
                  {item.url ? (
                    <a href={item.url} target="_blank" rel="noreferrer" className="block">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={item.url} alt={item.fileName} className="max-h-56 w-full rounded-md object-cover" />
                    </a>
                  ) : (
                    <p className="type-caption">{item.fileName}</p>
                  )}
                </li>
              ))}
            </ul>
          </section>
        ) : null}

        {offer && quote.status === "QUOTED" ? (
          <section className="mt-10 grid gap-2 rounded-lg border border-border p-6">
            <h2 className="type-h3">{t("detailTitle")}</h2>
            <p className="type-body tabular-nums">
              {t("subtotal")}: {formatMoneyFromMinorUnits(offer.subtotalMinor, "MXN", locale)}
            </p>
            <p className="type-body tabular-nums">
              {t("delivery")}: {formatMoneyFromMinorUnits(offer.deliveryFeeMinor, "MXN", locale)}
            </p>
            <p className="type-h3 tabular-nums">
              {t("total")}: {formatMoneyFromMinorUnits(offer.totalMinor, "MXN", locale)}
            </p>
            <p className="type-body-sm text-muted-foreground">
              {t("validUntil")}: {new Date(offer.validUntil).toLocaleString(locale)}
            </p>
            <p className="type-body-sm text-muted-foreground">
              {t("fulfillment")}: {offer.fulfillmentMethod}
            </p>
            {offer.message ? <p className="type-body mt-2">{offer.message}</p> : null}
          </section>
        ) : null}

        {quote.messages.length > 0 ? (
          <section className="mt-10 grid gap-3">
            <h2 className="type-h3">{t("message")}</h2>
            {quote.messages.map((item) => (
              <p key={item.id} className="type-body whitespace-pre-wrap">
                {item.message}
              </p>
            ))}
          </section>
        ) : null}

        <div className="mt-10 max-w-xl">
          <QuoteCustomerActions
            quotationId={quote.id}
            canReply={canCustomerReply(quote.status)}
            canCancel={canCustomerCancel(quote.status)}
            canAccept={canCustomerAccept(quote.status, now, quote.validUntil)}
            needsAddress={needsAddress}
            labels={{
              accept: t("accept"),
              decline: t("decline"),
              declineConfirm: t("declineConfirm"),
              cancel: t("cancel"),
              cancelConfirm: t("cancelConfirm"),
              reply: t("reply"),
              replyPlaceholder: t("replyPlaceholder"),
              addressTitle: t("addressTitle"),
              street: t("street"),
              exterior: t("exterior"),
              interior: t("interior"),
              locality: t("locality"),
              city: t("city"),
              state: t("state"),
              postalCode: t("postalCode"),
              reference: t("reference"),
              saveAddress: t("saveAddress"),
            }}
          />
        </div>
      </Container>
    </Section>
  );
}
