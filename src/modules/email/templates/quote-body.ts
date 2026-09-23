import type { QuoteEmailView } from "@/modules/email/domain/types";
import { formatCustomerCalendarDate } from "@/modules/email/domain/presentation";
import { escapeHtml, moneyMxn } from "@/modules/email/templates/layout";

export function quoteDetailsHtml(view: QuoteEmailView): string {
  const en = view.locale === "en-US";
  const rows = [
    [en ? "Quote" : "Cotización", view.quoteNumber],
    [en ? "Creation" : "Producto", view.productName],
    view.requestTitle ? [en ? "Title" : "Título", view.requestTitle] : null,
    [en ? "Your idea" : "Tu idea", view.requestDescription],
    view.quotedSubtotalMinor != null
      ? [en ? "Subtotal" : "Subtotal", moneyMxn(view.quotedSubtotalMinor)]
      : null,
    view.deliveryFeeMinor != null
      ? [en ? "Delivery" : "Entrega", moneyMxn(view.deliveryFeeMinor)]
      : null,
    view.quotedTotalMinor != null
      ? [en ? "Total MXN" : "Total MXN", moneyMxn(view.quotedTotalMinor)]
      : null,
    view.validUntil
      ? [
          en ? "Valid until" : "Válida hasta",
          formatCustomerCalendarDate(view.validUntil.slice(0, 10), view.locale),
        ]
      : null,
  ].filter((row): row is [string, string] => Boolean(row));

  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0">
    ${rows
      .map(
        ([label, value]) => `<tr>
      <td style="padding:8px 0;vertical-align:top;font-size:13px;color:#44294E;">${escapeHtml(label)}</td>
      <td style="padding:8px 0 8px 16px;font-size:15px;color:#234166;">${escapeHtml(value)}</td>
    </tr>`,
      )
      .join("")}
  </table>`;
}

export function quoteDetailsText(view: QuoteEmailView): string {
  const en = view.locale === "en-US";
  return [
    `${en ? "Quote" : "Cotización"}: ${view.quoteNumber}`,
    `${en ? "Creation" : "Producto"}: ${view.productName}`,
    view.requestTitle ? `${en ? "Title" : "Título"}: ${view.requestTitle}` : null,
    view.requestDescription,
    view.quotedSubtotalMinor != null ? `${en ? "Subtotal" : "Subtotal"}: ${moneyMxn(view.quotedSubtotalMinor)}` : null,
    view.deliveryFeeMinor != null ? `${en ? "Delivery" : "Entrega"}: ${moneyMxn(view.deliveryFeeMinor)}` : null,
    view.quotedTotalMinor != null ? `${en ? "Total MXN" : "Total MXN"}: ${moneyMxn(view.quotedTotalMinor)}` : null,
    view.validUntil
      ? `${en ? "Valid until" : "Válida hasta"}: ${formatCustomerCalendarDate(view.validUntil.slice(0, 10), view.locale)}`
      : null,
  ]
    .filter(Boolean)
    .join("\n");
}
