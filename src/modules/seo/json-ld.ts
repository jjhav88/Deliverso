import { brandConfig } from "@/config/brand";
import { productionPublicOrigin } from "@/modules/seo/env";

export function buildOrganizationJsonLd(input: {
  url?: string;
  logoUrl?: string;
  email?: string | null;
  telephone?: string | null;
  sameAs?: string[];
}): Record<string, unknown> {
  const jsonLd: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: brandConfig.name,
    url: input.url ?? productionPublicOrigin,
  };
  if (input.logoUrl) {
    jsonLd.logo = input.logoUrl;
  }
  if (input.sameAs && input.sameAs.length > 0) {
    jsonLd.sameAs = input.sameAs;
  }
  if (input.email || input.telephone) {
    jsonLd.contactPoint = {
      "@type": "ContactPoint",
      contactType: "customer service",
      ...(input.email ? { email: input.email } : {}),
      ...(input.telephone ? { telephone: input.telephone } : {}),
      areaServed: "MX",
      availableLanguage: ["es", "en"],
    };
  }
  return jsonLd;
}

export function buildWebSiteJsonLd(input: { url?: string }): Record<string, unknown> {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: brandConfig.name,
    url: input.url ?? productionPublicOrigin,
  };
}
