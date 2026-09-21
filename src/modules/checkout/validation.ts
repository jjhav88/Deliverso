import { z } from "zod";
import { checkoutNotesMaxLength } from "@/config/fulfillment";
import { isValidPhone, normalizePhone } from "@/modules/customer-auth/domain/phone";
import { normalizeMexicanPostalCode } from "@/modules/checkout/domain/postal-code";

export const checkoutContactSchema = z.object({
  contactName: z.string().trim().min(2).max(80),
  contactPhone: z
    .string()
    .transform(normalizePhone)
    .refine(isValidPhone, "Teléfono inválido."),
});

export const checkoutFulfillmentMethodSchema = z.object({
  method: z.enum(["DELIVERY", "PICKUP"]),
});

export const checkoutAddressSchema = z.object({
  countryCode: z.literal("MX"),
  postalCode: z
    .string()
    .transform((value) => normalizeMexicanPostalCode(value) ?? "")
    .refine((value) => value.length === 5, "Código postal inválido."),
  state: z.string().trim().min(2).max(80),
  city: z.string().trim().min(2).max(80),
  locality: z.string().trim().max(80).optional(),
  street: z.string().trim().min(2).max(120),
  exteriorNumber: z.string().trim().max(20).optional(),
  interiorNumber: z.string().trim().max(20).optional(),
  reference: z.string().trim().max(200).optional(),
});

export const checkoutPickupSchema = z.object({
  pickupLocationId: z.string().uuid(),
});

export const checkoutSlotSchema = z.object({
  requestedDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  timeWindowId: z.string().uuid(),
});

export const checkoutNotesSchema = z.object({
  customerNotes: z.string().max(checkoutNotesMaxLength),
});
