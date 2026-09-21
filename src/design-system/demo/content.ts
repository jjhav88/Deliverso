import type { MoneyAmount } from "@/lib/money";

export const demoSource = "design-system-demo" as const;

export const demoProductPrice: MoneyAmount = {
  amountMinor: 45000,
  currency: "MXN",
};

export const demoSelectOptions = [
  { value: "standard", labelKey: "forms.selectOptionStandard" },
  { value: "dedicated", labelKey: "forms.selectOptionDedicated" },
] as const;
