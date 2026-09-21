import { ChevronRight, Search, ShoppingBag, User } from "lucide-react";
import { getLocale, getTranslations } from "next-intl/server";
import { BrandLogo } from "@/components/brand/brand-logo";
import { OrbitDecoration } from "@/components/brand/orbit-decoration";
import { StarAccent } from "@/components/brand/star-accent";
import { Container } from "@/components/layout/container";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { FeaturedCard } from "@/components/ui/featured-card";
import { Input } from "@/components/ui/input";
import { ProductCard } from "@/components/ui/product-card";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { brandConfig } from "@/config/brand";
import { brandColors } from "@/design-system/tokens";
import { demoProductPrice, demoSource } from "@/design-system/demo/content";
import { spacingScale } from "@/design-system/tokens";

const palette = [
  { name: "Cream", token: "--deliverso-cream", hex: brandColors.cream, swatch: "bg-deliverso-cream" },
  { name: "Navy", token: "--deliverso-navy", hex: brandColors.navy, swatch: "bg-deliverso-navy" },
  { name: "Purple", token: "--deliverso-purple", hex: brandColors.purple, swatch: "bg-deliverso-purple" },
  { name: "Gold", token: "--deliverso-gold", hex: brandColors.gold, swatch: "bg-deliverso-gold" },
  { name: "Lilac", token: "--deliverso-lilac", hex: brandColors.lilac, swatch: "bg-deliverso-lilac" },
  { name: "Pink", token: "--deliverso-pink", hex: brandColors.pink, swatch: "bg-deliverso-pink" },
] as const;

const semanticSwatches = [
  { name: "background", className: "bg-background" },
  { name: "surface", className: "bg-surface" },
  { name: "surface-elevated", className: "bg-surface-elevated" },
  { name: "primary", className: "bg-primary" },
  { name: "secondary", className: "bg-secondary" },
  { name: "accent", className: "bg-accent" },
  { name: "destructive", className: "bg-destructive" },
  { name: "success", className: "bg-success" },
] as const;

const tocKeys = [
  "brand",
  "color",
  "typography",
  "buttons",
  "badges",
  "forms",
  "cards",
  "product",
  "featured",
  "dark",
  "foundations",
  "motion",
] as const;

