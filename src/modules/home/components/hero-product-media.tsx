import { cn } from "@/lib/cn";
import type { HeroShowcasePosition } from "@/modules/home/types/home-content";

const studioTone: Record<HeroShowcasePosition, string> = {
  left: "home-product-studio-cocoa",
  right: "home-product-studio-berry",
  rightSecondary: "home-product-studio-cream",
};

type HeroProductMediaProps = {
  position: HeroShowcasePosition;
};

/**
 * Premium product slot until Admin assigns a photograph.
 * Reads as plated pastry, not an abstract shape.
 */
export function HeroProductMedia({ position }: HeroProductMediaProps) {
  return (
    <span
      aria-hidden="true"
      className={cn("home-product-studio", studioTone[position])}
    >
      <span className="home-product-studio-glow" />
      <span className="home-product-plate" />
      <span className="home-product-cake">
        <span className="home-product-cake-layer home-product-cake-base" />
        <span className="home-product-cake-layer home-product-cake-mid" />
        <span className="home-product-cake-layer home-product-cake-top" />
        <span className="home-product-cake-crown" />
      </span>
    </span>
  );
}
