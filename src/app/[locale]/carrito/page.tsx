import type { Metadata } from "next";
import { hasLocale } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import { Container } from "@/components/layout/container";
import { Section } from "@/components/layout/section";
import { routing } from "@/i18n/routing";
import { isAppLocale } from "@/config/i18n";
import { CatalogRateBanner } from "@/modules/catalog/components/catalog-rate-banner";
import { CartPageView } from "@/modules/cart/components/cart-view";
import { getCartView } from "@/modules/cart/queries";
import { getOptionalCustomer } from "@/modules/customer-auth/queries";
import { getCustomerPendingPaymentOrder } from "@/modules/orders/queries";
import { cancelPendingOrder } from "@/modules/orders/actions";
import { resolveCartCheckoutMode } from "@/modules/cart/domain/pending-payment";
import { applySucceededPaymentIntentIfNeeded } from "@/modules/payments/sync-succeeded";
import { getStripeGateway } from "@/server/stripe/client";
import { getCurrentCartRecord } from "@/server/cart/session";
import { canCustomerShop } from "@/modules/customer-auth/domain/status";
import { canEnterCheckout } from "@/modules/checkout/domain/cart-gate";
import { Link, getPathname } from "@/i18n/navigation";
import { getDisplayCurrency } from "@/server/preferences/currency";
import { getExchangeRateSet } from "@/server/exchange-rates/service";

export const dynamic = "force-dynamic";

type PageProps = {
  params: Promise<{ locale: string }>;
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale) || !isAppLocale(locale)) {
    return { robots: { index: false, follow: false } };
  }
  const t = await getTranslations({ locale, namespace: "cart" });
  return { title: t("title"), robots: { index: false, follow: false } };
}

export default async function CartPage({ params }: PageProps) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale) || !isAppLocale(locale)) {
    notFound();
  }

  setRequestLocale(locale);
  const t = await getTranslations("cart");
  const catalogT = await getTranslations("catalog");
  const displayCurrency = await getDisplayCurrency();
  const rateSet = await getExchangeRateSet();
  const customer = await getOptionalCustomer();
  const canShop = Boolean(customer && canCustomerShop(customer.status));
  const cartPath = getPathname({ locale, href: "/carrito" });

  if (!canShop) {
    return (
      <Section>
        <Container>
          <h1 className="type-display-l">{t("title")}</h1>
          <p className="type-body mt-6 max-w-md text-muted-foreground">{t("loginRequired")}</p>
          <div className="mt-6 flex flex-wrap gap-5">
            <Link
              href={{ pathname: "/cuenta/iniciar-sesion", query: { next: cartPath } }}
              className="type-label tracking-[0.12em] text-secondary"
            >
              {t("login")}
            </Link>
            <Link
              href={{ pathname: "/cuenta/registro", query: { next: cartPath } }}
              className="type-label tracking-[0.12em] text-secondary"
            >
              {t("register")}
            </Link>
          </div>
        </Container>
      </Section>
    );
  }

  let cart = await getCartView({ locale, displayCurrency, rateSet });
  let currentCart = await getCurrentCartRecord();
  let pending =
    currentCart?.status === "PENDING_PAYMENT" && customer
      ? await getCustomerPendingPaymentOrder(customer.id)
      : null;
  let paymentIntentStatus: string | null = null;
  if (pending?.stripePaymentIntentId) {
    try {
      await applySucceededPaymentIntentIfNeeded({
        stripePaymentIntentId: pending.stripePaymentIntentId,
        orderStatus: pending.status,
        paymentStatus: pending.paymentStatus,
      });
      paymentIntentStatus = (
        await getStripeGateway().retrievePaymentIntent(pending.stripePaymentIntentId)
      ).status;
      cart = await getCartView({ locale, displayCurrency, rateSet });
      currentCart = await getCurrentCartRecord();
      pending =
        currentCart?.status === "PENDING_PAYMENT" && customer
          ? await getCustomerPendingPaymentOrder(customer.id)
          : null;
    } catch {
      paymentIntentStatus = null;
    }
  }
  const checkoutMode = resolveCartCheckoutMode({
    cartStatus: currentCart?.status,
    pendingOrderNumber: pending?.orderNumber,
    paymentIntentStatus,
  });

  return (
    <Section>
      <Container>
        <h1 className="type-display-l">{t("title")}</h1>
        <CatalogRateBanner
          locale={locale}
          displayCurrency={displayCurrency}
          rateSet={rateSet}
          note={catalogT("fxNote")}
          unavailable={catalogT("fxUnavailable")}
        />
        <CartPageView
          cart={cart}
          labels={{
            empty: t("empty"),
            discover: t("discover"),
            subtotal: t("subtotal"),
            keepShopping: t("keepShopping"),
            clear: t("clear"),
            confirmClear: t("confirmClear"),
            quantity: t("quantity"),
            decrease: t("decrease"),
            increase: t("increase"),
            remove: t("remove"),
            unavailable: t("unavailable"),
            configUnavailable: t("configUnavailable"),
            update: t("update"),
            unitPrice: t("unitPrice"),
            lineTotal: t("lineTotal"),
            checkout: t("checkout"),
            reviewCart: t("reviewCart"),
            pendingPaymentTitle: t("pendingPaymentTitle"),
            pendingPaymentBody: t("pendingPaymentBody"),
            confirmingPaymentTitle: t("confirmingPaymentTitle"),
            confirmingPaymentBody: t("confirmingPaymentBody"),
            viewOrder: t("viewOrder"),
            continuePayment: t("continuePayment"),
            confirmCancelPending: t("confirmCancelPending"),
          }}
          canCheckout={checkoutMode === "active" && canEnterCheckout(cart)}
          locked={checkoutMode !== "active"}
          mode={checkoutMode}
          orderNumber={pending?.orderNumber}
          pendingLabel={t("continuePayment")}
          cancelLabel={t("cancelPending")}
          cancelAction={cancelPendingOrder}
        />
      </Container>
    </Section>
  );
}
