import type { MetadataRoute } from "next";
import { headers } from "next/headers";
import {
  canonicalOrigin,
  isSeoIndexableRequest,
  productionPublicOrigin,
} from "@/modules/seo/env";
import { buildRobotsDocument } from "@/modules/seo/robots-document";

export const dynamic = "force-dynamic";

export default async function robots(): Promise<MetadataRoute.Robots> {
  const host = (await headers()).get("host");
  const indexable = isSeoIndexableRequest(host);
  const origin = indexable ? productionPublicOrigin : canonicalOrigin();
  return buildRobotsDocument({
    indexable,
    sitemapUrl: indexable ? `${origin}/sitemap.xml` : undefined,
  });
}
