import { z } from "zod";
import { leadTimeUnits } from "@/modules/catalog/lead-time";
import { isSafeSlug } from "@/modules/catalog/slug";
import { productStatuses, productTypes } from "@/modules/catalog/domain";

const uuid = z
  .string()
  .trim()
  .refine(
    (value) =>
      /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
        value,
      ),
    "Identificador inválido.",
  );

const optionalUuid = z
  .string()
  .trim()
  .optional()
  .transform((value) => (value ? value : null))
  .refine(
    (value) =>
      value === null ||
      /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
        value,
      ),
    "Identificador inválido.",
  );

const optionalText = (max: number) =>
  z
    .string()
    .max(max)
    .optional()
    .transform((value) => (value ?? "").trim() || null);

const requiredName = z
  .string()
  .trim()
  .min(1, "El nombre es obligatorio.")
  .max(160);

const slugField = z
  .string()
  .trim()
  .min(1, "El slug es obligatorio.")
  .max(80)
  .refine(isSafeSlug, "Usa solo letras minúsculas, números y guiones.");

export const taxonomyTranslationSchema = z.object({
  name: requiredName,
  slug: slugField,
  description: optionalText(800),
});

export const optionalTranslationSchema = z
  .object({
    name: z.string().trim().max(160),
    slug: z.string().trim().max(80),
    description: optionalText(800),
  })
  .superRefine((value, ctx) => {
    const hasContent = Boolean(
      value.name || value.slug || value.description,
    );
    if (!hasContent) {
      return;
    }

    if (!value.name) {
      ctx.addIssue({
        code: "custom",
        message: "El nombre en inglés es obligatorio si hay traducción.",
        path: ["name"],
      });
    }

    if (!value.slug || !isSafeSlug(value.slug)) {
      ctx.addIssue({
        code: "custom",
        message: "El slug en inglés no es válido.",
        path: ["slug"],
      });
    }
  });

export const businessLineSaveSchema = z.object({
  id: optionalUuid,
  isActive: z.boolean(),
  sortOrder: z.coerce.number().int().min(0).max(9999),
  es: taxonomyTranslationSchema,
  en: optionalTranslationSchema,
});

export const categorySaveSchema = businessLineSaveSchema.extend({
  businessLineId: uuid,
});

export const universeSaveSchema = z.object({
  id: optionalUuid,
  isActive: z.boolean(),
  sortOrder: z.coerce.number().int().min(0).max(9999),
  featuredMediaAssetId: optionalUuid,
  es: taxonomyTranslationSchema,
  en: optionalTranslationSchema,
});

export const productTranslationSchema = z.object({
  name: requiredName,
  slug: slugField,
  shortDescription: optionalText(280),
  description: optionalText(8000),
  seoTitle: optionalText(70),
  seoDescription: optionalText(160),
});

export const optionalProductTranslationSchema = z
  .object({
    name: z.string().trim().max(160),
    slug: z.string().trim().max(80),
    shortDescription: optionalText(280),
    description: optionalText(8000),
    seoTitle: optionalText(70),
    seoDescription: optionalText(160),
  })
  .superRefine((value, ctx) => {
    const hasContent = Boolean(
      value.name ||
        value.slug ||
        value.shortDescription ||
        value.description ||
        value.seoTitle ||
        value.seoDescription,
    );
    if (!hasContent) {
      return;
    }

    if (!value.name) {
      ctx.addIssue({
        code: "custom",
        message: "El nombre en inglés es obligatorio si hay traducción.",
        path: ["name"],
      });
    }

    if (!value.slug || !isSafeSlug(value.slug)) {
      ctx.addIssue({
        code: "custom",
        message: "El slug en inglés no es válido.",
        path: ["slug"],
      });
    }
  });

export const productSaveSchema = z.object({
  id: optionalUuid,
  type: z.enum(productTypes),
  businessLineId: uuid,
  status: z.enum(productStatuses).optional(),
  leadTimeValue: z
    .string()
    .trim()
    .optional()
    .transform((value) => {
      if (!value) {
        return null;
      }
      const parsed = Number(value);
      return Number.isFinite(parsed) ? parsed : Number.NaN;
    })
    .refine((value) => value === null || (!Number.isNaN(value) && value >= 0), {
      message: "El tiempo de preparación no puede ser negativo.",
    }),
  leadTimeUnit: z.enum(leadTimeUnits),
  priceInput: z.string().trim(),
  quotePrice: z.boolean(),
  sku: optionalText(64),
  categoryIds: z.array(uuid).max(40),
  universeIds: z.array(uuid).max(40),
  primaryMediaAssetId: optionalUuid,
  galleryMediaAssetIds: z.array(uuid).max(24),
  es: productTranslationSchema,
  en: optionalProductTranslationSchema,
});

export const productListQuerySchema = z.object({
  q: z.string().trim().max(120).optional().default(""),
  status: z
    .enum(["ALL", "DRAFT", "PUBLISHED", "ARCHIVED"])
    .optional()
    .default("ALL"),
  type: z
    .enum(["ALL", "STANDARD", "CONFIGURABLE", "CUSTOM_QUOTE"])
    .optional()
    .default("ALL"),
  businessLineId: z.string().trim().optional().default(""),
  sort: z.enum(["updated", "name"]).optional().default("updated"),
  page: z.coerce.number().int().min(1).optional().default(1),
});

export const homeFeaturedProductSlotSchema = z.object({
  productId: optionalUuid,
  sortOrder: z.coerce.number().int().min(1).max(3),
  isActive: z.boolean(),
});

export const homeFeaturedUniverseSlotSchema = z.object({
  universeId: optionalUuid,
  sortOrder: z.coerce.number().int().min(1).max(4),
  isActive: z.boolean(),
});

export const homeFeaturedSaveSchema = z.object({
  products: z.array(homeFeaturedProductSlotSchema).max(3),
  universes: z.array(homeFeaturedUniverseSlotSchema).max(4),
});

export type ProductSaveInput = z.infer<typeof productSaveSchema>;
export type BusinessLineSaveInput = z.infer<typeof businessLineSaveSchema>;
export type CategorySaveInput = z.infer<typeof categorySaveSchema>;
export type UniverseSaveInput = z.infer<typeof universeSaveSchema>;
