import Image from "next/image";
import { Link } from "@/i18n/navigation";
import { cn } from "@/lib/cn";
import { HeroProductMedia } from "@/modules/home/components/hero-product-media";
import type { HeroShowcaseItem as HeroShowcaseItemContent } from "@/modules/home/types/home-content";

type HeroShowcaseItemProps = {
  item: HeroShowcaseItemContent;
  priority?: boolean;
};

export function HeroShowcaseItem({
  item,
  priority = false,
}: HeroShowcaseItemProps) {
  const frame = (
    <span className="home-product-frame">
      {item.imageSrc ? (
        <Image
          src={item.imageSrc}
          alt={item.imageAlt}
          fill
          priority={priority}
          sizes="(min-width: 1024px) 22vw, 46vw"
          className="object-contain"
          style={
            item.objectPosition
              ? { objectPosition: item.objectPosition }
              : undefined
          }
        />
      ) : (
        <HeroProductMedia position={item.position} />
      )}
    </span>
  );

  return (
    <div
      className={cn("home-showcase-item", `home-showcase-item-${item.position}`)}
    >
      {item.productHref ? (
        <Link href={item.productHref} className="home-showcase-lift">
          {frame}
        </Link>
      ) : (
        frame
      )}
    </div>
  );
}
