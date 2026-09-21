import { describe, expect, it } from "vitest";
import { MAX_AVATAR_BYTES } from "@/modules/avatars/domain/constants";
import { buildAvatarObjectPath } from "@/modules/avatars/domain/paths";
import { validateAvatarFile } from "@/modules/avatars/domain/validation";

const jpeg = Uint8Array.from([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10]);
const png = Uint8Array.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
const webp = Uint8Array.from([
  0x52, 0x49, 0x46, 0x46, 0x00, 0x00, 0x00, 0x00, 0x57, 0x45, 0x42, 0x50,
]);
const gif = Uint8Array.from([0x47, 0x49, 0x46, 0x38, 0x39, 0x61]);

describe("avatar upload validation", () => {
  it("accepts JPEG, PNG and WEBP by magic bytes", () => {
    expect(validateAvatarFile({ sizeBytes: jpeg.length, declaredMime: "image/jpeg", bytes: jpeg })).toEqual({
      ok: true,
      mimeType: "image/jpeg",
      sizeBytes: jpeg.length,
    });
    expect(validateAvatarFile({ sizeBytes: png.length, declaredMime: "image/png", bytes: png })).toMatchObject({
      ok: true,
      mimeType: "image/png",
    });
    expect(validateAvatarFile({ sizeBytes: webp.length, declaredMime: "image/webp", bytes: webp })).toMatchObject({
      ok: true,
      mimeType: "image/webp",
    });
  });

  it("rejects invalid MIME even when the extension looks fine", () => {
    expect(validateAvatarFile({ sizeBytes: gif.length, declaredMime: "image/gif", bytes: gif })).toEqual({
      ok: false,
      code: "mime",
    });
    expect(
      validateAvatarFile({
        sizeBytes: gif.length,
        declaredMime: "image/jpeg",
        bytes: gif,
      }),
    ).toEqual({ ok: false, code: "mime" });
  });

  it("rejects files larger than 2 MB", () => {
    expect(
      validateAvatarFile({
        sizeBytes: MAX_AVATAR_BYTES + 1,
        declaredMime: "image/jpeg",
        bytes: jpeg,
      }),
    ).toEqual({ ok: false, code: "too_large" });
  });

  it("builds owner-scoped object paths without storing binaries", () => {
    expect(
      buildAvatarObjectPath({
        kind: "customers",
        ownerId: "cust-1",
        mimeType: "image/jpeg",
      }),
    ).toBe("customers/cust-1/avatar.jpg");
    expect(
      buildAvatarObjectPath({
        kind: "admins",
        ownerId: "admin-1",
        mimeType: "image/png",
      }),
    ).toBe("admins/admin-1/avatar.png");
  });
});
