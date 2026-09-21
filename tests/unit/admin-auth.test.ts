import { describe, expect, it } from "vitest";
import { adminNavigation, getAdminNavigationItem } from "@/config/admin-navigation";
import { parseGrantAdminInput } from "@/modules/auth/bootstrap/grant-admin-input";
import {
  canAccessAdminPanel,
  hasRequiredRole,
  isAdminRole,
} from "@/modules/auth/domain/admin-role";
import {
  canAdminStatusSignIn,
  isAdminStatus,
} from "@/modules/auth/domain/admin-status";
import { getSafeAdminPath } from "@/modules/auth/authorization/safe-redirect";
import { adminLoginSchema } from "@/modules/auth/validation/login-schema";

describe("safe admin redirect", () => {
  it("only accepts internal /admin paths", () => {
    expect(getSafeAdminPath("/admin/home")).toBe("/admin/home");
    expect(getSafeAdminPath("/admin")).toBe("/admin");
    expect(getSafeAdminPath("https://malicioso.com")).toBe("/admin");
    expect(getSafeAdminPath("//malicioso.com")).toBe("/admin");
    expect(getSafeAdminPath("/en")).toBe("/admin");
    expect(getSafeAdminPath("\\admin")).toBe("/admin");
  });
});

describe("admin roles and status", () => {
  it("lets ADMIN and SUPER_ADMIN into the panel", () => {
    expect(isAdminRole("ADMIN")).toBe(true);
    expect(isAdminRole("EDITOR")).toBe(false);
    expect(canAccessAdminPanel("ADMIN")).toBe(true);
    expect(canAccessAdminPanel("SUPER_ADMIN")).toBe(true);
    expect(hasRequiredRole("ADMIN", ["SUPER_ADMIN"])).toBe(false);
  });

  it("blocks DISABLED accounts", () => {
    expect(isAdminStatus("ACTIVE")).toBe(true);
    expect(canAdminStatusSignIn("ACTIVE")).toBe(true);
    expect(canAdminStatusSignIn("DISABLED")).toBe(false);
  });
});

describe("admin navigation", () => {
  it("keeps a single source of admin links", () => {
    expect(adminNavigation.map((item) => item.href)).toEqual([
      "/admin",
      "/admin/home",
      "/admin/media",
      "/admin/products",
      "/admin/universes",
      "/admin/orders",
      "/admin/customers",
      "/admin/promotions",
      "/admin/settings",
    ]);
    expect(getAdminNavigationItem("/admin/home").id).toBe("home");
    expect(getAdminNavigationItem("/admin").id).toBe("dashboard");
  });
});

describe("bootstrap args", () => {
  it("validates uuid, email and role without accepting passwords", () => {
    const invalid = parseGrantAdminInput({
      authUserId: "not-a-uuid",
      email: "admin",
      role: "OWNER",
    });
    expect(invalid.ok).toBe(false);

    const valid = parseGrantAdminInput({
      authUserId: "11111111-1111-4111-8111-111111111111",
      email: "ops@deliverso.com",
      role: "SUPER_ADMIN",
    });
    expect(valid.ok).toBe(true);
    if (valid.ok) {
      expect(valid.value).not.toHaveProperty("password");
    }
  });
});

describe("login schema", () => {
  it("requires email and a non-empty password without extra rules", () => {
    expect(
      adminLoginSchema.safeParse({
        email: "ops@deliverso.com",
        password: "any-existing-secret",
      }).success,
    ).toBe(true);
    expect(
      adminLoginSchema.safeParse({
        email: "ops",
        password: "x",
      }).success,
    ).toBe(false);
    expect(
      adminLoginSchema.safeParse({
        email: "ops@deliverso.com",
        password: "",
      }).success,
    ).toBe(false);
  });
});
