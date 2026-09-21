import { AVATAR_EXTENSIONS, type AllowedAvatarMimeType } from "@/modules/avatars/domain/constants";

export function buildAvatarObjectPath(input: {
  kind: "customers" | "admins";
  ownerId: string;
  mimeType: AllowedAvatarMimeType;
}): string {
  return `${input.kind}/${input.ownerId}/avatar.${AVATAR_EXTENSIONS[input.mimeType]}`;
}
