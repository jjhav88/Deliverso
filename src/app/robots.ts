import type { MetadataRoute } from "next";
import { canonicalOrigin, isSeoIndexableEnvironment } from "@/modules/seo/env";
import { buildRobotsDocument } from "@/modules/seo/robots-document";

export const dynamic = "force-dynamic";

export default function robots(): MetadataRoute.Robots {
  const indexable = isSeoIndexableEnvironment();
  const origin = canonicalOrigin();
  return buildRobotsDocument({
    indexable,
    sitemapUrl: indexable && origin ? `${origin}/sitemap.xml` : undefined,
  });
}
