import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";
import { permanentSeoRedirects } from "./src/modules/seo/permanent-redirects";
import { securityHeaders } from "./src/server/security/headers";

const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "*.supabase.co",
        pathname: "/storage/v1/object/public/**",
      },
    ],
  },
  async redirects() {
    return [...permanentSeoRedirects];
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: securityHeaders(),
      },
    ];
  },
};

export default withNextIntl(nextConfig);
