import { describe, expect, it } from "vitest";
import { excerptForSeo, isUsefulLocalizedCopy } from "@/modules/seo/content";
import {
  canonicalOrigin,
  isSeoIndexableEnvironment,
  isSeoIndexableRequest,
  productionPublicOrigin,
  seoRobots,
} from "@/modules/seo/env";
import { buildOrganizationJsonLd, buildWebSiteJsonLd } from "@/modules/seo/json-ld";
import {
  CHEESECAKE_ZARZAMORA_NEW_SLUG,
  CHEESECAKE_ZARZAMORA_OLD_SLUG,
  permanentSeoRedirects,
} from "@/modules/seo/permanent-redirects";
import { buildRobotsDocument, isPrivateSeoPath } from "@/modules/seo/robots-document";
import {
  brandPageTitle,
  buildCanonicalUrl,
  catalogLanguages,
  privatePageMetadata,
  publicPageMetadata,
  withXDefault,
} from "@/modules/seo/canonical";
import {
  buildBreadcrumbJsonLd,
  buildProductJsonLd,
} from "@/modules/catalog/public/json-ld";
import { indexableTranslationSlugs } from "@/modules/catalog/public/seo";

const productionEnv = {
  VERCEL_ENV: "production",
  VERCEL_URL: "deliverso-abc.vercel.app",
  VERCEL_PROJECT_PRODUCTION_URL: "www.deliverso.com.mx",
  NEXT_PUBLIC_APP_URL: "https://www.deliverso.com.mx",
} as unknown as NodeJS.ProcessEnv;

describe("SEO environment policy", () => {
  it("indexes only Vercel production with the www canonical origin", () => {
    expect(isSeoIndexableEnvironment(productionEnv)).toBe(true);
    expect(canonicalOrigin(productionEnv)).toBe(productionPublicOrigin);
  });

  it("indexes Vercel production even if PROJECT_PRODUCTION_URL is a vercel.app alias", () => {
    expect(
      isSeoIndexableEnvironment({
        ...productionEnv,
        VERCEL_PROJECT_PRODUCTION_URL: "deliverso.vercel.app",
      }),
    ).toBe(true);
  });

  it("never indexes staging, preview, or localhost", () => {
    expect(
      isSeoIndexableEnvironment({
        ...productionEnv,
        VERCEL_ENV: "preview",
      }),
    ).toBe(false);
    expect(
      isSeoIndexableEnvironment({
        ...productionEnv,
        VERCEL_ENV: "production",
        VERCEL_URL: "deliverso-staging.vercel.app",
      }),
    ).toBe(false);
    expect(
      isSeoIndexableEnvironment({
        NODE_ENV: "development",
        NEXT_PUBLIC_APP_URL: "http://localhost:3010",
      } as unknown as NodeJS.ProcessEnv),
    ).toBe(false);
  });

  it("indexes the www host even if APP_URL is mis-set", () => {
    expect(
      isSeoIndexableRequest("www.deliverso.com.mx", {
        ...productionEnv,
        NEXT_PUBLIC_APP_URL: "https://deliverso-staging.vercel.app",
      }),
    ).toBe(true);
    expect(isSeoIndexableRequest("deliverso-staging.vercel.app", productionEnv)).toBe(false);
    expect(isSeoIndexableRequest("localhost:3010", productionEnv)).toBe(false);
    expect(
      isSeoIndexableRequest("www.deliverso.com.mx", {
        ...productionEnv,
        VERCEL_URL: "deliverso-staging.vercel.app",
      }),
    ).toBe(true);
  });
});

