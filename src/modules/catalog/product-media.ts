export type ProductMediaDraft = {
  mediaAssetId: string;
  role: "PRIMARY" | "GALLERY";
  sortOrder: number;
};

export function normalizeProductMedia(items: readonly ProductMediaDraft[]): ProductMediaDraft[] {
  const primary = items.filter((item) => item.role === "PRIMARY");
  const gallery = items.filter((item) => item.role === "GALLERY");

  if (primary.length > 1) {
    throw new Error("Solo puede haber una imagen principal.");
  }

  return [
    ...primary.map((item) => ({ ...item, sortOrder: 0 })),
    ...gallery.map((item, index) => ({ ...item, sortOrder: index + 1 })),
  ];
}

export function hasSinglePrimary(items: readonly ProductMediaDraft[]): boolean {
  return items.filter((item) => item.role === "PRIMARY").length === 1;
}
