export function appBaseUrl(publicUrl: string | undefined): string {
  const fallback = process.env.NODE_ENV === "production" ? "" : "http://localhost:3010";
  return (publicUrl?.replace(/\/$/, "") || fallback).replace(/\/$/, "");
}

export function orderAccountPath(locale: string, orderNumber: string): string {
  if (locale === "en-US") {
    return `/en/account/orders/${orderNumber}`;
  }
  return `/cuenta/pedidos/${orderNumber}`;
}

export function orderAccountUrl(input: {
  publicUrl: string | undefined;
  locale: string;
  orderNumber: string;
}): string {
  return `${appBaseUrl(input.publicUrl)}${orderAccountPath(input.locale, input.orderNumber)}`;
}

export function exploreUrl(publicUrl: string | undefined, locale: string): string {
  const base = appBaseUrl(publicUrl);
  return locale === "en-US" ? `${base}/en/products` : `${base}/productos`;
}

export function quoteAccountPath(locale: string, quoteNumber: string): string {
  return locale === "en-US" ? `/en/quotes/${quoteNumber}` : `/cotizaciones/${quoteNumber}`;
}

export function quoteAccountUrl(input: {
  publicUrl: string | undefined;
  locale: string;
  quoteNumber: string;
}): string {
  return `${appBaseUrl(input.publicUrl)}${quoteAccountPath(input.locale, input.quoteNumber)}`;
}

export function emailLogoPolicy(publicLogoUrl: string | undefined): "wordmark" | "https" {
  if (!publicLogoUrl) {
    return "wordmark";
  }
  if (publicLogoUrl.startsWith("https://")) {
    return "https";
  }
  return "wordmark";
}
