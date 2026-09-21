import "server-only";
import type { AppLocale } from "@/config/i18n";
import type { CurrencyCode } from "@/config/currency";
import { formatMoney } from "@/lib/money/format";
import { toDisplayMoney } from "@/lib/money/to-display";
import { getQuoteFromSet, type ExchangeRateSet } from "@/server/exchange-rates/rate-set";
import { getPrisma } from "@/server/db/prisma";
import { hasRuntimeDatabaseUrl } from "@/server/db/env";
import type { OptionSelectionType } from "@/modules/catalog/domain";

export type PublicConfiguratorOption = {
  id: string;
  name: string;
  description: string | null;
  priceDeltaMinor: number;
  deltaFormatted: string | null;
};

export type PublicConfiguratorGroup = {
  id: string;
  name: string;
  description: string | null;
  selectionType: OptionSelectionType;
  isRequired: boolean;
  minSelections: number;
  maxSelections: number;
  options: PublicConfiguratorOption[];
};

export async function getPublicConfigurator(input: {
  productId: string;
  locale: AppLocale;
  displayCurrency: CurrencyCode;
  rateSet: ExchangeRateSet;
}): Promise<PublicConfiguratorGroup[]> {
  if (!hasRuntimeDatabaseUrl()) {
    return [];
  }

  const groups = await getPrisma().productOptionGroup.findMany({
    where: { productId: input.productId, isActive: true },
    orderBy: { sortOrder: "asc" },
    include: {
      translations: true,
      options: {
        where: { isActive: true },
        orderBy: { sortOrder: "asc" },
        include: { translations: true },
      },
    },
  });

  return groups.map((group) => ({
    id: group.id,
    name:
      group.translations.find((item) => item.locale === input.locale)?.name ??
      group.translations[0]?.name ??
      group.code,
    description:
      group.translations.find((item) => item.locale === input.locale)?.description ??
      null,
    selectionType: group.selectionType,
    isRequired: group.isRequired,
    minSelections: group.minSelections,
    maxSelections: group.maxSelections,
    options: group.options.map((option) => {
      const delta =
        option.priceDeltaMinor > 0
          ? toDisplayMoney({
              amount: { amountMinor: option.priceDeltaMinor, currency: "MXN" },
              locale: input.locale,
              displayCurrency: input.displayCurrency,
              rate: getQuoteFromSet(input.rateSet, input.displayCurrency),
            })
          : null;
      return {
        id: option.id,
        name:
          option.translations.find((item) => item.locale === input.locale)?.name ??
          option.translations[0]?.name ??
          option.code,
        description:
          option.translations.find((item) => item.locale === input.locale)?.description ??
          null,
        priceDeltaMinor: option.priceDeltaMinor,
        deltaFormatted: delta && !delta.unavailable ? `+ ${delta.formatted}` : option.priceDeltaMinor > 0
          ? `+ ${formatMoney({ amountMinor: option.priceDeltaMinor, currency: "MXN" }, input.locale)}`
          : null,
      };
    }),
  }));
}
