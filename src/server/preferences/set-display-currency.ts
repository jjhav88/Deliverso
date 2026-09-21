"use server";

import { cookies } from "next/headers";
import { currencyCookie } from "@/config/currency";
import { parseCurrencyPreference } from "@/lib/currency/preference";

export async function setDisplayCurrencyAction(value: string): Promise<void> {
  const currency = parseCurrencyPreference(value);
  const store = await cookies();

  store.set(currencyCookie.name, currency, {
    path: currencyCookie.path,
    maxAge: currencyCookie.maxAge,
    sameSite: currencyCookie.sameSite,
    httpOnly: currencyCookie.httpOnly,
    secure: currencyCookie.secure,
  });
}
