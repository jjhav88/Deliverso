import { ShoppingBag, User } from "lucide-react";
import { getLocale, getTranslations } from "next-intl/server";
import { BrandLogo } from "@/components/brand/brand-logo";
import { Container } from "@/components/layout/container";
import { MainNav } from "@/components/layout/main-nav";
import { MobileNavigation } from "@/components/layout/mobile-navigation";
import { CurrencySelector } from "@/components/preferences/currency-selector";
import { LanguageSelector } from "@/components/preferences/language-selector";
import type { CurrencyCode } from "@/config/currency";
import { supportedCurrencies } from "@/config/currency";
import { accountHref, accountLoginHref, cartHref, mainNavigation } from "@/config/navigation";
import { Link } from "@/i18n/navigation";
import { getCurrencyDisplayName } from "@/lib/currency/display-name";
import { SessionIdentity } from "@/modules/account/components/session-identity";
import { profileDisplayName } from "@/modules/account/domain/presentation";
import { signAvatarUrl } from "@/modules/avatars/service";
import { getLanguageSwitchItems } from "@/modules/i18n/language-switch-items";
import { getCartItemCount } from "@/modules/cart/queries";
import { getOptionalCustomer } from "@/modules/customer-auth/queries";
import { navigationCustomerFallback } from "@/modules/customer-auth/domain/errors";
import { canCustomerShop } from "@/modules/customer-auth/domain/status";
import { isTransientDatabaseError } from "@/server/db/errors";
import { cn } from "@/lib/cn";

type HeaderProps = {
  currency: CurrencyCode;
};

export async function Header({ currency }: HeaderProps) {
  const locale = await getLocale();
  const t = await getTranslations("storefront");
  const navItems = mainNavigation.map((item) => ({
    href: item.href,
    label: t(`nav.${item.key}`),
  }));
  const localeLabels = {
    "es-MX": t("languageEs"),
    "en-US": t("languageEn"),
  };
  const currencyOptions = supportedCurrencies.map((code) => ({
    code,
    name: getCurrencyDisplayName(locale, code),
  }));
  const languageItems = await getLanguageSwitchItems();
  let customer = null;
  let cartCount = 0;
  try {
    customer = await getOptionalCustomer();
    const signedInCustomer = Boolean(customer && canCustomerShop(customer.status));
    cartCount = signedInCustomer ? await getCartItemCount() : 0;
  } catch (error) {
    if (navigationCustomerFallback(error) === "unavailable" || isTransientDatabaseError(error)) {
      customer = null;
      cartCount = 0;
    } else {
      throw error;
    }
  }
  const signedIn = Boolean(customer && canCustomerShop(customer.status));
  const accountLabel = signedIn ? t("account") : t("signIn");
  const accountLink = signedIn ? accountHref : accountLoginHref;
  const languageLabels = {
    language: t("language"),
    locales: localeLabels,
    unavailable: t("languageUnavailable"),
  };
  const displayName = customer ? profileDisplayName(customer) : "";
  const avatarUrl = customer ? await signAvatarUrl(customer.avatarPath) : null;

  return (
    <header
      className={cn(
        "sticky top-0 z-40 border-b border-transparent",
        "bg-background/55 backdrop-blur-md",
      )}
    >
      <Container className="flex h-[var(--header-height)] items-center justify-between gap-4">
        <Link
          href="/"
          className="inline-flex shrink-0 items-center bg-transparent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring focus-visible:ring-offset-2"
        >
          <BrandLogo mark="icon" className="h-10 w-auto" />
        </Link>

        <nav aria-label={t("primaryNav")} className="hidden lg:block">
          <MainNav items={navItems} />
        </nav>

        <div className="flex items-center gap-1 sm:gap-2">
          <div className="hidden sm:block">
            <LanguageSelector
              compact
              items={languageItems}
              labels={languageLabels}
            />
          </div>
          <div className="hidden sm:block">
            <CurrencySelector
              compact
              current={currency}
              options={currencyOptions}
              label={t("currency")}
            />
          </div>
          {signedIn && customer ? (
            <SessionIdentity
              variant="customer"
              displayName={displayName}
              avatarUrl={avatarUrl}
              profileHref={accountHref}
              profileLabel={t("account")}
              signOutLabel={t("signOut")}
              menuLabel={t("accountMenu")}
            />
          ) : (
            <Link
              href={accountLink}
              aria-label={accountLabel}
              title={accountLabel}
              className={cn(
                "relative inline-flex min-h-11 min-w-11 items-center justify-center rounded-md text-foreground",
                "transition-colors duration-[var(--duration-fast)] ease-[var(--easing-standard)]",
                "hover:bg-muted",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring focus-visible:ring-offset-2",
              )}
            >
              <User aria-hidden="true" className="h-5 w-5" />
            </Link>
          )}
          <Link
            href={cartHref}
            aria-label={cartCount > 0 ? `${t("cart")} (${cartCount})` : t("cart")}
            className={cn(
              "relative inline-flex min-h-11 min-w-11 items-center justify-center rounded-md text-foreground",
              "transition-colors duration-[var(--duration-fast)] ease-[var(--easing-standard)]",
              "hover:bg-muted",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring focus-visible:ring-offset-2",
            )}
          >
            <ShoppingBag aria-hidden="true" className="h-5 w-5" />
            {cartCount > 0 ? (
              <span className="absolute right-1 top-1 inline-flex min-h-4 min-w-4 items-center justify-center rounded-full bg-accent px-1 text-[10px] font-medium text-accent-foreground">
                {cartCount}
              </span>
            ) : null}
          </Link>
          <MobileNavigation
            navItems={navItems}
            currency={currency}
            currencyOptions={currencyOptions}
            languageItems={languageItems}
            labels={{
              openMenu: t("openMenu"),
              closeMenu: t("closeMenu"),
              language: t("language"),
              locales: localeLabels,
              languageUnavailable: t("languageUnavailable"),
              currency: t("currency"),
              account: accountLabel,
            }}
            accountHref={accountLink}
          />
        </div>
      </Container>
    </header>
  );
}
