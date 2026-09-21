import { normalizeEmail } from "@/modules/customer-auth/domain/email";

export function buildCustomerAccountCreateInput(input: {
  authUserId: string;
  email: string;
  termsAcceptedAt?: Date | null;
  privacyAcceptedAt?: Date | null;
}) {
  return {
    authUserId: input.authUserId,
    email: normalizeEmail(input.email),
    termsAcceptedAt: input.termsAcceptedAt ?? null,
    privacyAcceptedAt: input.privacyAcceptedAt ?? null,
  };
}
