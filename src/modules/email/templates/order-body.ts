import type { OrderEmailView } from "@/modules/email/domain/types";
import {
  formatAddressLines,
  formatCustomerCalendarDate,
  formatCustomerTimeWindow,
} from "@/modules/email/domain/presentation";
import { emailColors, escapeHtml, moneyMxn } from "@/modules/email/templates/layout";

export function orderDetailsHtml(view: OrderEmailView): string {
  const labels = view.locale === "en-US" ? en : es;
  const date = formatCustomerCalendarDate(view.requestedDate, view.locale);
  const slot = formatCustomerTimeWindow(view.timeWindow);
  const items = view.items
    .map((item, index) => {
      const unit = item.quantity > 0 ? item.lineTotalMinor / item.quantity : item.lineTotalMinor;
      const options = item.options
        .map((option) => `${escapeHtml(option.groupName)}: ${escapeHtml(option.optionName)}`)
        .join("<br />");
      const border = index < view.items.length - 1 ? `border-bottom:1px solid ${emailColors.border};` : "";
      return `<tr>
        <td style="padding:12px 0;vertical-align:top;${border}">
          <div style="font-size:16px;color:${emailColors.navy};">${escapeHtml(item.productName)}${
            item.variantName ? ` · ${escapeHtml(item.variantName)}` : ""
          }</div>
          ${options ? `<div style="margin-top:6px;font-size:13px;line-height:1.5;color:${emailColors.purple};">${options}</div>` : ""}
        </td>
        <td style="padding:12px 0 12px 12px;text-align:right;white-space:nowrap;vertical-align:top;${border}">
          ${item.quantity}&nbsp;×&nbsp;${moneyMxn(unit)}
        </td>
      </tr>`;
    })
    .join("");

  const addressLines =
    view.addressLines.length > 0
      ? view.addressLines
      : formatAddressLines({ summary: view.addressSummary });
  const placeHtml =
    view.fulfillmentMethod === "PICKUP"
      ? [
          view.pickupName
            ? row(labels.point, escapeHtml(view.pickupName))
            : "",
          view.pickupAddress ? row(labels.address, escapeHtml(view.pickupAddress)) : "",
        ].join("")
      : addressLines.length > 0
        ? row(labels.address, addressLines.map((line) => escapeHtml(line)).join("<br />"))
        : "";

  const display =
    view.displayCurrencyCode && view.displayTotalMinor != null
      ? `<p style="margin:16px 0 0 0;font-size:13px;line-height:1.5;color:${emailColors.navy};">${
          view.locale === "en-US"
            ? `When you placed the order you saw an approximate equivalent of ${moneyLabel(view.displayTotalMinor, view.displayCurrencyCode, view.locale)}.`
            : `Al realizar tu pedido viste un equivalente aproximado de ${moneyLabel(view.displayTotalMinor, view.displayCurrencyCode, view.locale)}.`
        }</p>`
      : "";

  return `
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#fff;border:1px solid ${emailColors.border};">
      <tr>
        <td style="padding:18px 18px 8px 18px;font-size:12px;letter-spacing:0.14em;text-transform:uppercase;color:${emailColors.gold};">${labels.order}</td>
      </tr>
      <tr>
        <td style="padding:0 18px 16px 18px;font-size:18px;color:${emailColors.navy};">#${escapeHtml(view.orderNumber)}</td>
      </tr>
      <tr>
        <td style="padding:0 18px;">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0">${items}</table>
        </td>
      </tr>
      <tr>
        <td style="padding:8px 18px 0 18px;">
          ${moneyRow(labels.subtotal, moneyMxn(view.itemsSubtotalMinor))}
          ${moneyRow(labels.delivery, moneyMxn(view.deliveryFeeMinor))}
          ${view.promotionDiscountMinor && view.promotionDiscountMinor > 0
            ? moneyRow(
                `${labels.promotion}${view.promotionCode ? ` ${escapeHtml(view.promotionCode)}` : ""}`,
                `−${moneyMxn(view.promotionDiscountMinor)}`,
              )
            : ""}
        </td>
      </tr>
      <tr>
        <td style="padding:12px 18px 18px 18px;">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
            <tr>
              <td style="font-size:12px;letter-spacing:0.14em;text-transform:uppercase;color:${emailColors.gold};">${labels.total}</td>
              <td style="text-align:right;font-size:20px;color:${emailColors.navy};">${moneyMxn(view.grandTotalMinor)} MXN</td>
            </tr>
          </table>
          ${display}
        </td>
      </tr>
    </table>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-top:16px;background:#fff;border:1px solid ${emailColors.border};">
      <tr>
        <td style="padding:18px 18px 8px 18px;font-size:12px;letter-spacing:0.14em;text-transform:uppercase;color:${emailColors.gold};">${
          view.fulfillmentMethod === "PICKUP" ? labels.pickup : labels.deliveryTitle
        }</td>
      </tr>
      <tr>
        <td style="padding:0 18px 18px 18px;">
          ${row(labels.date, escapeHtml(date))}
          ${row(labels.slot, escapeHtml(slot))}
          ${placeHtml}
        </td>
      </tr>
    </table>
  `;
}

