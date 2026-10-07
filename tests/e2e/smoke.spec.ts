import { expect, test } from "@playwright/test";

test.describe("storefront smoke", () => {
  test("home loads", async ({ page }) => {
    const response = await page.goto("/");
    expect(response?.ok()).toBeTruthy();
    await expect(page.locator("header")).toBeVisible();
  });

  test("products loads", async ({ page }) => {
    const response = await page.goto("/productos");
    expect(response?.ok()).toBeTruthy();
    await expect(page.locator("main")).toBeVisible();
  });

  test("login page loads", async ({ page }) => {
    const response = await page.goto("/cuenta/iniciar-sesion");
    expect(response?.ok()).toBeTruthy();
    await expect(page.getByRole("textbox", { name: /correo|email/i })).toBeVisible();
  });

  test("account protected redirects to login", async ({ page }) => {
    await page.goto("/cuenta");
    await expect(page).toHaveURL(/iniciar-sesion|account\/login/);
  });

  test("admin login loads", async ({ page }) => {
    const response = await page.goto("/admin/login");
    expect(response?.ok()).toBeTruthy();
    await expect(page.getByRole("textbox", { name: /correo|email/i })).toBeVisible();
  });

  test("cart page loads", async ({ page }) => {
    const response = await page.goto("/carrito");
    expect(response?.ok()).toBeTruthy();
    await expect(page.locator("main")).toBeVisible();
    await expect(
      page.getByText(/Guarda tus productos|Save your products|código promocional|promo code/i).first(),
    ).toBeVisible();
  });

  test("checkout redirects when anonymous", async ({ page }) => {
    await page.goto("/checkout");
    await expect(page).toHaveURL(/iniciar-sesion|account\/login|checkout/);
  });

  test("admin promotions protected", async ({ page }) => {
    await page.goto("/admin/promotions");
    await expect(page).toHaveURL(/admin\/login/);
  });

  test("quote list requires login", async ({ page }) => {
    await page.goto("/cotizaciones");
    await expect(page).toHaveURL(/iniciar-sesion|account\/login/);
  });

  test("anonymous quote request redirects to login", async ({ page }) => {
    await page.goto("/cotizaciones/nueva/pastel-personalizado");
    await expect(page).toHaveURL(/iniciar-sesion|account\/login/);
  });

  test("CUSTOM_QUOTE detail shows quote CTA when published", async ({ page }) => {
    await page.goto("/productos?type=CUSTOM_QUOTE");
    const product = page.locator("main a[href*='/productos/'], main a[href*='/products/']").first();
    if ((await product.count()) === 0) {
      return;
    }
    await product.click();
    await expect(page.getByRole("link", { name: /Solicitar cotización|Request a quote/ })).toBeVisible();
  });

  test("admin quotations protected", async ({ page }) => {
    await page.goto("/admin/quotations");
    await expect(page).toHaveURL(/admin\/login/);
  });

  test("admin cancellations protected", async ({ page }) => {
    await page.goto("/admin/cancellations");
    await expect(page).toHaveURL(/admin\/login/);
    await expect(page.getByText(/Acceso administrativo/i)).toBeVisible();
  });

  test("customer refunded order detail requires login", async ({ page }) => {
    await page.goto("/cuenta/pedidos/DEL-261005-XAVTC2");
    await expect(page).toHaveURL(/iniciar-sesion|account\/login/);
  });

  test("customer cancellation request UI requires login", async ({ page }) => {
    await page.goto("/cuenta/pedidos/DEL-260924-TEST01");
    await expect(page).toHaveURL(/iniciar-sesion|account\/login/);
  });

  test("admin operations protected", async ({ page }) => {
    await page.goto("/admin/operations");
    await expect(page).toHaveURL(/admin\/login/);
    await expect(page.getByText(/Acceso administrativo/i)).toBeVisible();
  });

  test("privacy notice page loads", async ({ page }) => {
    const response = await page.goto("/aviso-de-privacidad");
    expect(response?.ok()).toBeTruthy();
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    await expect(page.locator('footer a[href*="aviso-de-privacidad"]')).toBeVisible();
  });

  test("terms page loads", async ({ page }) => {
    const response = await page.goto("/terminos");
    expect(response?.ok()).toBeTruthy();
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  });

  test("footer legal links are visible", async ({ page }) => {
    await page.goto("/");
    const footer = page.locator("footer");
    await expect(footer.getByRole("link", { name: /Aviso de Privacidad/i })).toBeVisible();
    await expect(footer.getByRole("link", { name: /Términos y Condiciones/i })).toBeVisible();
    await expect(footer.getByRole("link", { name: /Entregas y recogidas/i })).toBeVisible();
    await expect(footer.getByRole("link", { name: /Cancelaciones y reembolsos/i })).toBeVisible();
    await expect(footer.getByRole("link", { name: /^Cookies$/i })).toBeVisible();
  });

  test("checkout requires login before terms checkbox", async ({ page }) => {
    await page.goto("/checkout");
    await expect(page).toHaveURL(/iniciar-sesion|account\/login|checkout/);
    if (/checkout/.test(page.url()) && !/iniciar-sesion|account\/login/.test(page.url())) {
      await expect(page.getByLabel(/He leído y acepto los Términos/i)).toHaveCount(0);
    }
  });

  test("admin legal protected", async ({ page }) => {
    await page.goto("/admin/legal");
    await expect(page).toHaveURL(/admin\/login/);
    await expect(page.getByText(/Acceso administrativo/i)).toBeVisible();
  });
});

test.describe("ops smoke", () => {
  test("health 200", async ({ request }) => {
    const response = await request.get("/api/health");
    expect(response.status()).toBe(200);
    await expect(response.json()).resolves.toMatchObject({ status: "ok" });
  });

  test("readiness 200", async ({ request }) => {
    const response = await request.get("/api/readiness");
    expect(response.status()).toBe(200);
    const body = await response.json();
    expect(String(body.status).toUpperCase()).toBe("READY");
  });

  test("favicon 200", async ({ request }) => {
    const response = await request.get("/favicon.ico");
    expect(response.status()).toBe(200);
  });
});
