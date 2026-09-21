"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/modules/auth/authorization/require-admin";
import { adminProfileSchema } from "@/modules/auth/validation/profile-schema";
import { removeOwnedAvatar, replaceOwnedAvatar } from "@/modules/avatars/service";
import { getPrisma } from "@/server/db/prisma";

export type AdminProfileActionState = {
  error: string | null;
  success: string | null;
};

export const emptyAdminProfileActionState: AdminProfileActionState = {
  error: null,
  success: null,
};

function revalidateAdminProfile() {
  revalidatePath("/admin/profile");
  revalidatePath("/admin");
}

export async function updateAdminProfileAction(
  previousState: AdminProfileActionState,
  formData: FormData,
): Promise<AdminProfileActionState> {
  void previousState;
  const admin = await requireAdmin("/admin/profile");
  const parsed = adminProfileSchema.safeParse({
    displayName: formData.get("displayName") ?? "",
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Revisa los campos.", success: null };
  }

  await getPrisma().adminAccount.update({
    where: { id: admin.id },
    data: { displayName: parsed.data.displayName || null },
  });
  revalidateAdminProfile();
  return { error: null, success: "Perfil actualizado." };
}

export async function uploadAdminAvatarAction(
  previousState: AdminProfileActionState,
  formData: FormData,
): Promise<AdminProfileActionState> {
  void previousState;
  const admin = await requireAdmin("/admin/profile");
  const file = formData.get("avatar");
  if (!(file instanceof File)) {
    return { error: "Elige una foto de perfil.", success: null };
  }

  const replaced = await replaceOwnedAvatar({
    kind: "admins",
    ownerId: admin.id,
    file,
  });
  if (!replaced.ok) {
    return { error: replaced.error, success: null };
  }

  await getPrisma().adminAccount.update({
    where: { id: admin.id },
    data: { avatarPath: replaced.objectPath },
  });
  revalidateAdminProfile();
  return { error: null, success: "Foto de perfil actualizada." };
}

export async function removeAdminAvatarAction(
  previousState: AdminProfileActionState,
): Promise<AdminProfileActionState> {
  void previousState;
  const admin = await requireAdmin("/admin/profile");
  await removeOwnedAvatar({ kind: "admins", ownerId: admin.id });
  await getPrisma().adminAccount.update({
    where: { id: admin.id },
    data: { avatarPath: null },
  });
  revalidateAdminProfile();
  return { error: null, success: "Foto de perfil eliminada." };
}