export function orderDetailsText(view: OrderEmailView): string {
  const labels = view.locale === "en-US" ? en : es;
  const date = formatCustomerCalendarDate(view.requestedDate, view.locale);
  const slot = formatCustomerTimeWindow(view.timeWindow);
  const items = view.items
    .map((item) => {
      const unit = item.quantity > 0 ? item.lineTotalMinor / item.quantity : item.lineTotalMinor;
      const options = item.options.map((option) => `  ${option.groupName}: ${option.optionName}`).join("\n");
      return `${item.productName}${item.variantName ? ` · ${item.variantName}` : ""}\n  ${item.quantity} × ${moneyMxn(unit)}${options ? `\n${options}` : ""}`;
    })
    .join("\n");
  const place =
    view.fulfillmentMethod === "PICKUP"
      ? [view.pickupName, view.pickupAddress].filter(Boolean).join("\n")
      : (view.addressLines.length > 0 ? view.addressLines : [view.addressSummary]).filter(Boolean).join("\n");
  return [
    `${labels.order} #${view.orderNumber}`,
    items,
    `${labels.subtotal}: ${moneyMxn(view.itemsSubtotalMinor)}`,
    `${labels.delivery}: ${moneyMxn(view.deliveryFeeMinor)}`,
    view.promotionDiscountMinor && view.promotionDiscountMinor > 0
      ? `${labels.promotion}${view.promotionCode ? ` ${view.promotionCode}` : ""}: −${moneyMxn(view.promotionDiscountMinor)}`
      : "",
    `${labels.total}: ${moneyMxn(view.grandTotalMinor)} MXN`,
    view.fulfillmentMethod === "PICKUP" ? labels.pickup : labels.deliveryTitle,
    `${labels.date}: ${date}`,
    `${labels.slot}: ${slot}`,
    place,
  ]
    .filter(Boolean)
    .join("\n");
}

const es = {
  order: "Pedido",
  subtotal: "Subtotal",
  delivery: "Entrega",
  promotion: "Promoción",
  total: "Total pagado",
  deliveryTitle: "Entrega",
  pickup: "Recogida",
  date: "Fecha",
  slot: "Horario",
  address: "Dirección",
  point: "Punto",
};

const en = {
  order: "Order",
  subtotal: "Subtotal",
  delivery: "Delivery",
  promotion: "Promotion",
  total: "Amount paid",
  deliveryTitle: "Delivery",
  pickup: "Pickup",
  date: "Date",
  slot: "Time window",
  address: "Address",
  point: "Location",
};

function moneyRow(label: string, value: string): string {
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0">
    <tr>
      <td style="padding:4px 0;color:${emailColors.navy};">${escapeHtml(label)}</td>
      <td style="padding:4px 0;text-align:right;color:${emailColors.navy};">${escapeHtml(value)}</td>
    </tr>
  </table>`;
}

function row(label: string, value: string): string {
  return `<p style="margin:10px 0 0 0;"><span style="display:block;font-size:12px;letter-spacing:0.08em;text-transform:uppercase;color:${emailColors.gold};">${escapeHtml(label)}</span><span style="display:block;margin-top:4px;color:${emailColors.navy};">${value}</span></p>`;
}

function moneyLabel(amountMinor: number, currency: string, locale: string): string {
  return new Intl.NumberFormat(locale === "en-US" ? "en-US" : "es-MX", {
    style: "currency",
    currency,
  }).format(amountMinor / 100);
}
