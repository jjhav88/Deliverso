import type { OptionSelectionType, ProductStatus, ProductType } from "@/modules/catalog/domain";

export type PricingOption = {
  id: string;
  isActive: boolean;
  priceDeltaMinor: number;
};

export type PricingGroup = {
  id: string;
  selectionType: OptionSelectionType;
  isRequired: boolean;
  minSelections: number;
  maxSelections: number;
  isActive: boolean;
  options: PricingOption[];
};

export type PricingSnapshot = {
  productId: string;
  type: ProductType;
  status: ProductStatus;
  variant: {
    id: string;
    isActive: boolean;
    priceMinor: number | null;
  };
  groups: PricingGroup[];
};

export type ConfigurationIssue =
  | "PRODUCT_UNAVAILABLE"
  | "VARIANT_UNAVAILABLE"
  | "OPTION_UNAVAILABLE"
  | "INVALID_CONFIGURATION"
  | "CUSTOM_QUOTE"
  | "QUANTITY_INVALID";

export type ConfiguredPrice = {
  baseUnitPriceMinor: number;
  optionsDeltaMinor: number;
  configuredUnitPriceMinor: number;
  lineTotalMinor: number;
  currency: "MXN";
};

export type PricingSuccess = ConfiguredPrice & {
  ok: true;
  selectedOptionIds: string[];
};

export type PricingFailure = {
  ok: false;
  issue: ConfigurationIssue;
  message: string;
};

export type PricingResult = PricingSuccess | PricingFailure;
