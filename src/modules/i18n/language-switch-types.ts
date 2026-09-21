import type { AppLocale } from "@/config/i18n";

export type LanguageSwitchItem = {
  locale: AppLocale;
  href: string;
  disabled: boolean;
};
