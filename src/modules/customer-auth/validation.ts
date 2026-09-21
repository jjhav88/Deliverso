import { z } from "zod";
import { isValidPhone, normalizePhone } from "@/modules/customer-auth/domain/phone";

export const CUSTOMER_PASSWORD_MIN = 8;

const emailField = z.string().trim().toLowerCase().email();

export const customerRegisterSchema = z
  .object({
    email: emailField,
    password: z.string().min(CUSTOMER_PASSWORD_MIN).max(72),
    confirmPassword: z.string(),
    termsAccepted: z.literal(true),
    privacyAccepted: z.literal(true),
    next: z.string().optional(),
  })
  .refine((value) => value.password === value.confirmPassword, {
    path: ["confirmPassword"],
    message: "Las contraseñas no coinciden.",
  });

export const customerLoginSchema = z.object({
  email: emailField,
  password: z.string().min(1),
  next: z.string().optional(),
});

export const customerForgotPasswordSchema = z.object({
  email: emailField,
});

export const customerResetPasswordSchema = z
  .object({
    password: z.string().min(CUSTOMER_PASSWORD_MIN).max(72),
    confirmPassword: z.string(),
  })
  .refine((value) => value.password === value.confirmPassword, {
    path: ["confirmPassword"],
    message: "Las contraseñas no coinciden.",
  });

export const customerProfileSchema = z.object({
  displayName: z.string().trim().max(80),
  phone: z
    .string()
    .transform(normalizePhone)
    .refine((value) => value === "" || isValidPhone(value), "Teléfono inválido."),
});

export type CustomerRegisterInput = z.infer<typeof customerRegisterSchema>;
export type CustomerLoginInput = z.infer<typeof customerLoginSchema>;
