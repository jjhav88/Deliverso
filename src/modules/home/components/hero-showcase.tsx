import { HeroShowcaseItem } from "@/modules/home/components/hero-showcase-item";
import type { HeroShowcaseItem as HeroShowcaseItemContent } from "@/modules/home/types/home-content";

type HeroShowcaseProps = {
  items: readonly HeroShowcaseItemContent[];
};

function itemAt(
  items: readonly HeroShowcaseItemContent[],
  position: HeroShowcaseItemContent["position"],
) {
  return items.find((item) => item.position === position);
}

export function HeroShowcase({ items }: HeroShowcaseProps) {
  const left = itemAt(items, "left");
  const right = itemAt(items, "right");
  const rightSecondary = itemAt(items, "rightSecondary");
  const isDecorative = items.every((item) => !item.imageAlt);

  return (
    <div className="home-showcase" aria-hidden={isDecorative || undefined}>
      {left ? (
        <div className="home-showcase-left">
          <HeroShowcaseItem item={left} priority={Boolean(left.imageSrc)} />
        </div>
      ) : null}
      {right || rightSecondary ? (
        <div className="home-showcase-right">
          {rightSecondary ? <HeroShowcaseItem item={rightSecondary} /> : null}
          {right ? (
            <HeroShowcaseItem item={right} priority={Boolean(right.imageSrc)} />
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
