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
