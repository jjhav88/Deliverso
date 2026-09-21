import "server-only";
import { getPrisma } from "@/server/db/prisma";
import { hasRuntimeDatabaseUrl } from "@/server/db/env";
import { minorToMoneyInput } from "@/modules/catalog/money-input";
import type { OptionSelectionType } from "@/modules/catalog/domain";

export type AdminOptionTranslation = {
  name: string;
  description: string;
};

export type AdminProductOption = {
  id: string;
  code: string;
  priceDeltaInput: string;
  isActive: boolean;
  sortOrder: number;
  usedInCart: boolean;
  es: AdminOptionTranslation;
  en: AdminOptionTranslation;
};

export type AdminProductOptionGroup = {
  id: string;
  code: string;
  selectionType: OptionSelectionType;
  isRequired: boolean;
  minSelections: number;
  maxSelections: number;
  sortOrder: number;
  isActive: boolean;
  usedInCart: boolean;
  es: AdminOptionTranslation;
  en: AdminOptionTranslation;
  options: AdminProductOption[];
};

function translation(
  rows: Array<{ locale: string; name: string; description: string | null }>,
  locale: "es-MX" | "en-US",
): AdminOptionTranslation {
  const row = rows.find((item) => item.locale === locale);
  return { name: row?.name ?? "", description: row?.description ?? "" };
}

export async function getAdminProductOptionGroups(
  productId: string,
): Promise<AdminProductOptionGroup[]> {
  if (!hasRuntimeDatabaseUrl()) {
    return [];
  }

  const groups = await getPrisma().productOptionGroup.findMany({
    where: { productId },
    orderBy: { sortOrder: "asc" },
    include: {
      translations: true,
      options: {
        orderBy: { sortOrder: "asc" },
        include: {
          translations: true,
          _count: { select: { cartItemOptions: true } },
        },
      },
    },
  });

  return groups.map((group) => ({
    id: group.id,
    code: group.code,
    selectionType: group.selectionType,
    isRequired: group.isRequired,
    minSelections: group.minSelections,
    maxSelections: group.maxSelections,
    sortOrder: group.sortOrder,
    isActive: group.isActive,
    usedInCart: group.options.some((option) => option._count.cartItemOptions > 0),
    es: translation(group.translations, "es-MX"),
    en: translation(group.translations, "en-US"),
    options: group.options.map((option) => ({
      id: option.id,
      code: option.code,
      priceDeltaInput: minorToMoneyInput(option.priceDeltaMinor),
      isActive: option.isActive,
      sortOrder: option.sortOrder,
      usedInCart: option._count.cartItemOptions > 0,
      es: translation(option.translations, "es-MX"),
      en: translation(option.translations, "en-US"),
    })),
  }));
}
