import type { Metadata } from "next";
import { brandPageTitle, buildCanonicalUrl } from "@/modules/seo/canonical";

export function legalPageMetadata(input: {
  title: string;
  pathname?: string;
}): Metadata {
  const canonical = input.pathname
    ? (buildCanonicalUrl(input.pathname) ?? input.pathname)
    : undefined;
  return {
    title: brandPageTitle(input.title),
    robots: { index: false, follow: true },
    ...(canonical ? { alternates: { canonical } } : {}),
  };
}
