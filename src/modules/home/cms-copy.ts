export const homeCopyKeys = [
  "heroEyebrow",
  "heroHeadline",
  "heroDescription",
  "introductionTitle",
  "introductionBody",
  "featuredEyebrow",
  "featuredTitle",
  "universesTitle",
  "universesDescription",
  "personalizationTitle",
  "personalizationDescription",
  "finalCtaTitle",
  "finalCtaDescription",
] as const;

export type HomeCopyKey = (typeof homeCopyKeys)[number];

export type HomeCopyRecord = Record<HomeCopyKey, string>;

export type HomeCopyExisting = Partial<Record<HomeCopyKey, string | null>>;

/**
 * null/undefined = never configured in Admin → i18n fallback.
 * "" = admin intentionally cleared the field → render nothing.
 * any other string = use the configured value.
 */
export function resolveCmsCopy(
  configured: string | null | undefined,
  fallback: string,
): string {
  if (configured === null || configured === undefined) {
    return fallback;
  }

  return configured;
}

/**
 * First save of an untouched blank field stays null (fallback).
 * Clearing a previously saved value persists "" (intentional empty).
 */
export function persistCmsField(
  incoming: string,
  existing: string | null | undefined,
): string | null {
  if (incoming === "") {
    return existing == null ? null : "";
  }

  return incoming;
}

export function persistHomeCopy(
  incoming: HomeCopyRecord,
  existing: HomeCopyExisting | null | undefined,
): Record<HomeCopyKey, string | null> {
  return Object.fromEntries(
    homeCopyKeys.map((key) => [key, persistCmsField(incoming[key], existing?.[key])]),
  ) as Record<HomeCopyKey, string | null>;
}
