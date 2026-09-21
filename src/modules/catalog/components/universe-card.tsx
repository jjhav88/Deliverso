import Image from "next/image";
import { Link } from "@/i18n/navigation";
import { universeDetailHref } from "@/modules/catalog/public/href";
import type { CatalogUniverseCard } from "@/modules/catalog/public/types";
import "@/modules/catalog/catalog.css";

type UniverseCardProps = {
  universe: CatalogUniverseCard;
  ctaLabel: string;
};

export function UniverseCard({ universe, ctaLabel }: UniverseCardProps) {
  return (
    <article className="catalog-universe-card">
      <Link href={universeDetailHref(universe.slug)} className="group block">
        <div className="catalog-universe-media">
          {universe.image ? (
            <Image
              src={universe.image.src}
              alt={universe.image.alt}
              fill
              sizes="(min-width: 1024px) 33vw, (min-width: 768px) 50vw, 100vw"
              className="object-cover"
            />
          ) : null}
        </div>
        <h2 className="type-h3 mt-1 text-foreground">{universe.name}</h2>
      </Link>
      {universe.description ? (
        <p className="type-body-sm text-muted-foreground">{universe.description}</p>
      ) : null}
      <Link
        href={universeDetailHref(universe.slug)}
        className="type-label self-start tracking-[0.12em] text-secondary"
      >
        {ctaLabel}
      </Link>
    </article>
  );
}
