"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getLocale } from "next-intl/server";
import { isAppLocale } from "@/config/i18n";
import { claimOrMergeLegacyCart } from "@/modules/cart/claim";
import { associateCartCookie, findCustomerShopperCart } from "@/server/cart/session";
import {
  emptyCustomerActionState,
  type CustomerActionState,
} from "@/modules/customer-auth/action-state";
import { getSafeCustomerPath } from "@/modules/customer-auth/domain/safe-path";
import { canCustomerShop } from "@/modules/customer-auth/domain/status";
import { resolveAppOrigin } from "@/modules/customer-auth/origin";
import {
  ensureCustomerAccount,
  requireCustomer,
} from "@/modules/customer-auth/queries";
import { removeOwnedAvatar, replaceOwnedAvatar } from "@/modules/avatars/service";
import {
  customerForgotPasswordSchema,
  customerLoginSchema,
  customerProfileSchema,
  customerRegisterSchema,
  customerResetPasswordSchema,
} from "@/modules/customer-auth/validation";
import { hasRuntimeDatabaseUrl } from "@/server/db/env";
import { getPrisma } from "@/server/db/prisma";
import { hasSupabaseAuthConfig } from "@/server/supabase/env";
import { createSupabaseServerClient } from "@/server/supabase/server";

const GENERIC_REGISTER =
  "Si puedes crear o recuperar una cuenta con este correo, recibirás las instrucciones correspondientes.";
const GENERIC_LOGIN = "No pudimos iniciar sesión. Revisa tus credenciales.";
const CONFIRM_EMAIL = "Confirma tu correo antes de continuar.";
const GENERIC_RESET =
  "Si existe una cuenta con este correo, recibirás las instrucciones de recuperación.";

function parseIso(value: unknown): Date | null {
  if (typeof value !== "string" || !value) {
    return null;
  }
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function booleanFromForm(value: FormDataEntryValue | null): boolean {
  return value === "on" || value === "true" || value === "1";
}

export async function registerCustomerAction(
  previousState: CustomerActionState,
  formData: FormData,
): Promise<CustomerActionState> {
  void previousState;
  const parsed = customerRegisterSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
    confirmPassword: formData.get("confirmPassword"),
    termsAccepted: booleanFromForm(formData.get("termsAccepted")),
    privacyAccepted: booleanFromForm(formData.get("privacyAccepted")),
    next: formData.get("next") || undefined,
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Revisa los campos.", success: null };
  }
  if (!hasSupabaseAuthConfig()) {
    return { error: GENERIC_REGISTER, success: null };
  }

  const next = getSafeCustomerPath(parsed.data.next);
  const origin = await resolveAppOrigin();
  const acceptedAt = new Date().toISOString();
  const supabase = await createSupabaseServerClient();
  await supabase.auth.signUp({
    email: parsed.data.email,
    password: parsed.data.password,
    options: {
      emailRedirectTo: `${origin}/auth/confirm?next=${encodeURIComponent(next)}`,
      data: {
        termsAcceptedAt: acceptedAt,
        privacyAcceptedAt: acceptedAt,
      },
    },
  });

  return { error: null, success: "CHECK_EMAIL" };
}

export async function loginCustomerAction(
  previousState: CustomerActionState,
  formData: FormData,
): Promise<CustomerActionState> {
  void previousState;
  const parsed = customerLoginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
    next: formData.get("next") || undefined,
  });
  if (!parsed.success) {
    return { error: GENERIC_LOGIN, success: null };
  }
  if (!hasSupabaseAuthConfig() || !hasRuntimeDatabaseUrl()) {
    return { error: GENERIC_LOGIN, success: null };
  }

  const destination = getSafeCustomerPath(parsed.data.next);
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.auth.signInWithPassword({
    email: parsed.data.email,
    password: parsed.data.password,
  });

  if (error || !data.user) {
    const message = error?.message?.toLowerCase().includes("confirm")
      ? CONFIRM_EMAIL
      : GENERIC_LOGIN;
    return { error: message, success: null };
  }

  const { data: verified, error: verifyError } = await supabase.auth.getUser();
  if (verifyError || !verified.user || verified.user.id !== data.user.id) {
    await supabase.auth.signOut();
    return { error: GENERIC_LOGIN, success: null };
  }

  if (!verified.user.email_confirmed_at || !verified.user.email) {
    await supabase.auth.signOut();
    return { error: CONFIRM_EMAIL, success: null };
  }

  const locale = await getLocale();
  const customer = await ensureCustomerAccount({
    authUserId: verified.user.id,
    email: verified.user.email,
    termsAcceptedAt: parseIso(verified.user.user_metadata?.termsAcceptedAt),
    privacyAcceptedAt: parseIso(verified.user.user_metadata?.privacyAcceptedAt),
    locale: isAppLocale(locale) ? locale : "es-MX",
  });

  if (!customer) {
    await supabase.auth.signOut();
    return { error: GENERIC_LOGIN, success: null };
  }

  if (!canCustomerShop(customer.status)) {
    return { error: "Tu cuenta no puede continuar compras.", success: null };
  }

  await getPrisma().customerAccount.update({
    where: { id: customer.id },
    data: { lastLoginAt: new Date() },
  });
  await claimOrMergeLegacyCart(customer.id);
  const shopperCart = await findCustomerShopperCart(customer.id);
  if (shopperCart) {
    await associateCartCookie(shopperCart.id);
  }
  redirect(destination);
}

