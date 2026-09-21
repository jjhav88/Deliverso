import { getTranslations } from "next-intl/server";
import { BrandLogo } from "@/components/brand/brand-logo";
import {
  FooterDetails,
  FooterSocial,
} from "@/components/layout/footer-contact";
import { Container } from "@/components/layout/container";
import { mainNavigation } from "@/config/navigation";
import { Link } from "@/i18n/navigation";
import { getPublicSiteSettings } from "@/modules/settings/queries";

export async function Footer() {
  const t = await getTranslations("storefront");
  const brandT = await getTranslations("brand");
  const year = new Date().getFullYear();
  const settings = await getPublicSiteSettings();
  const columnLabels = {
    social: t("footer.social"),
    contact: t("footer.contact"),
    networks: {
      facebook: t("footer.facebook"),
      instagram: t("footer.instagram"),
      tiktok: t("footer.tiktok"),
    },
    email: t("footer.email"),
    whatsapp: t("footer.whatsapp"),
    address: t("footer.address"),
  };

  return (
    <footer className="surface-dark border-t border-surface-dark-foreground/8">
      <Container className="grid grid-cols-1 gap-8 py-12 sm:grid-cols-2 sm:gap-x-8 sm:gap-y-10 md:gap-x-10 lg:grid-cols-[minmax(0,1.3fr)_minmax(0,0.8fr)_minmax(0,0.8fr)_minmax(0,1.3fr)] lg:gap-x-10 lg:py-14">
        <div className="sm:col-span-2 md:col-span-1">
          <Link href="/" className="inline-flex bg-transparent">
            <BrandLogo surface="dark" className="h-auto w-36" />
          </Link>
          <p className="type-body-sm mt-4 max-w-xs text-surface-dark-foreground/75">
            {brandT("officialTagline")}
          </p>
        </div>

        <nav aria-label={t("footerNav")}>
          <p className="type-label tracking-[0.18em] text-surface-dark-foreground">
            {t("footer.navigation")}
          </p>
          <ul className="mt-3 flex flex-col gap-3">
            {mainNavigation.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className="inline-flex min-h-6 items-center type-body-sm text-surface-dark-foreground/75 transition-colors hover:text-surface-dark-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring"
                >
                  {t(`nav.${item.key}`)}
                </Link>
              </li>
            ))}
            <li>
              <Link
                href="/terminos"
                className="inline-flex min-h-6 items-center type-body-sm text-surface-dark-foreground/75 transition-colors hover:text-surface-dark-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring"
              >
                {t("footer.terms")}
              </Link>
            </li>
            <li>
              <Link
                href="/aviso-de-privacidad"
                className="inline-flex min-h-6 items-center type-body-sm text-surface-dark-foreground/75 transition-colors hover:text-surface-dark-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring"
              >
                {t("footer.privacy")}
              </Link>
            </li>
          </ul>
        </nav>

        <FooterSocial labels={columnLabels} settings={settings} />
        <div className="sm:col-span-2 md:col-span-1">
          <FooterDetails labels={columnLabels} settings={settings} />
        </div>
      </Container>
      <div className="border-t border-surface-dark-foreground/12">
        <Container className="py-4">
          <p className="type-caption text-surface-dark-foreground/60">
            {t("copyright", { year })}
          </p>
        </Container>
      </div>
    </footer>
  );
}
