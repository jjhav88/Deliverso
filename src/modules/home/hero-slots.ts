import type { HeroShowcaseItem, HeroShowcasePosition } from "@/modules/home/types/home-content";

export const HERO_SLOT_COUNT = 3;

export const heroSlotPositions = [
  "left",
  "right",
  "rightSecondary",
] as const satisfies readonly HeroShowcasePosition[];

export type HeroMediaSlot = {
  mediaAssetId: string | null;
  publicUrl?: string;
  alt?: string;
};

/** sortOrder 0 = left, 1 = right primary, 2 = right secondary fan. */
export function sortOrderToHeroPosition(sortOrder: number): HeroShowcasePosition {
  if (sortOrder === 0) return "left";
  if (sortOrder === 1) return "right";
  return "rightSecondary";
}

export function heroPositionToSortOrder(position: HeroShowcasePosition): number {
  if (position === "left") return 0;
  if (position === "right") return 1;
  return 2;
}

export function capHeroSlots<T>(slots: readonly T[], max = HERO_SLOT_COUNT): T[] {
  return slots.slice(0, Math.max(0, max));
}

function toItem(
  slot: HeroMediaSlot,
  position: HeroShowcasePosition,
  fallbackId: string,
): HeroShowcaseItem & { mediaAssetId?: string } {
  return {
    id: slot.mediaAssetId ?? fallbackId,
    mediaAssetId: slot.mediaAssetId ?? undefined,
    imageSrc: slot.publicUrl,
    imageAlt: slot.alt ?? "",
    position,
  };
}

/**
 * 0 images: empty array (caller uses editorial placeholders).
 * 1 image: large photo on the right.
 * 2 images: left + right primary.
 * 3 images: left + right primary + right secondary fan.
 */
export function layoutHeroFan(
  slots: readonly HeroMediaSlot[],
): Array<HeroShowcaseItem & { mediaAssetId?: string }> {
  const filled = capHeroSlots(slots)
    .map((slot, index) => ({ slot, index }))
    .filter((entry) => Boolean(entry.slot.mediaAssetId && entry.slot.publicUrl));

  if (filled.length === 0) {
    return [];
  }

  if (filled.length === 1) {
    return [toItem(filled[0].slot, "right", "hero-right")];
  }

  if (filled.length === 2) {
    return [
      toItem(filled[0].slot, "left", "hero-left"),
      toItem(filled[1].slot, "right", "hero-right"),
    ];
  }

  return [
    toItem(filled[0].slot, "left", "hero-left"),
    toItem(filled[1].slot, "right", "hero-right"),
    toItem(filled[2].slot, "rightSecondary", "hero-right-secondary"),
  ];
}
