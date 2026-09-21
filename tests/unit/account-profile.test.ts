import { describe, expect, it } from "vitest";
import {
  applyProfileFields,
  isOwnedAvatarPath,
  profileAvatarInitial,
  profileDisplayName,
  resolveAdminHeaderSession,
  resolveAvatarPresentation,
  resolveCustomerHeaderSession,
} from "@/modules/account/domain/presentation";
import { customerProfileSchema } from "@/modules/customer-auth/validation";
import { adminProfileSchema } from "@/modules/auth/validation/profile-schema";

describe("customer header session", () => {
  it("keeps the anonymous header as an icon-only sign-in control", () => {
    expect(resolveCustomerHeaderSession({ signedIn: false })).toEqual({
      signedIn: false,
      caption: null,
      avatarMode: "icon",
      showLogout: false,
      profileHref: null,
    });
  });

  it("shows the display name and logout when authenticated", () => {
    const session = resolveCustomerHeaderSession({
      signedIn: true,
      displayName: "Ana Pérez",
      email: "ana@deliverso.com",
    });
    expect(session.caption).toBe("Ana Pérez");
    expect(session.showLogout).toBe(true);
    expect(session.profileHref).toBe("/cuenta");
  });

  it("falls back to email when displayName is empty", () => {
    expect(
      resolveCustomerHeaderSession({
        signedIn: true,
        displayName: "   ",
        email: "ana@deliverso.com",
      }).caption,
    ).toBe("ana@deliverso.com");
  });

  it("uses the avatar image, then the initial, then the user icon", () => {
    expect(
      resolveAvatarPresentation({ avatarUrl: "/signed", displayName: "Ana" }),
    ).toBe("image");
    expect(resolveAvatarPresentation({ displayName: "Ana" })).toBe("initial");
    expect(profileAvatarInitial("Ana")).toBe("A");
    expect(resolveAvatarPresentation({ displayName: null })).toBe("icon");
  });
});

describe("admin header session", () => {
  it("prefers displayName and keeps a profile plus logout path", () => {
    const session = resolveAdminHeaderSession({
      displayName: "Julio",
      email: "admin@deliverso.com",
    });
    expect(session.caption).toBe("Julio");
    expect(session.profileHref).toBe("/admin/profile");
    expect(session.showLogout).toBe(true);
  });

  it("uses email until the admin configures a displayName", () => {
    expect(
      resolveAdminHeaderSession({
        displayName: null,
        email: "admin@deliverso.com",
      }).caption,
    ).toBe("admin@deliverso.com");
  });
});

describe("profile fields", () => {
  it("updates displayName and customer phone without touching auth ids", () => {
    expect(
      applyProfileFields({
        displayName: "  Ana  ",
        phone: "  5512345678  ",
      }),
    ).toEqual({
      displayName: "Ana",
      phone: "5512345678",
      avatarPath: null,
    });
    expect(customerProfileSchema.safeParse({ displayName: "Ana", phone: "55-1234-5678" }).success).toBe(
      true,
    );
    expect(adminProfileSchema.safeParse({ displayName: "Julio" }).success).toBe(true);
  });

  it("stores only an object path and can clear it", () => {
    expect(
      applyProfileFields({
        displayName: "Ana",
        avatarPath: "customers/c1/avatar.jpg",
      }).avatarPath,
    ).toBe("customers/c1/avatar.jpg");
    expect(applyProfileFields({ displayName: "Ana", avatarPath: null }).avatarPath).toBeNull();
  });

  it("rejects avatar paths that do not belong to the owner", () => {
    expect(
      isOwnedAvatarPath({
        kind: "customers",
        ownerId: "c1",
        objectPath: "customers/c1/avatar.jpg",
      }),
    ).toBe(true);
    expect(
      isOwnedAvatarPath({
        kind: "customers",
        ownerId: "c1",
        objectPath: "customers/c2/avatar.jpg",
      }),
    ).toBe(false);
    expect(
      isOwnedAvatarPath({
        kind: "admins",
        ownerId: "a1",
        objectPath: "customers/a1/avatar.jpg",
      }),
    ).toBe(false);
  });
});

describe("display name helper", () => {
  it("never invents a name when both values are empty-safe", () => {
    expect(profileDisplayName({ displayName: null, email: "x@deliverso.com" })).toBe("x@deliverso.com");
  });
});
