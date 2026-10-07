import { z } from "zod";
import { isPrivacyRequestType } from "@/modules/legal/domain/types";

export const privacyRequestSchema = z.object({
  type: z.string().refine(isPrivacyRequestType, "Selecciona un derecho ARCO."),
  email: z.string().trim().toLowerCase().email("Correo inválido."),
  message: z.string().trim().min(12, "Describe tu solicitud con un poco más de detalle.").max(4000),
});
