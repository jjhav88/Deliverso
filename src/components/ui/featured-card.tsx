import type { ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { StarAccent } from "@/components/brand/star-accent";
import { cn } from "@/lib/cn";

type FeaturedCardProps = {
  kicker: string;
  title: string;
  description: string;
  ctaLabel: string;
  className?: string;
  visual?: ReactNode;
};

export function FeaturedCard({
  kicker,
  title,
  description,
  ctaLabel,
  className,
  visual,
}: FeaturedCardProps) {
  return (
    <article
      className={cn(
        "grid overflow-hidden rounded-xl border border-border bg-surface-elevated shadow-sm md:grid-cols-2",
        className,
      )}
    >
      <div className="relative min-h-64 bg-surface-subtle md:min-h-full">
        {visual ?? <FeaturedVisualPlaceholder />}
      </div>
      <div className="flex flex-col justify-center gap-5 px-6 py-8 md:px-10 md:py-12">
        <div className="flex items-center gap-2">
          <StarAccent className="h-3 w-3" />
          <p className="type-label text-muted-foreground">{kicker}</p>
        </div>
        <h3 className="type-h2 text-foreground">{title}</h3>
        <p className="type-body text-muted-foreground">{description}</p>
        <div>
          <Button variant="primary">{ctaLabel}</Button>
        </div>
      </div>
    </article>
  );
}

function FeaturedVisualPlaceholder() {
  return (
    <div
      aria-hidden="true"
      className="absolute inset-0 bg-[linear-gradient(160deg,color-mix(in_srgb,var(--deliverso-navy)_18%,var(--deliverso-cream)),var(--deliverso-cream))]"
    >
      <div className="absolute left-[18%] top-[28%] h-40 w-40 rounded-full border border-deliverso-gold/30" />
      <div className="absolute bottom-[18%] right-[16%] h-24 w-24 rounded-full bg-[color-mix(in_srgb,var(--deliverso-lilac)_28%,transparent)]" />
    </div>
  );
}