export async function DesignSystemShowcase() {
  const locale = await getLocale();
  const t = await getTranslations("designSystem");
  const brandT = await getTranslations("brand");

  return (
    <div>
      <header className="border-b border-border bg-background">
        <Container className="py-16 md:py-20">
          <p className="type-label text-muted-foreground">{t("kicker")}</p>
          <h1 className="type-display-l mt-4 text-foreground">{t("title")}</h1>
          <p className="type-body-lg mt-5 max-w-2xl text-muted-foreground">
            {t("intro")}
          </p>
          <p className="type-caption mt-6 text-muted-foreground">{t("cosmosNote")}</p>
          <nav
            aria-label={t("title")}
            className="mt-10 flex flex-wrap gap-x-4 gap-y-2"
          >
            {tocKeys.map((key) => (
              <a
                key={key}
                href={`#${key}`}
                className="type-caption rounded-sm text-foreground underline decoration-transparent underline-offset-4 transition-colors hover:decoration-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring"
              >
                {t(`toc.${key}`)}
              </a>
            ))}
          </nav>
        </Container>
      </header>

      <section id="brand" className="border-b border-border py-16 md:py-20">
        <Container>
          <SectionHeading>{t("brand.heading")}</SectionHeading>
          <div className="mt-10 grid gap-8 md:grid-cols-[minmax(0,14rem)_1fr] md:items-center">
            <BrandLogo className="max-w-56" />
            <div>
              <p className="type-label tracking-[0.28em] text-primary">
                {brandConfig.name}
              </p>
              <p className="type-h2 mt-4 text-foreground">
                {brandT("officialTagline")}
              </p>
            </div>
          </div>
          <div className="mt-12 grid gap-6 md:grid-cols-3">
            <figure className="rounded-xl border border-border bg-surface p-6">
              <BrandLogo className="max-w-40" />
              <figcaption className="type-caption mt-4 text-muted-foreground">
                {t("brand.lightSurface")}
              </figcaption>
            </figure>
            <figure className="surface-dark rounded-xl p-6">
              <BrandLogo surface="dark" className="max-w-40" />
              <figcaption className="type-caption mt-4 text-muted-foreground">
                {t("brand.darkSurface")}
              </figcaption>
            </figure>
            <figure className="rounded-xl border border-border bg-surface p-6">
              <BrandLogo mark="icon" className="max-w-40" />
              <figcaption className="type-caption mt-4 text-muted-foreground">
                {t("brand.iconMark")}
              </figcaption>
            </figure>
          </div>
        </Container>
      </section>

      <section id="color" className="border-b border-border bg-surface-subtle py-16 md:py-20">
        <Container>
          <SectionHeading>{t("color.heading")}</SectionHeading>
          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {palette.map((color) => (
              <article
                key={color.token}
                className="overflow-hidden rounded-lg border border-border bg-surface-elevated"
              >
                <div className={`h-24 ${color.swatch}`} />
                <div className="px-4 py-3">
                  <p className="type-h4">{color.name}</p>
                  <p className="type-caption mt-1 text-muted-foreground">{color.token}</p>
                  <p className="type-caption mt-1 font-medium tracking-wide">
                    {color.hex}
                  </p>
                </div>
              </article>
            ))}
          </div>
          <h3 className="type-h3 mt-12">{t("color.semanticHeading")}</h3>
          <div className="mt-6 grid grid-cols-2 gap-3 md:grid-cols-4">
            {semanticSwatches.map((item) => (
              <div key={item.name} className="rounded-md border border-border p-3">
                <div className={`h-10 rounded-sm border border-border ${item.className}`} />
                <p className="type-caption mt-2">{item.name}</p>
              </div>
            ))}
          </div>
          <p className="type-body-sm mt-8 max-w-2xl text-muted-foreground">
            {t("color.goldWarning")}
          </p>
        </Container>
      </section>

      <section id="typography" className="border-b border-border py-16 md:py-20">
        <Container>
          <SectionHeading>{t("typography.heading")}</SectionHeading>
          <p className="type-body-sm mt-3 text-muted-foreground">
            {t("typography.displayNote")}
          </p>
          <p className="type-body-sm text-muted-foreground">
            {t("typography.sansNote")}
          </p>
          <div className="mt-10 space-y-8">
            <TypeRow label="Display XL" className="type-display-xl">
              {t("typography.sampleDisplayXl")}
            </TypeRow>
            <TypeRow label="Display L" className="type-display-l">
              {t("typography.sampleDisplayL")}
            </TypeRow>
            <TypeRow label="Heading 1" className="type-h1">
              {t("typography.sampleH1")}
            </TypeRow>
            <TypeRow label="Heading 2" className="type-h2">
              {t("typography.sampleH2")}
            </TypeRow>
            <TypeRow label="Heading 3" className="type-h3">
              {t("typography.sampleH3")}
            </TypeRow>
            <TypeRow label="Heading 4" className="type-h4">
              {t("typography.sampleH4")}
            </TypeRow>
            <TypeRow label="Body Large" className="type-body-lg">
              {t("typography.sampleBodyLg")}
            </TypeRow>
            <TypeRow label="Body" className="type-body">
              {t("typography.sampleBody")}
            </TypeRow>
            <TypeRow label="Body Small" className="type-body-sm">
              {t("typography.sampleBodySm")}
            </TypeRow>
            <TypeRow label="Label" className="type-label">
              {t("typography.sampleLabel")}
            </TypeRow>
            <TypeRow label="Caption" className="type-caption">
              {t("typography.sampleCaption")}
            </TypeRow>
          </div>
        </Container>
      </section>

      <section id="buttons" className="border-b border-border bg-surface-subtle py-16 md:py-20">
        <Container>
          <SectionHeading>{t("buttons.heading")}</SectionHeading>
          <div className="mt-10 flex flex-wrap items-center gap-3">
            <Button>{t("buttons.primary")}</Button>
            <Button variant="secondary">{t("buttons.secondary")}</Button>
            <Button variant="outline">{t("buttons.outline")}</Button>
            <Button variant="ghost">{t("buttons.ghost")}</Button>
            <Button variant="destructive">{t("buttons.destructive")}</Button>
            <Button variant="accent">{t("buttons.accent")}</Button>
            <Button disabled>{t("buttons.disabled")}</Button>
            <Button loading>{t("buttons.loading")}</Button>
          </div>
          <div className="mt-6 flex flex-wrap items-center gap-3">
            <Button size="sm">{t("buttons.primary")}</Button>
            <Button size="md">{t("buttons.primary")}</Button>
            <Button size="lg">{t("buttons.primary")}</Button>
          </div>
        </Container>
      </section>

      <section id="badges" className="border-b border-border py-16 md:py-20">
        <Container>
          <SectionHeading>{t("badges.heading")}</SectionHeading>
          <div className="mt-8 flex flex-wrap gap-2">
            <Badge>{t("badges.default")}</Badge>
            <Badge variant="secondary">{t("badges.secondary")}</Badge>
            <Badge variant="accent">{t("badges.accent")}</Badge>
            <Badge variant="success">{t("badges.success")}</Badge>
            <Badge variant="warning">{t("badges.warning")}</Badge>
            <Badge variant="destructive">{t("badges.destructive")}</Badge>
          </div>
          <div className="mt-12">
            <h3 className="type-h3">{t("icons.heading")}</h3>
            <p className="type-body-sm mt-2 max-w-xl text-muted-foreground">
              {t("icons.body")}
            </p>
            <div className="mt-6 flex gap-6 text-foreground">
              <Search aria-hidden="true" className="h-5 w-5" />
              <ShoppingBag aria-hidden="true" className="h-5 w-5" />
              <User aria-hidden="true" className="h-5 w-5" />
              <ChevronRight aria-hidden="true" className="h-5 w-5" />
            </div>
          </div>
        </Container>
      </section>

      <section id="forms" className="border-b border-border bg-surface-subtle py-16 md:py-20">
        <Container>
          <SectionHeading>{t("forms.heading")}</SectionHeading>
          <div className="mt-10 grid gap-8 md:grid-cols-2">
            <Input
              label={t("forms.nameLabel")}
              placeholder={t("forms.namePlaceholder")}
              helperText={t("forms.nameHelper")}
            />
            <Input
              label={t("forms.nameDisabled")}
              defaultValue="DELIVERSO"
              disabled
            />
            <Input
              label={t("forms.messageLabel")}
              defaultValue=""
              error={t("forms.invalidError")}
              data-demo-focus="true"
              className="ring-2 ring-focus-ring ring-offset-2 ring-offset-background"
            />
            <Select
              label={t("forms.selectLabel")}
              options={[
                { value: "standard", label: t("forms.selectOptionStandard") },
                { value: "dedicated", label: t("forms.selectOptionDedicated") },
              ]}
            />
            <div className="md:col-span-2">
              <Textarea
                label={t("forms.dedicationLabel")}
                placeholder={t("forms.dedicationPlaceholder")}
              />
            </div>
          </div>
        </Container>
      </section>

      <section id="cards" className="border-b border-border py-16 md:py-20">
        <Container>
          <SectionHeading>{t("cards.heading")}</SectionHeading>
          <div className="mt-10 max-w-md">
            <Card>
              <CardHeader>
                <CardTitle>{t("cards.title")}</CardTitle>
                <CardDescription>{t("cards.description")}</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="type-body-sm text-muted-foreground">
                  {t("cards.body")}
                </p>
              </CardContent>
              <CardFooter>
                <Button size="sm">{t("buttons.primary")}</Button>
                <Button size="sm" variant="ghost">
                  {t("buttons.ghost")}
                </Button>
              </CardFooter>
            </Card>
          </div>
        </Container>
      </section>

      <section id="product" className="border-b border-border bg-surface-subtle py-16 md:py-20">
        <Container>
          <div className="flex items-end justify-between gap-4">
            <SectionHeading>{t("product.heading")}</SectionHeading>
            <Badge variant="secondary">{t("product.demoLabel")}</Badge>
          </div>
          <p className="type-caption mt-2 text-muted-foreground">{demoSource}</p>
          <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            <ProductCard
              name={t("product.name")}
              description={t("product.description")}
              price={demoProductPrice}
              locale={locale}
              ctaLabel={t("product.cta")}
              badge={{ label: t("product.badge"), variant: "accent" }}
            />
          </div>
        </Container>
      </section>

      <section id="featured" className="border-b border-border py-16 md:py-20">
        <Container>
          <SectionHeading>{t("featured.heading")}</SectionHeading>
          <div className="mt-10">
            <FeaturedCard
              kicker={t("featured.kicker")}
              title={t("featured.title")}
              description={t("featured.description")}
              ctaLabel={t("featured.cta")}
            />
          </div>
        </Container>
      </section>

      <section id="dark" className="surface-dark py-16 md:py-20">
        <Container>
          <SectionHeading>{t("dark.heading")}</SectionHeading>
          <p className="type-body mt-4 max-w-2xl text-muted-foreground">
            {t("dark.body")}
          </p>
          <div className="relative mt-10 max-w-xl overflow-hidden rounded-xl bg-surface-elevated p-8">
            <OrbitDecoration className="absolute -right-6 -top-4 h-28 w-48 opacity-80" />
            <StarAccent className="h-3 w-3" />
            <p className="type-h2 mt-4">{brandConfig.name}</p>
            <p className="type-body mt-3 text-muted-foreground">
              {brandT("officialTagline")}
            </p>
            <div className="mt-6 flex gap-3">
              <Button>{t("buttons.primary")}</Button>
              <Button variant="outline">{t("buttons.outline")}</Button>
            </div>
          </div>
        </Container>
      </section>

      <section id="foundations" className="border-b border-border py-16 md:py-20">
        <Container>
          <SectionHeading>{t("foundations.heading")}</SectionHeading>
          <h3 className="type-h4 mt-10">{t("foundations.spacing")}</h3>
          <div className="mt-4 space-y-2">
            {spacingScale.map((value) => (
              <div key={value} className="flex items-center gap-4">
                <span className="type-caption w-12 text-muted-foreground">{value}</span>
                <div
                  className="h-3 rounded-sm bg-primary"
                  style={{ width: value }}
                />
              </div>
            ))}
          </div>
          <h3 className="type-h4 mt-12">{t("foundations.radius")}</h3>
          <div className="mt-4 flex flex-wrap gap-4">
            <div className="h-16 w-16 rounded-sm border border-border-strong bg-surface-elevated" />
            <div className="h-16 w-16 rounded-md border border-border-strong bg-surface-elevated" />
            <div className="h-16 w-16 rounded-lg border border-border-strong bg-surface-elevated" />
            <div className="h-16 w-16 rounded-xl border border-border-strong bg-surface-elevated" />
            <div className="h-16 w-16 rounded-full border border-border-strong bg-surface-elevated" />
          </div>
          <h3 className="type-h4 mt-12">{t("foundations.shadow")}</h3>
          <div className="mt-4 flex flex-wrap gap-6">
            <div className="h-20 w-32 rounded-lg bg-surface-elevated shadow-sm" />
            <div className="h-20 w-32 rounded-lg bg-surface-elevated shadow-md" />
            <div className="h-20 w-32 rounded-lg bg-surface-elevated shadow-lg" />
          </div>
        </Container>
      </section>

      <section id="motion" className="py-16 md:py-20">
        <Container>
          <SectionHeading>{t("motion.heading")}</SectionHeading>
          <p className="type-body mt-4 max-w-2xl text-muted-foreground">
            {t("motion.body")}
          </p>
          <div className="mt-10 grid max-w-md gap-4">
            <div className="rounded-xl border border-border bg-surface-elevated p-6 shadow-sm transition-[transform,box-shadow] duration-[var(--duration-normal)] ease-[var(--easing-standard)] hover:-translate-y-0.5 hover:shadow-md">
              <p className="type-h4">{t("product.heading")}</p>
              <p className="type-caption mt-2 text-muted-foreground">hover</p>
            </div>
            <Button className="w-fit">{t("buttons.primary")}</Button>
          </div>
        </Container>
      </section>
    </div>
  );
}

function SectionHeading({ children }: { children: string }) {
  return <h2 className="type-h2 text-foreground">{children}</h2>;
}

function TypeRow({
  label,
  className,
  children,
}: {
  label: string;
  className: string;
  children: string;
}) {
  return (
    <div className="grid gap-2 border-b border-border pb-6 md:grid-cols-[9rem_1fr] md:items-baseline">
      <p className="type-caption text-muted-foreground">{label}</p>
      <p className={className}>{children}</p>
    </div>
  );
}
