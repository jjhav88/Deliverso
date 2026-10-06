#!/usr/bin/env node
/**
 * Lightweight public SEO audit for a base URL.
 * Usage: node scripts/seo-audit.mjs [baseUrl]
 */

const DEFAULT_BASE = "https://www.deliverso.com.mx";

const targets = [
  "/",
  "/productos",
  "/universos",
  "/nosotros",
  "/contacto",
  "/en",
  "/en/products",
  "/en/universes",
  "/en/about",
  "/en/contact",
  "/carrito",
  "/cuenta/iniciar-sesion",
  "/admin/login",
  "/productos/cheescake-de-zarzamora",
  "/productos/cheesecake-de-zarzamora",
  "/robots.txt",
  "/sitemap.xml",
];

function attr(html, name) {
  const pattern = new RegExp(
    `<meta[^>]+(?:name|property)=["']${name}["'][^>]+content=["']([^"']*)["']|<meta[^>]+content=["']([^"']*)["'][^>]+(?:name|property)=["']${name}["']`,
    "i",
  );
  const match = html.match(pattern);
  return match?.[1] || match?.[2] || null;
}

function all(html, regex) {
  return [...html.matchAll(regex)].map((item) => item[1]);
}

function jsonLd(html) {
  return [...html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/gi)].map(
    (item) => {
      try {
        return JSON.parse(item[1]);
      } catch {
        return { parseError: true, raw: item[1].slice(0, 120) };
      }
    },
  );
}

async function inspect(base, path) {
  const url = new URL(path, base).toString();
  const response = await fetch(url, { redirect: "manual" });
  const contentType = response.headers.get("content-type") ?? "";
  const body = await response.text();
  const isHtml = contentType.includes("text/html");

  return {
    url,
    status: response.status,
    location: response.headers.get("location"),
    xRobotsTag: response.headers.get("x-robots-tag"),
    contentType,
    title: isHtml ? body.match(/<title>([^<]*)<\/title>/i)?.[1] ?? null : null,
    description: isHtml ? attr(body, "description") : null,
    robots: isHtml ? attr(body, "robots") : null,
    canonical: isHtml
      ? body.match(/<link[^>]+rel=["']canonical["'][^>]+href=["']([^"']+)["']/i)?.[1] ??
        body.match(/<link[^>]+href=["']([^"']+)["'][^>]+rel=["']canonical["']/i)?.[1] ??
        null
      : null,
    hreflang: isHtml
      ? all(body, /<link[^>]+hreflang=["']([^"']+)["'][^>]*>/gi)
      : [],
    h1: isHtml ? all(body, /<h1[^>]*>([\s\S]*?)<\/h1>/gi).map((item) => item.replace(/<[^>]+>/g, "").trim()) : [],
    jsonLd: isHtml ? jsonLd(body).map((item) => item["@type"] ?? item.parseError) : [],
    snippet: contentType.includes("xml") || contentType.includes("text/plain")
      ? body.slice(0, 280)
      : undefined,
  };
}

async function main() {
  const base = process.argv[2] || process.env.SEO_AUDIT_BASE || DEFAULT_BASE;
  const results = [];
  for (const path of targets) {
    try {
      results.push(await inspect(base, path));
    } catch (error) {
      results.push({
        url: new URL(path, base).toString(),
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }
  console.log(JSON.stringify({ base, results }, null, 2));
}

main();
