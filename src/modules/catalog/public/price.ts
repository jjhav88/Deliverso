import { hasMasterPrice } from "@/modules/catalog/domain/money";
import type { ProductType } from "@/modules/catalog/domain";
import type { CatalogPriceKind } from "@/modules/catalog/public/types";
import type { MoneyAmount } from "@/lib/money";

export function catalogPriceFromVariant(input: {
  type: ProductType;
  priceMinor: number | null | undefined;
}): { price: MoneyAmount | null; priceKind: CatalogPriceKind } {
  if (input.type === "CUSTOM_QUOTE" || !hasMasterPrice(input.priceMinor)) {
    return { price: null, priceKind: "quote" };
  }

  return {
    price: { amountMinor: input.priceMinor, currency: "MXN" },
    priceKind: input.type === "CONFIGURABLE" ? "from" : "exact",
  };
}
