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

  const cart = await getCartView({ locale, displayCurrency, rateSet });
  const currentCart = await getCurrentCartRecord();
  const pending =
    currentCart?.status === "PENDING_PAYMENT" && customer
      ? await getCustomerPendingPaymentOrder(customer.id)
      : null;

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
          }}
          canCheckout={!pending && canEnterCheckout(cart)}
          locked={Boolean(pending)}
          orderNumber={pending?.orderNumber}
          pendingLabel={t("continuePayment")}
          cancelLabel={t("cancelPending")}
          cancelAction={cancelPendingOrder}
        />
      </Container>
    </Section>
  );
}
