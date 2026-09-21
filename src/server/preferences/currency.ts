import { cookies } from "next/headers";
import { currencyCookie } from "@/config/currency";
import type { CurrencyCode } from "@/config/currency";
import { parseCurrencyPreference } from "@/lib/currency/preference";

export async function getDisplayCurrency(): Promise<CurrencyCode> {
  const store = await cookies();
  return parseCurrencyPreference(store.get(currencyCookie.name)?.value);
}
