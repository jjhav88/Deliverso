import { z } from "zod";
import { isSafeHttpsUrl } from "@/modules/settings/social-url";
import { normalizeWhatsappNumber } from "@/modules/settings/whatsapp";

const optionalEmail = z
  .string()
  .trim()
  .optional()
  .transform((value) => (value ? value : undefined))
  .refine((value) => !value || z.string().email().safeParse(value).success, "Correo inválido.");

const optionalWhatsapp = z
  .string()
  .trim()
  .optional()
  .transform((value) => (value ? value : undefined))
  .refine((value) => !value || Boolean(normalizeWhatsappNumber(value)), "WhatsApp inválido.");

const optionalText = z
  .string()
  .trim()
  .max(240)
  .optional()
  .transform((value) => (value ? value : undefined));

const optionalHttpsUrl = z
  .string()
  .trim()
  .optional()
  .transform((value) => (value ? value : undefined))
  .refine((value) => !value || isSafeHttpsUrl(value), "Usa una URL https válida.");

export const siteSettingsSaveSchema = z.object({
  contactEmail: optionalEmail,
  whatsapp: optionalWhatsapp,
  physicalAddress: optionalText,
  facebookUrl: optionalHttpsUrl,
  facebookActive: z.boolean(),
  instagramUrl: optionalHttpsUrl,
  instagramActive: z.boolean(),
  tiktokUrl: optionalHttpsUrl,
  tiktokActive: z.boolean(),
});

export type SiteSettingsSaveInput = z.infer<typeof siteSettingsSaveSchema>;
