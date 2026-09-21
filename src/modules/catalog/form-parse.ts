function booleanFromForm(value: FormDataEntryValue | null): boolean {
  return value === "on" || value === "true";
}

function text(formData: FormData, key: string): string {
  return String(formData.get(key) ?? "");
}

export function parseTaxonomyForm(formData: FormData) {
  return {
    id: text(formData, "id") || undefined,
    isActive: booleanFromForm(formData.get("isActive")),
    sortOrder: text(formData, "sortOrder") || "0",
    featuredMediaAssetId: text(formData, "featuredMediaAssetId"),
    businessLineId: text(formData, "businessLineId"),
    es: {
      name: text(formData, "es.name"),
      slug: text(formData, "es.slug"),
      description: text(formData, "es.description"),
    },
    en: {
      name: text(formData, "en.name"),
      slug: text(formData, "en.slug"),
      description: text(formData, "en.description"),
    },
  };
}

export function parseProductForm(formData: FormData) {
  return {
    id: text(formData, "id") || undefined,
    type: text(formData, "type"),
    businessLineId: text(formData, "businessLineId"),
    leadTimeValue: text(formData, "leadTimeValue"),
    leadTimeUnit: text(formData, "leadTimeUnit") || "hours",
    priceInput: text(formData, "priceInput"),
    quotePrice: booleanFromForm(formData.get("quotePrice")),
    sku: text(formData, "sku"),
    categoryIds: formData.getAll("categoryIds").map(String).filter(Boolean),
    universeIds: formData.getAll("universeIds").map(String).filter(Boolean),
    primaryMediaAssetId: text(formData, "primaryMediaAssetId"),
    galleryMediaAssetIds: formData
      .getAll("galleryMediaAssetIds")
      .map(String)
      .filter(Boolean),
    es: {
      name: text(formData, "es.name"),
      slug: text(formData, "es.slug"),
      shortDescription: text(formData, "es.shortDescription"),
      description: text(formData, "es.description"),
      seoTitle: text(formData, "es.seoTitle"),
      seoDescription: text(formData, "es.seoDescription"),
    },
    en: {
      name: text(formData, "en.name"),
      slug: text(formData, "en.slug"),
      shortDescription: text(formData, "en.shortDescription"),
      description: text(formData, "en.description"),
      seoTitle: text(formData, "en.seoTitle"),
      seoDescription: text(formData, "en.seoDescription"),
    },
  };
}

export { booleanFromForm };