describe("canonical and hreflang helpers", () => {
  it("builds absolute www URLs for ES home and EN home", () => {
    expect(buildCanonicalUrl("/", productionPublicOrigin)).toBe(
      "https://www.deliverso.com.mx/",
    );
    expect(buildCanonicalUrl("/en", productionPublicOrigin)).toBe(
      "https://www.deliverso.com.mx/en",
    );
    expect(buildCanonicalUrl("/productos/cheesecake-de-zarzamora", productionPublicOrigin)).toBe(
      "https://www.deliverso.com.mx/productos/cheesecake-de-zarzamora",
    );
    expect(buildCanonicalUrl("/en/products/cheesecake-de-zarzamora", productionPublicOrigin)).toBe(
      "https://www.deliverso.com.mx/en/products/cheesecake-de-zarzamora",
    );
  });

  it("adds bidirectional language alternates plus x-default to ES", () => {
    const languages = withXDefault({
      "es-MX": buildCanonicalUrl("/", productionPublicOrigin) ?? "",
      "en-US": buildCanonicalUrl("/en", productionPublicOrigin) ?? "",
    });
    expect(languages["es-MX"]).toBe("https://www.deliverso.com.mx/");
    expect(languages["en-US"]).toBe("https://www.deliverso.com.mx/en");
    expect(languages["x-default"]).toBe(languages["es-MX"]);
    expect(languages["es-MX"]).not.toContain("vercel.app");
    expect(languages["en-US"]).not.toContain("staging");
  });

  it("does not duplicate DELIVERSO in titles", () => {
    expect(brandPageTitle("Productos | DELIVERSO")).toBe("Productos");
    expect(brandPageTitle("Cheesecake de Zarzamora")).toBe("Cheesecake de Zarzamora");
  });

  it("keeps x-default aligned with ES even if EN is listed first", () => {
    expect(
      withXDefault({
        "en-US": "https://www.deliverso.com.mx/en/products/cake",
        "es-MX": "https://www.deliverso.com.mx/productos/pastel",
      })["x-default"],
    ).toBe("https://www.deliverso.com.mx/productos/pastel");
  });

  it("maps product and universe language pairs with self, alternate and x-default", () => {
    const product = catalogLanguages(
      [
        { locale: "es-MX", path: "/productos/cheesecake-de-zarzamora" },
        { locale: "en-US", path: "/en/products/blackberry-cheesecake" },
      ],
      productionPublicOrigin,
    );
    expect(product?.["es-MX"]).toBe(
      "https://www.deliverso.com.mx/productos/cheesecake-de-zarzamora",
    );
    expect(product?.["en-US"]).toBe(
      "https://www.deliverso.com.mx/en/products/blackberry-cheesecake",
    );
    expect(product?.["x-default"]).toBe(product?.["es-MX"]);

    const universe = catalogLanguages(
      [
        { locale: "es-MX", path: "/universos/celebraciones" },
        { locale: "en-US", path: "/en/universes/celebrations" },
      ],
      productionPublicOrigin,
    );
    expect(universe?.["x-default"]).toBe(universe?.["es-MX"]);
  });
});

describe("public and private metadata", () => {
  it("emits noindex for private routes", async () => {
    const metadata = await privatePageMetadata({
      title: "Carrito",
      pathname: "/carrito",
      origin: productionPublicOrigin,
    });
    expect(metadata.robots).toEqual({ index: false, follow: false });
    expect(isPrivateSeoPath("/admin")).toBe(true);
    expect(isPrivateSeoPath("/admin/orders")).toBe(true);
    expect(isPrivateSeoPath("/cuenta")).toBe(true);
    expect(isPrivateSeoPath("/en/account/login")).toBe(true);
    expect(isPrivateSeoPath("/carrito")).toBe(true);
    expect(isPrivateSeoPath("/checkout")).toBe(true);
    expect(isPrivateSeoPath("/pago/DEL-1")).toBe(true);
    expect(isPrivateSeoPath("/cotizaciones")).toBe(true);
    expect(isPrivateSeoPath("/productos")).toBe(false);
  });

  it("builds product-like public metadata with OG url equal to canonical", async () => {
    const metadata = await publicPageMetadata({
      title: "Cheesecake de Zarzamora",
      description: "Crema y fruta.",
      pathname: "/productos/cheesecake-de-zarzamora",
      locale: "es-MX",
      languages: withXDefault({
        "es-MX": "https://www.deliverso.com.mx/productos/cheesecake-de-zarzamora",
        "en-US": "https://www.deliverso.com.mx/en/products/blackberry-cheesecake",
      }),
      images: [{ url: "https://cdn.example/cheesecake.jpg", alt: "Cheesecake de Zarzamora" }],
      origin: productionPublicOrigin,
    });

    expect(metadata.alternates?.canonical).toBe(
      "https://www.deliverso.com.mx/productos/cheesecake-de-zarzamora",
    );
    expect(metadata.openGraph?.url).toBe(metadata.alternates?.canonical);
    expect(metadata.openGraph?.siteName).toBe("DELIVERSO");
    expect(metadata.twitter).toMatchObject({ card: "summary_large_image" });
  });
});

describe("robots document", () => {
  it("allows crawl and lists the production sitemap in production", () => {
    const document = buildRobotsDocument({
      indexable: true,
      sitemapUrl: "https://www.deliverso.com.mx/sitemap.xml",
    });
    expect(document.sitemap).toBe("https://www.deliverso.com.mx/sitemap.xml");
    expect(document.rules).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          userAgent: "*",
          allow: "/",
        }),
      ]),
    );
  });

  it("disallows all crawlers in staging without a sitemap", () => {
    const document = buildRobotsDocument({ indexable: false });
    expect(document.sitemap).toBeUndefined();
    expect(document.rules).toEqual([{ userAgent: "*", disallow: "/" }]);
  });
});

