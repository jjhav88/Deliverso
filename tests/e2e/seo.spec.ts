import { expect, test } from "@playwright/test";

function robotsContent(html: string) {
  const match = html.match(
    /<meta[^>]+name=["']robots["'][^>]+content=["']([^"']+)["']/i,
  ) ?? html.match(
    /<meta[^>]+content=["']([^"']+)["'][^>]+name=["']robots["']/i,
  );
  return match?.[1] ?? "";
}

test.describe("SEO smoke", () => {
  test("home exposes title, description and canonical", async ({ page }) => {
    const response = await page.goto("/");
    expect(response?.ok()).toBeTruthy();
    const html = await page.content();
    await expect(page.locator("h1")).toHaveCount(1);
    expect(await page.title()).toMatch(/DELIVERSO/i);
    expect(html).toMatch(/name="description"/i);
    expect(html).toMatch(/rel="canonical"/i);
    expect(html).toMatch(/"@type":"Organization"/);
    expect(html).toMatch(/"@type":"WebSite"/);
    expect(html).not.toMatch(/LocalBusiness/);
    expect(html).not.toMatch(/AggregateRating/);
  });

  test("product page exposes Product JSON-LD when a published product exists", async ({ page }) => {
    await page.goto("/productos");
    const product = page.locator("main a[href*='/productos/'], main a[href*='/products/']").first();
    if ((await product.count()) === 0) {
      return;
    }
    await Promise.all([
      page.waitForURL(/\/(productos|products)\/[^/?]+/),
      product.click(),
    ]);
    const html = await page.content();
    expect(html).toMatch(/rel="canonical"/i);
    expect(html).toMatch(/"@type":"Product"/);
    expect(html).toMatch(/"@type":"BreadcrumbList"/);
    expect(html).not.toMatch(/"price":"0"/);
    expect(html).not.toMatch(/AggregateRating/);
  });

  test("login has exactly one H1 and stays noindex", async ({ page }) => {
    const response = await page.goto("/cuenta/iniciar-sesion");
    expect(response?.ok()).toBeTruthy();
    await expect(page.locator("h1")).toHaveCount(1);
    expect(robotsContent(await page.content())).toMatch(/noindex/i);
  });

  test("register shares the auth shell with a single H1", async ({ page }) => {
    const response = await page.goto("/cuenta/registro");
    expect(response?.ok()).toBeTruthy();
    await expect(page.locator("h1")).toHaveCount(1);
    expect(robotsContent(await page.content())).toMatch(/noindex/i);
  });

  test("old cheesecake typo slug permanently redirects", async ({ request }) => {
    const response = await request.get("/productos/cheescake-de-zarzamora", {
      maxRedirects: 0,
    });
    expect([301, 308]).toContain(response.status());
    expect(response.headers()["location"] ?? "").toMatch(
      /\/productos\/cheesecake-de-zarzamora\/?$/,
    );
  });

  test("private routes send noindex", async ({ page }) => {
    const cart = await page.goto("/carrito");
    expect(cart?.ok()).toBeTruthy();
    expect(robotsContent(await page.content())).toMatch(/noindex/i);

    const account = await page.goto("/cuenta/iniciar-sesion");
    expect(account?.ok()).toBeTruthy();
    expect(robotsContent(await page.content())).toMatch(/noindex/i);

    const admin = await page.goto("/admin/login");
    expect(admin?.ok()).toBeTruthy();
    expect(robotsContent(await page.content())).toMatch(/noindex/i);
  });

  test("robots.txt is text/plain", async ({ request }) => {
    const response = await request.get("/robots.txt");
    expect(response.status()).toBe(200);
    expect(response.headers()["content-type"] ?? "").toMatch(/text\/plain/);
    const body = await response.text();
    expect(body).toMatch(/User-agent/i);
  });

  test("sitemap.xml is XML", async ({ request }) => {
    const response = await request.get("/sitemap.xml");
    expect(response.status()).toBe(200);
    expect(response.headers()["content-type"] ?? "").toMatch(/xml/);
    const body = await response.text();
    expect(body).toMatch(/<urlset|<sitemapindex|\<\?xml/i);
  });

  test("untranslated product does not advertise EN hreflang", async ({ request }) => {
    const response = await request.get("/productos/cheesecake-de-zarzamora");
    expect(response.status()).toBe(200);
    const link = response.headers()["link"] ?? "";
    expect(link).not.toMatch(/hreflang=["']?en-US/i);
    expect(link).not.toMatch(/\/en\/products\//i);

    const html = await response.text();
    expect(html).toMatch(/rel=["']canonical["'][^>]+href=["'][^"']*\/productos\/cheesecake-de-zarzamora["']|href=["'][^"']*\/productos\/cheesecake-de-zarzamora["'][^>]+rel=["']canonical["']/i);
    expect(html).toMatch(/hreflang=["']es-MX["']/i);
    expect(html).toMatch(/hreflang=["']x-default["']/i);
    expect(html).not.toMatch(/hreflang=["']en-US["']/i);

    const english = await request.get("/en/products/cheesecake-de-zarzamora");
    expect(english.status()).toBe(404);
  });

  test("bilingual static pages keep ES and EN HTML alternates", async ({ page }) => {
    const response = await page.goto("/");
    expect(response?.ok()).toBeTruthy();
    const html = await page.content();
    expect(html).toMatch(/hreflang=["']es-MX["']/i);
    expect(html).toMatch(/hreflang=["']en-US["']/i);
    expect(html).toMatch(/hreflang=["']x-default["']/i);
    expect(html).toMatch(/rel=["']canonical["']/i);
  });
});
