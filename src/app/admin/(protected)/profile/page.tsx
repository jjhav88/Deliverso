import { AdminProfileForm } from "@/modules/admin/components/admin-profile-form";
import { requireAdmin } from "@/modules/auth/authorization/require-admin";
import { signAvatarUrl } from "@/modules/avatars/service";

const roleLabel = {
  SUPER_ADMIN: "Super admin",
  ADMIN: "Admin",
} as const;

export default async function AdminProfilePage() {
  const admin = await requireAdmin("/admin/profile");
  const avatarUrl = await signAvatarUrl(admin.avatarPath);

  return (
    <div className="max-w-xl">
      <p className="mb-8 type-body text-muted-foreground">
        Este nombre y foto aparecen en el panel cuando inicias sesión.
      </p>
      <AdminProfileForm
        email={admin.email}
        displayName={admin.displayName ?? ""}
        roleLabel={roleLabel[admin.role]}
        avatarUrl={avatarUrl}
      />
    </div>
  );
}
