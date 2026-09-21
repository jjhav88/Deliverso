import { formatMoney } from "@/lib/money";
import type { AppLocale } from "@/config/i18n";
import type { DisplayMoney } from "@/lib/money/display";
import { displayUsesConversion } from "@/lib/money/to-display";

type CatalogFxNoteProps = {
  display: DisplayMoney | null;
  labels: {
    note: string;
    unavailable: string;
    from?: string;
    rate?: string;
  };
  detail?: boolean;
  locale: AppLocale;
};

export function CatalogFxNote({
  display,
  labels,
  detail = false,
  locale,
}: CatalogFxNoteProps) {
  if (!display) {
    return null;
  }

  if (display.unavailable) {
    return (
      <p className="type-caption mt-4 text-muted-foreground">{labels.unavailable}</p>
    );
  }

  if (!displayUsesConversion(display)) {
    return null;
  }

  const date = display.sourceDate
      ? new Intl.DateTimeFormat(locale, {
        day: "numeric",
        month: "short",
        year: "numeric",
        timeZone: "UTC",
      }).format(new Date(`${display.sourceDate}T00:00:00Z`))
    : "";

  if (detail && labels.from && labels.rate) {
    const original = formatMoney(
      {
        amountMinor: display.originalAmountMinor,
        currency: display.originalCurrency,
      },
      locale,
    );
    return (
      <div className="mt-3 grid gap-1">
        <p className="type-caption text-muted-foreground">
          {labels.from.replace("{amount}", original)}
        </p>
        {date ? (
          <p className="type-caption text-muted-foreground">
            {labels.rate.replace("{date}", date)}
          </p>
        ) : null}
      </div>
    );
  }

  return (
    <p className="type-caption mt-4 text-muted-foreground">
      {labels.note.replace("{date}", date)}
    </p>
  );
}