export async function logoutCustomerAction(): Promise<void> {
  if (hasSupabaseAuthConfig()) {
    const supabase = await createSupabaseServerClient();
    await supabase.auth.signOut();
  }
  redirect("/");
}

export async function requestPasswordResetAction(
  previousState: CustomerActionState,
  formData: FormData,
): Promise<CustomerActionState> {
  void previousState;
  const parsed = customerForgotPasswordSchema.safeParse({
    email: formData.get("email"),
  });
  if (!parsed.success) {
    return { error: null, success: GENERIC_RESET };
  }
  if (!hasSupabaseAuthConfig()) {
    return { error: null, success: GENERIC_RESET };
  }

  const nextPath = String(formData.get("resetNext") ?? "/cuenta/restablecer-contrasena");
  const origin = await resolveAppOrigin();
  const supabase = await createSupabaseServerClient();
  await supabase.auth.resetPasswordForEmail(parsed.data.email, {
    redirectTo: `${origin}/auth/confirm?next=${encodeURIComponent(getSafeCustomerPath(nextPath, "/cuenta/restablecer-contrasena"))}`,
  });
  return { error: null, success: GENERIC_RESET };
}

export async function updatePasswordAction(
  previousState: CustomerActionState,
  formData: FormData,
): Promise<CustomerActionState> {
  void previousState;
  const parsed = customerResetPasswordSchema.safeParse({
    password: formData.get("password"),
    confirmPassword: formData.get("confirmPassword"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Revisa los campos.", success: null };
  }
  if (!hasSupabaseAuthConfig()) {
    return { error: "No pudimos actualizar la contraseña.", success: null };
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.updateUser({ password: parsed.data.password });
  if (error) {
    return { error: "No pudimos actualizar la contraseña.", success: null };
  }
  redirect("/cuenta");
}

export async function updateCustomerProfileAction(
  previousState: CustomerActionState,
  formData: FormData,
): Promise<CustomerActionState> {
  void previousState;
  const customer = await requireCustomer("/cuenta");
  const parsed = customerProfileSchema.safeParse({
    displayName: formData.get("displayName") ?? "",
    phone: formData.get("phone") ?? "",
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Revisa los campos.", success: null };
  }

  await getPrisma().customerAccount.update({
    where: { id: customer.id },
    data: {
      displayName: parsed.data.displayName || null,
      phone: parsed.data.phone || null,
    },
  });
  revalidatePath("/cuenta");
  revalidatePath("/en/account");
  return { error: null, success: "Perfil actualizado." };
}

export async function uploadCustomerAvatarAction(
  previousState: CustomerActionState,
  formData: FormData,
): Promise<CustomerActionState> {
  void previousState;
  const customer = await requireCustomer("/cuenta");
  const file = formData.get("avatar");
  if (!(file instanceof File)) {
    return { error: "Elige una foto de perfil.", success: null };
  }

  const replaced = await replaceOwnedAvatar({
    kind: "customers",
    ownerId: customer.id,
    file,
  });
  if (!replaced.ok) {
    return { error: replaced.error, success: null };
  }

  await getPrisma().customerAccount.update({
    where: { id: customer.id },
    data: { avatarPath: replaced.objectPath },
  });
  revalidatePath("/cuenta");
  revalidatePath("/en/account");
  return { error: null, success: "Foto de perfil actualizada." };
}

export async function removeCustomerAvatarAction(
  previousState: CustomerActionState,
): Promise<CustomerActionState> {
  void previousState;
  const customer = await requireCustomer("/cuenta");
  await removeOwnedAvatar({ kind: "customers", ownerId: customer.id });
  await getPrisma().customerAccount.update({
    where: { id: customer.id },
    data: { avatarPath: null },
  });
  revalidatePath("/cuenta");
  revalidatePath("/en/account");
  return { error: null, success: "Foto de perfil eliminada." };
}

export async function resendCustomerConfirmationAction(
  previousState: CustomerActionState,
  formData: FormData,
): Promise<CustomerActionState> {
  void previousState;
  const parsed = customerForgotPasswordSchema.safeParse({
    email: formData.get("email"),
  });
  if (!parsed.success || !hasSupabaseAuthConfig()) {
    return emptyCustomerActionState;
  }
  const supabase = await createSupabaseServerClient();
  await supabase.auth.resend({ type: "signup", email: parsed.data.email });
  return { error: null, success: GENERIC_REGISTER };
}