describe("copy and structured data", () => {
  it("does not cut SEO excerpts mid-word", () => {
    const long = `${"sabor ".repeat(40)}final`;
    const excerpt = excerptForSeo(long, 40);
    expect(excerpt).toBeTruthy();
    expect(excerpt?.endsWith(" ")).toBe(false);
    expect(excerpt?.includes("sabo…")).toBe(false);
  });

  it("treats English name-only copy as not useful", () => {
    expect(
      isUsefulLocalizedCopy({ locale: "es-MX", name: "Cheesecake" }),
    ).toBe(true);
    expect(
      isUsefulLocalizedCopy({ locale: "en-US", name: "Cheesecake" }),
    ).toBe(false);
    expect(
      isUsefulLocalizedCopy({
        locale: "en-US",
        name: "Cheesecake",
        shortDescription: "Cream and fruit.",
      }),
    ).toBe(true);
  });

  it("builds Organization and WebSite without fake local or review data", () => {
    const organization = buildOrganizationJsonLd({
      url: productionPublicOrigin,
      logoUrl: `${productionPublicOrigin}/brand/logos/deliverso-logo-color.png`,
      email: "hola@deliverso.com.mx",
      sameAs: ["https://www.instagram.com/deliverso"],
    });
    expect(organization["@type"]).toBe("Organization");
    expect(organization).not.toHaveProperty("legalName");
    expect(organization).not.toHaveProperty("address");
    expect(organization.sameAs).toEqual(["https://www.instagram.com/deliverso"]);

    const website = buildWebSiteJsonLd({ url: productionPublicOrigin });
    expect(website["@type"]).toBe("WebSite");
    expect(website).not.toHaveProperty("potentialAction");
  });

  it("forces noindex when the environment is not production", () => {
    expect(seoRobots(true)).toEqual({ index: false, follow: false });
  });
});

describe("cheesecake typo slug cleanup", () => {
  it("permanently redirects the old ES slug before render", () => {
    expect(permanentSeoRedirects).toEqual([
      {
        source: `/productos/${CHEESECAKE_ZARZAMORA_OLD_SLUG}`,
        destination: `/productos/${CHEESECAKE_ZARZAMORA_NEW_SLUG}`,
        permanent: true,
      },
    ]);
    expect(permanentSeoRedirects[0]?.destination).not.toContain(
      CHEESECAKE_ZARZAMORA_OLD_SLUG,
    );
  });

  it("keeps the corrected ES slug in sitemap candidates and omits the typo", () => {
    const slugs = indexableTranslationSlugs([
      {
        locale: "es-MX",
        slug: CHEESECAKE_ZARZAMORA_NEW_SLUG,
        name: "Cheesecake de Zarzamora",
        shortDescription: "Cheesecake de Zarzamora",
      },
      {
        locale: "en-US",
        slug: CHEESECAKE_ZARZAMORA_OLD_SLUG,
        name: "Cheesecake",
      },
    ]).map((item) => item.slug);

    expect(slugs).toEqual([CHEESECAKE_ZARZAMORA_NEW_SLUG]);
    expect(slugs).not.toContain(CHEESECAKE_ZARZAMORA_OLD_SLUG);
  });

  it("emits Product and Breadcrumb JSON-LD with the new canonical URL", () => {
    const url = `https://www.deliverso.com.mx/productos/${CHEESECAKE_ZARZAMORA_NEW_SLUG}`;
    const product = buildProductJsonLd({
      name: "Cheesecake de Zarzamora",
      description: "Cheesecake de Zarzamora",
      image: null,
      url,
      type: "STANDARD",
      price: { amountMinor: 10000, currency: "MXN" },
    });
    expect(product.offers).toMatchObject({ url });
    expect(JSON.stringify(product)).not.toContain(CHEESECAKE_ZARZAMORA_OLD_SLUG);

    const breadcrumbs = buildBreadcrumbJsonLd({
      items: [
        { name: "Inicio", url: "https://www.deliverso.com.mx/" },
        { name: "Productos", url: "https://www.deliverso.com.mx/productos" },
        { name: "Cheesecake de Zarzamora", url },
      ],
    });
    const last = (
      breadcrumbs.itemListElement as Array<{ item: string }>
    ).at(-1);
    expect(last?.item).toBe(url);
  });
});
