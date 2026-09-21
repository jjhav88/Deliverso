import type { Metadata } from "next";
import { hasLocale } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import { Container } from "@/components/layout/container";
import { Section } from "@/components/layout/section";
import { routing } from "@/i18n/routing";
import { isAppLocale } from "@/config/i18n";
import { getPathname } from "@/i18n/navigation";
import { formatMoneyFromMinorUnits } from "@/lib/money/format";
import { requireCustomer } from "@/modules/customer-auth/queries";
import { getOwnedOrderRecord } from "@/modules/orders/queries";
import { toCustomerOrderDetail } from "@/modules/orders/mappers";
import { ConfirmationStatus } from "@/modules/orders/components/confirmation-status";
import { getStripeGateway } from "@/server/stripe/client";

export const dynamic = "force-dynamic";

type PageProps = {
  params: Promise<{ locale: string; orderNumber: string }>;
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale) || !isAppLocale(locale)) {
    return { robots: { index: false, follow: false } };
  }
  const t = await getTranslations({ locale, namespace: "confirmation" });
  return { title: t("title"), robots: { index: false, follow: false } };
}

export default async function ConfirmationPage({ params, searchParams }: PageProps) {
  const { locale, orderNumber } = await params;
  if (searchParams) {
    await searchParams;
  }
  if (!hasLocale(routing.locales, locale) || !isAppLocale(locale)) {
    notFound();
  }
  setRequestLocale(locale);
  const customer = await requireCustomer(
    getPathname({
      locale,
      href: { pathname: "/pedido/[orderNumber]/confirmacion", params: { orderNumber } },
    }),
  );
  const row = await getOwnedOrderRecord({ customerId: customer.id, orderNumber });
  if (!row) {
    notFound();
  }

  const t = await getTranslations("confirmation");
  const order = toCustomerOrderDetail(row, locale);
  let stripeIntentStatus: string | null = null;
  if (row.stripePaymentIntentId) {
    try {
      stripeIntentStatus = (await getStripeGateway().retrievePaymentIntent(row.stripePaymentIntentId))
        .status;
    } catch {
      stripeIntentStatus = null;
    }
  }

  const timeWindow = order.timeWindowLabel
    ? `${order.timeWindowLabel} · ${order.timeWindowStart}–${order.timeWindowEnd}`
    : `${order.timeWindowStart}–${order.timeWindowEnd}`;

  return (
    <Section>
      <Container>
        <ConfirmationStatus
          orderNumber={order.orderNumber}
          orderStatus={order.status}
          paymentStatus={order.paymentStatus}
          stripeIntentStatus={stripeIntentStatus}
          totalLabel={formatMoneyFromMinorUnits(order.grandTotalMinor, "MXN", locale)}
          fulfillmentMethod={order.fulfillmentMethod}
          requestedDate={order.requestedDate}
          timeWindow={timeWindow}
          labels={{
            paidTitle: t("paid"),
            verifyingTitle: t("verifyingTitle"),
            verifyingHint: t("verifyingHint"),
            thanks: t("thanks"),
            syncing: t("syncing"),
            delayed: t("delayed"),
            delayedHint: t("delayedHint"),
            delayedAccount: t("delayedAccount"),
            failed: t("failed"),
            order: t("order"),
            total: t("total"),
            status: t("status"),
            method: t("method"),
            date: t("date"),
            slot: t("slot"),
            statusPaid: t("statusPaid"),
            statusPending: t("statusPending"),
            delivery: t("delivery"),
            pickup: t("pickup"),
            viewOrder: t("viewOrder"),
            keepExploring: t("keepExploring"),
            viewOrders: t("viewOrders"),
            retry: t("retry"),
          }}
        />
      </Container>
    </Section>
  );
}
