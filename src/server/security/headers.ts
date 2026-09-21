/**
 * CSP compatible with Stripe Payment Element, Supabase Auth/Storage
 * and Next.js inline styles. No global * for script/connect.
 *
 * Allowed third parties:
 * - js.stripe.com, hooks.stripe.com, api.stripe.com, m.stripe.network
 * - *.supabase.co (Auth, Storage, Realtime)
 */
export function contentSecurityPolicy(nodeEnv = process.env.NODE_ENV): string {
  const scriptSrc =
    nodeEnv === "production"
      ? "script-src 'self' 'unsafe-inline' https://js.stripe.com"
      : "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://js.stripe.com";

  return [
    "default-src 'self'",
    scriptSrc,
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: blob: https://*.supabase.co",
    "font-src 'self' data:",
    "connect-src 'self' https://api.stripe.com https://m.stripe.network https://r.stripe.com https://*.supabase.co wss://*.supabase.co",
    "frame-src https://js.stripe.com https://hooks.stripe.com",
    "frame-ancestors 'none'",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
  ].join("; ");
}

export function securityHeaders(): Array<{ key: string; value: string }> {
  return [
    { key: "Content-Security-Policy", value: contentSecurityPolicy() },
    { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
    { key: "X-Content-Type-Options", value: "nosniff" },
    { key: "X-Frame-Options", value: "DENY" },
    { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), payment=(self)" },
  ];
}
