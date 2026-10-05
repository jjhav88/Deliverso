import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";

export default async function StorefrontNotFound() {
  const t = await getTranslations("notFound");

  return (
    <main className="mx-auto max-w-xl px-6 py-16">
      <p className="type-caption text-secondary">DELIVERSO</p>
      <h1 className="type-h2 mt-4">{t("title")}</h1>
      <p className="type-body mt-3 text-muted-foreground">{t("body")}</p>
      <nav className="mt-8 flex flex-col gap-3" aria-label={t("links")}>
        <Link href="/" className="type-label tracking-[0.12em] text-secondary">
          {t("home")}
        </Link>
        <Link href="/productos" className="type-label tracking-[0.12em] text-secondary">
          {t("products")}
        </Link>
        <Link href="/universos" className="type-label tracking-[0.12em] text-secondary">
          {t("universes")}
        </Link>
        <Link href="/contacto" className="type-label tracking-[0.12em] text-secondary">
          {t("contact")}
        </Link>
      </nav>
    </main>
  );
}
