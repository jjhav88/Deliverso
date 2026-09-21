import type { DisplayMoney } from "@/lib/money/display";
import type { MoneyAmount } from "@/lib/money/types";
import type { ConfigurationIssue } from "@/modules/catalog/pricing/types";

export type CartIssue = {
  code: ConfigurationIssue;
  message: string;
};

export type CartItemConfigurationLine = {
  groupName: string;
  optionNames: string[];
};

export type CartItemView = {
  id: string;
  productId: string;
  slug: string;
  name: string;
  imageSrc: string | null;
  imageAlt: string;
  quantity: number;
  configuration: CartItemConfigurationLine[];
  unitPrice: MoneyAmount | null;
  lineTotal: MoneyAmount | null;
  displayUnitPrice: DisplayMoney | null;
  displayLineTotal: DisplayMoney | null;
  valid: boolean;
  issues: CartIssue[];
};

export type CartView = {
  items: CartItemView[];
  itemCount: number;
  subtotal: MoneyAmount;
  displaySubtotal: DisplayMoney;
  issues: CartIssue[];
};
