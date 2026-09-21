import type { ReactNode } from "react";
import type { ComponentProps } from "react";
import Image from "next/image";
import { Badge } from "@/components/ui/badge";
import type { BadgeVariant } from "@/components/ui/badge";
import { Button, buttonClassName } from "@/components/ui/button";
import type { AppLocale } from "@/config/i18n";
import { TextLink } from "@/components/ui/text-link";
import { Link } from "@/i18n/navigation";
import type { MoneyAmount } from "@/lib/money";
import { formatMoney } from "@/lib/money";
import { cn } from "@/lib/cn";

type ProductCardVariant = "default" | "editorial";

type ProductCardHref = ComponentProps<typeof Link>["href"];

type ProductCardProps = {
  name: string;
  description?: string;
  price?: MoneyAmount;
  formattedPrice?: string | null;
  priceLabel?: string;
  locale?: AppLocale;
  ctaLabel: string;
  ctaHref?: ProductCardHref;
  badge?: {
    label: string;
    variant?: BadgeVariant;
  };
  imageSrc?: string;
  imageAlt?: string;
  imagePriority?: boolean;
  media?: ReactNode;
  variant?: ProductCardVariant;
  className?: string;
};

export function ProductCard({
  name,
  description,
  price,
  formattedPrice,
  priceLabel,
  locale,
  ctaLabel,
  ctaHref,
  badge,
  imageSrc,
  imageAlt = "",
  imagePriority = false,
  media,
  variant = "default",
  className,
}: ProductCardProps) {
  const resolvedPrice =
    formattedPrice ?? (price && locale ? formatMoney(price, locale) : null);

  if (variant === "editorial") {
    const content = (
      <>
        <div className="relative aspect-[3/4] overflow-hidden rounded-lg bg-surface-subtle">
          <ProductCardMedia
            imageSrc={imageSrc}
            imageAlt={imageAlt}
            media={media}
            fit="cover"
            priority={imagePriority}
          />
          {badge ? (
            <div className="absolute left-3 top-3">
              <Badge variant={badge.variant ?? "accent"}>{badge.label}</Badge>
            </div>
          ) : null}
        </div>
        <h3 className="type-h3 mt-5 text-foreground">{name}</h3>
      </>
    );

    return (
      <article
        className={cn(
          "group flex h-full flex-col",
          "focus-within:outline-none",
          className,
        )}
      >
        {ctaHref ? (
          <Link href={ctaHref} className="block rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring focus-visible:ring-offset-2">
            {content}
          </Link>
        ) : (
          content
        )}
        {description ? (
          <p className="type-body-sm mt-2 text-muted-foreground">{description}</p>
        ) : null}
        {resolvedPrice ? (
          <p className="type-body mt-3 font-medium tabular-nums text-foreground">
            {resolvedPrice}
          </p>
        ) : priceLabel ? (
          <p className="type-body-sm mt-3 text-muted-foreground">{priceLabel}</p>
        ) : null}
        {ctaHref ? (
          <TextLink
            href={ctaHref}
            variant="emphasized"
            className="mt-4 type-label self-start tracking-[0.12em]"
          >
            {ctaLabel}
          </TextLink>
        ) : (
          <Button variant="ghost" size="sm" className="mt-4 self-start px-0">
            {ctaLabel}
          </Button>
        )}
      </article>
    );
  }

  return (
    <article
      className={cn(
        "group flex h-full flex-col overflow-hidden rounded-xl border border-border bg-surface-elevated shadow-sm",
        "transition-[transform,box-shadow] duration-[var(--duration-normal)] ease-[var(--easing-standard)]",
        "hover:-translate-y-0.5 hover:shadow-md",
        "focus-within:ring-2 focus-within:ring-focus-ring focus-within:ring-offset-2 focus-within:ring-offset-background",
        className,
      )}
    >
      <div className="relative aspect-[3/4] overflow-hidden bg-surface-subtle">
        <ProductCardMedia
          imageSrc={imageSrc}
          imageAlt={imageAlt}
          media={media}
          priority={imagePriority}
        />
        {badge ? (
          <div className="absolute left-3 top-3">
            <Badge variant={badge.variant ?? "accent"}>{badge.label}</Badge>
          </div>
        ) : null}
      </div>
      <div className="flex flex-1 flex-col gap-3 px-5 py-5">
        <div className="flex flex-1 flex-col gap-2">
          <h3 className="type-h4 text-foreground">{name}</h3>
          {description ? (
            <p className="type-body-sm text-muted-foreground">{description}</p>
          ) : null}
        </div>
        {resolvedPrice ? (
          <p className="type-body font-medium tabular-nums text-foreground">
            {resolvedPrice}
          </p>
        ) : priceLabel ? (
          <p className="type-body-sm text-muted-foreground">{priceLabel}</p>
        ) : null}
        {ctaHref ? (
          <Link
            href={ctaHref}
            className={buttonClassName({ variant: "outline", size: "sm" })}
          >
            {ctaLabel}
          </Link>
        ) : (
          <Button variant="outline" size="sm">
            {ctaLabel}
          </Button>
        )}
      </div>
    </article>
  );
}

function ProductCardMedia({
  imageSrc,
  imageAlt,
  media,
  fit = "cover",
  priority = false,
}: {
  imageSrc?: string;
  imageAlt: string;
  media?: ReactNode;
  fit?: "cover" | "contain";
  priority?: boolean;
}) {
  if (imageSrc) {
    return (
      <Image
        src={imageSrc}
        alt={imageAlt}
        fill
        priority={priority}
        sizes="(min-width: 1024px) 33vw, (min-width: 768px) 50vw, 100vw"
        className={fit === "contain" ? "object-contain" : "object-cover"}
      />
    );
  }

  if (media) {
    return media;
  }

  return <ProductImagePlaceholder />;
}

function ProductImagePlaceholder() {
  return (
    <div
      aria-hidden="true"
      className="absolute inset-0 bg-[radial-gradient(circle_at_50%_42%,color-mix(in_srgb,var(--deliverso-lilac)_22%,var(--deliverso-cream)),var(--deliverso-cream)_62%)]"
    >
      <div className="absolute inset-x-[18%] inset-y-[22%] rounded-[50%] border border-dashed border-deliverso-gold/40" />
      <div className="absolute left-1/2 top-[46%] h-24 w-16 -translate-x-1/2 rounded-full bg-[color-mix(in_srgb,var(--deliverso-navy)_16%,transparent)]" />
      <div className="absolute left-1/2 top-[38%] h-10 w-10 -translate-x-1/2 rounded-full bg-[color-mix(in_srgb,var(--deliverso-pink)_35%,white)]" />
    </div>
  );
}
