"use client";

import { useState } from "react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { formatMoneyFromMinorUnits } from "@/lib/money/format";
import { fulfillmentStatusLabel } from "@/modules/orders/domain/labels";
import type { OperationalOrderCard } from "@/modules/operations/dto";
import {
  formatOperationsDate,
  formatOperationsWindow,
} from "@/modules/operations/domain/dates";
import { fulfillmentMethodLabel } from "@/modules/operations/domain/transitions";
import { FulfillmentTransitionActions } from "@/modules/operations/components/fulfillment-transition-actions";

function formatAddress(order: OperationalOrderCard) {
  if (order.fulfillmentMethod === "PICKUP") {
    return [order.pickupLocationName, order.pickupAddressSnapshot].filter(Boolean).join(" · ");
  }
  if (!order.address) {
    return null;
  }
  return [
    order.customerName,
    [order.address.street, order.address.exteriorNumber].filter(Boolean).join(" "),
    order.address.interiorNumber ? `Int. ${order.address.interiorNumber}` : null,
    order.address.locality,
    `${order.address.city}, ${order.address.state}`,
    order.address.postalCode,
  ]
    .filter(Boolean)
    .join(", ");
}

function statusVariant(status: OperationalOrderCard["fulfillmentStatus"]) {
  switch (status) {
    case "IN_PRODUCTION":
      return "warning" as const;
    case "READY":
      return "success" as const;
    case "OUT_FOR_DELIVERY":
      return "accent" as const;
    case "COMPLETED":
      return "default" as const;
    default:
      return "secondary" as const;
  }
}

export function OperationsOrderCard({
  order,
  compact = false,
}: {
  order: OperationalOrderCard;
  compact?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const productCount = order.items.reduce((sum, item) => sum + item.quantity, 0);
  const preview = order.items.slice(0, 3);
  const windowLabel = order.missingSchedule
    ? "Sin horario"
    : formatOperationsWindow(order.timeWindowStart, order.timeWindowEnd);
  const address = formatAddress(order);

  return (
    <Card className="bg-[var(--admin-surface)]">
      <CardHeader>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <p className="font-display text-2xl text-foreground">{windowLabel}</p>
          <div className="flex flex-wrap gap-2">
            {order.overdue ? (
              <Badge variant="destructive">Atrasado</Badge>
            ) : null}
            <Badge variant={statusVariant(order.fulfillmentStatus)}>
              {fulfillmentStatusLabel(order.fulfillmentStatus)}
            </Badge>
          </div>
        </div>
        <p className="type-label tracking-[0.12em] text-secondary">
          {fulfillmentMethodLabel(order.fulfillmentMethod)}
          {order.requestedDate ? ` · ${formatOperationsDate(order.requestedDate)}` : ""}
        </p>
        <p className="type-caption uppercase tracking-[0.14em] text-muted-foreground">
          {order.orderNumber}
        </p>
        <p className="type-body">{order.customerName}</p>
        <p className="type-body-sm text-muted-foreground">
          {productCount} {productCount === 1 ? "producto" : "productos"}
        </p>
      </CardHeader>
      <CardContent className="grid gap-2">
        <ul className="grid gap-1">
          {preview.map((item, index) => (
            <li key={`${item.productName}-${index}`} className="type-body-sm">
              {item.productName}
              {item.variantName ? ` · ${item.variantName}` : ""} ×{item.quantity}
            </li>
          ))}
        </ul>
        <div className="mt-2 flex flex-wrap gap-2">
          {order.customOrder ? <Badge variant="accent">Personalizado</Badge> : null}
          {order.promotionCodeSnapshot || order.promotionLabelSnapshot ? (
            <Badge variant="secondary">Promoción</Badge>
          ) : null}
          {order.refundedAmountMinor > 0 && order.refundedAmountMinor < order.grandTotalMinor ? (
            <Badge variant="warning">Reembolso parcial</Badge>
          ) : null}
        </div>
        <p className="type-caption tabular-nums text-muted-foreground">
          {formatMoneyFromMinorUnits(order.grandTotalMinor, "MXN", "es-MX")}
        </p>
      </CardContent>
      <CardFooter className="flex-wrap">
        <FulfillmentTransitionActions
          orderId={order.id}
          method={order.fulfillmentMethod}
          transitions={order.allowedTransitions}
        />
        <Button type="button" variant="ghost" size="sm" aria-expanded={open} onClick={() => setOpen((value) => !value)}>
          {open ? "Ocultar detalle" : "Ver detalle"}
        </Button>
        <Link href={`/admin/orders/${order.id}`} className="type-label text-secondary hover:underline">
          Ver pedido
        </Link>
      </CardFooter>
      {open || compact ? (
        <div className="mt-6 grid gap-3 border-t border-border pt-6 type-body-sm">
          <p>
            {order.customerName}
            {order.customerPhone ? ` · ${order.customerPhone}` : ""}
          </p>
          <p className="text-muted-foreground">{order.customerEmail}</p>
          {order.items.map((item, index) => (
            <div key={`detail-${item.productName}-${index}`}>
              <p>
                {item.productName}
                {item.variantName ? ` · ${item.variantName}` : ""} ×{item.quantity}
              </p>
              {item.options.map((option) => (
                <p key={`${option.groupName}-${option.optionName}`} className="text-muted-foreground">
                  {option.groupName}: {option.optionName}
                </p>
              ))}
            </div>
          ))}
          {order.customerNotes ? <p>Notas del cliente: {order.customerNotes}</p> : null}
          {order.quotationDescriptionSnapshot ? (
            <p>Detalle de cotización: {order.quotationDescriptionSnapshot}</p>
          ) : null}
          {address ? <p>{address}</p> : null}
          {order.fulfillmentMethod === "PICKUP" && order.pickupInstructionsSnapshot ? (
            <p className="text-muted-foreground">{order.pickupInstructionsSnapshot}</p>
          ) : null}
          {order.fulfillmentMethod === "DELIVERY" && order.address?.reference ? (
            <p className="text-muted-foreground">{order.address.reference}</p>
          ) : null}
          {order.quotationId && order.quotationNumberSnapshot ? (
            <p>
              <Link href={`/admin/quotations/${order.quotationId}`} className="text-secondary hover:underline">
                Ver cotización origen ({order.quotationNumberSnapshot})
              </Link>
            </p>
          ) : null}
        </div>
      ) : null}
    </Card>
  );
}
