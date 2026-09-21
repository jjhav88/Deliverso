import { expect, test } from "@playwright/test";

const email = process.env.E2E_CUSTOMER_EMAIL?.trim();
const password = process.env.E2E_CUSTOMER_PASSWORD?.trim();

test.describe("optional customer login", () => {
  test.skip(!email || !password, "Set E2E_CUSTOMER_EMAIL and E2E_CUSTOMER_PASSWORD to enable.");

  test("customer can sign in with TEST credentials", async ({ page }) => {
    await page.goto("/cuenta/iniciar-sesion");
    await page.getByLabel(/correo|email/i).fill(email as string);
    await page.getByLabel(/contraseña|password/i).fill(password as string);
    await page.getByRole("button", { name: /entrar|iniciar|sign in/i }).click();
    await expect(page).toHaveURL(/\/cuenta|\/account/);
    await expect(page.getByRole("button", { name: /cerrar sesión|sign out/i })).toBeVisible();
  });
});
