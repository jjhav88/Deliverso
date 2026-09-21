"use server";

import { writeAdminAuditLog } from "@/modules/audit/write-admin-audit-log";
import { requireAdmin } from "@/modules/auth/authorization/require-admin";
import { revalidateStorefront } from "@/server/cache/revalidate-storefront";
import { revalidatePath } from "next/cache";
import { refreshExchangeRates } from "@/server/exchange-rates/service";

export type ExchangeRateRefreshState = {
  error: string | null;
  success: string | null;
};

export async function refreshExchangeRatesAction(
  previousState: ExchangeRateRefreshState,
  formData: FormData,
): Promise<ExchangeRateRefreshState> {
  void previousState;
  void formData;
  const admin = await requireAdmin("/admin/settings");

  try {
    const set = await refreshExchangeRates();
    await writeAdminAuditLog({
      actorAdminId: admin.id,
      action: "EXCHANGE_RATES_REFRESHED",
      resourceType: "ExchangeRateSnapshot",
      metadata: {
        provider: set.provider ?? "FRANKFURTER_ECB",
        sourceDate: set.sourceDate ?? "",
      },
    });
    revalidatePath("/admin/settings");
    revalidateStorefront();
    return { error: null, success: "Tasas actualizadas." };
  } catch {
    return {
      error:
        "No fue posible actualizar las tasas. Se conserva la última referencia disponible.",
      success: null,
    };
  }
}
