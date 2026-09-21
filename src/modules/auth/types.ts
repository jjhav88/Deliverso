import type { AdminRole } from "@/modules/auth/domain/admin-role";
import type { AdminStatus } from "@/modules/auth/domain/admin-status";

export type AuthenticatedAdmin = {
  id: string;
  authUserId: string;
  email: string;
  displayName: string | null;
  role: AdminRole;
  status: AdminStatus;
};

export type PublicAdminProfile = {
  email: string;
  displayName: string | null;
  role: AdminRole;
};
