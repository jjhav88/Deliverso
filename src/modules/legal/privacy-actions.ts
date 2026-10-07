"use server";

import { getOptionalCustomer } from "@/modules/customer-auth/queries";
import { privacyRequestSchema } from "@/modules/legal/validation";
import { hasRuntimeDatabaseUrl } from "@/server/db/env";
import { getPrisma } from "@/server/db/prisma";

export type PrivacyRequestActionState = {
  error: string | null;
  success: string | null;
};

export const emptyPrivacyRequestActionState: PrivacyRequestActionState = {
  error: null,
  success: null,
};

export async function submitPrivacyRequestAction(
  previousState: PrivacyRequestActionState,
  formData: FormData,
): Promise<PrivacyRequestActionState> {
  void previousState;
  const parsed = privacyRequestSchema.safeParse({
    type: formData.get("type"),
    email: formData.get("email"),
    message: formData.get("message"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Revisa el formulario.", success: null };
  }
  if (!hasRuntimeDatabaseUrl()) {
    return { error: "No pudimos recibir la solicitud en este momento.", success: null };
  }

  const customer = await getOptionalCustomer();
  await getPrisma().privacyRequest.create({
    data: {
      type: parsed.data.type,
      email: parsed.data.email,
      message: parsed.data.message,
      customerId: customer?.id ?? null,
      status: "RECEIVED",
    },
  });

  return {
    error: null,
    success:
      "Recibimos tu solicitud. La revisaremos y verificaremos tu identidad antes de entregar o modificar información. No hay descarga automática de datos.",
  };
}
