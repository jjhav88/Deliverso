import type { FeaturedProductTone } from "@/modules/home/types/home-content";
import { cn } from "@/lib/cn";

const toneClasses: Record<FeaturedProductTone, string> = {
  cocoa:
    "bg-[radial-gradient(80%_60%_at_50%_18%,color-mix(in_srgb,#fff_40%,var(--deliverso-cream)),color-mix(in_srgb,var(--deliverso-navy)_18%,var(--deliverso-cream))_74%)]",
  fruit:
    "bg-[radial-gradient(80%_60%_at_50%_18%,color-mix(in_srgb,#fff_42%,var(--deliverso-cream)),color-mix(in_srgb,var(--deliverso-pink)_20%,var(--deliverso-cream))_74%)]",
  gold:
    "bg-[radial-gradient(80%_60%_at_50%_18%,color-mix(in_srgb,#fff_44%,var(--deliverso-cream)),color-mix(in_srgb,var(--deliverso-lilac)_16%,var(--deliverso-cream))_74%)]",
};

type FeaturedProductMediaProps = {
  tone?: FeaturedProductTone;
};

export function FeaturedProductMedia({
  tone = "cocoa",
}: FeaturedProductMediaProps) {
  return (
    <div aria-hidden="true" className={cn("absolute inset-0", toneClasses[tone])}>
      <span className="absolute inset-x-[18%] bottom-[14%] h-[16%] rounded-full bg-[color-mix(in_srgb,#fff_68%,var(--deliverso-cream))] opacity-90" />
    </div>
  );
}
