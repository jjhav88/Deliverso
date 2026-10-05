import type { CustomerRefundHighlight } from "@/modules/cancellations/domain/presentation";
import { formatMoneyFromMinorUnits } from "@/lib/money/format";

export function CustomerRefundCallout({
  highlight,
  copy,
}: {
  highlight: Exclude<CustomerRefundHighlight, "none">;
  copy: {
    processedTitle: string;
    processedBody: string;
    processedBank: string;
    partialBody: string;
    processingTitle: string;
    processingBody: string;
    reviewingBody: string;
  };
}) {
  return (
    <div className="mt-6 rounded-lg border border-border-strong bg-muted/40 p-5">
      {highlight === "refunded" ? (
        <>
          <h2 className="type-h3">{copy.processedTitle}</h2>
          <p className="mt-2 type-body">{copy.processedBody}</p>
          <p className="mt-2 type-body-sm text-muted-foreground">{copy.processedBank}</p>
        </>
      ) : null}
      {highlight === "partial" ? (
        <p className="type-body">{copy.partialBody}</p>
      ) : null}
      {highlight === "processing" ? (
        <>
          <h2 className="type-h3">{copy.processingTitle}</h2>
          <p className="mt-2 type-body">{copy.processingBody}</p>
        </>
      ) : null}
      {highlight === "reviewing" ? (
        <p className="type-body">{copy.reviewingBody}</p>
      ) : null}
    </div>
  );
}

export function CustomerFinancialSummary({
  chargedMinor,
  refundedMinor,
  netMinor,
  locale,
  labels,
}: {
  chargedMinor: number;
  refundedMinor: number;
  netMinor: number;
  locale: "es-MX" | "en-US";
  labels: { charged: string; refunded: string; net: string };
}) {
  if (refundedMinor <= 0) {
    return (
      <p className="type-h3 tabular-nums">
        {labels.charged}: {formatMoneyFromMinorUnits(chargedMinor, "MXN", locale)}
      </p>
    );
  }

  return (
    <dl className="grid gap-1">
      <div className="flex justify-between gap-4 type-body tabular-nums">
        <dt>{labels.charged}</dt>
        <dd>{formatMoneyFromMinorUnits(chargedMinor, "MXN", locale)}</dd>
      </div>
      <div className="flex justify-between gap-4 type-body tabular-nums">
        <dt>{labels.refunded}</dt>
        <dd>−{formatMoneyFromMinorUnits(refundedMinor, "MXN", locale)}</dd>
      </div>
      <div className="mt-2 flex justify-between gap-4 border-t border-border pt-2 type-h3 tabular-nums">
        <dt>{labels.net}</dt>
        <dd>{formatMoneyFromMinorUnits(netMinor, "MXN", locale)}</dd>
      </div>
    </dl>
  );
}
