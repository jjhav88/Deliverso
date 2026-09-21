import { z } from "zod";

export const HOME_HEADLINE_MAX = 120;
export const HOME_DESCRIPTION_MAX = 500;
export const HOME_TITLE_MAX = 160;
export const HOME_BODY_MAX = 800;
export const HOME_EYEBROW_MAX = 80;

const cmsCopy = (max: number) =>
  z
    .string()
    .max(max)
    .optional()
    .transform((value) => (value ?? "").trim());

export const homeLocaleCopySchema = z.object({
  heroEyebrow: cmsCopy(HOME_EYEBROW_MAX),
  heroHeadline: cmsCopy(HOME_HEADLINE_MAX),
  heroDescription: cmsCopy(HOME_DESCRIPTION_MAX),
  introductionTitle: cmsCopy(HOME_TITLE_MAX),
  introductionBody: cmsCopy(HOME_BODY_MAX),
  featuredEyebrow: cmsCopy(HOME_EYEBROW_MAX),
  featuredTitle: cmsCopy(HOME_TITLE_MAX),
  universesTitle: cmsCopy(HOME_TITLE_MAX),
  universesDescription: cmsCopy(HOME_DESCRIPTION_MAX),
  personalizationTitle: cmsCopy(HOME_TITLE_MAX),
  personalizationDescription: cmsCopy(HOME_DESCRIPTION_MAX),
  finalCtaTitle: cmsCopy(HOME_TITLE_MAX),
  finalCtaDescription: cmsCopy(HOME_DESCRIPTION_MAX),
});

export const homeVisibilitySchema = z.object({
  showIntroduction: z.boolean(),
  showFeaturedProducts: z.boolean(),
  showUniverses: z.boolean(),
  showPersonalization: z.boolean(),
  showValueProposition: z.boolean(),
  showFinalCta: z.boolean(),
});

const uuidOrEmpty = z
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
    "Media inválida.",
  );

export const homeHeroSaveSchema = z.object({
  isActive: z.boolean(),
  tone: z.enum(["AUTO", "LIGHT", "DARK"]),
  leftMediaAssetId: uuidOrEmpty,
  centerMediaAssetId: uuidOrEmpty,
  rightMediaAssetId: uuidOrEmpty,
});

export const homeCmsSaveSchema = z.object({
  visibility: homeVisibilitySchema,
  hero: homeHeroSaveSchema,
  es: homeLocaleCopySchema,
  en: homeLocaleCopySchema,
});

export type HomeCmsSaveInput = z.infer<typeof homeCmsSaveSchema>;
