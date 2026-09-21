import "server-only";
import { createSupabaseServerClient } from "@/server/supabase/server";

export type VerifiedAuthUser = {
  id: string;
  email: string | undefined;
  emailConfirmed: boolean;
};

/**
 * Verifies the caller against Supabase Auth.
 * Do not use getSession() as the authorization source.
 */
export async function getVerifiedAuthUser(): Promise<VerifiedAuthUser | null> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.auth.getUser();

  if (error || !data.user) {
    return null;
  }

  return {
    id: data.user.id,
    email: data.user.email,
    emailConfirmed: Boolean(data.user.email_confirmed_at),
  };
}
