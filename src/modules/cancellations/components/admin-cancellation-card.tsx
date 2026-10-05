"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { CancellationStatusBadge } from "@/modules/cancellations/components/cancellation-status-badge";
import { AdminReviewCancellationForm } from "@/modules/cancellations/components/admin-cancellation-review";
import { refundReasonLabel } from "@/modules/cancellations/domain/labels";
import type { AdminCancellationRow } from "@/modules/cancellations/queries";
import { fulfillmentStatusLabel } from "@/modules/orders/domain/labels";
import { formatMoneyFromMinorUnits } from "@/lib/money/format";

function formatRequestedAt(value: string) {
  return new Intl.DateTimeFormat("es-MX", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

export function AdminCancellationCard({ item }: { item: AdminCancellationRow }) {
  const [open, setOpen] = useState(false);
  const total = formatMoneyFromMinorUnits(item.grandTotalMinor, "MXN", "es-MX");
  const refunded = formatMoneyFromMinorUnits(item.refundedAmountMinor, "MXN", "es-MX");
  const available = formatMoneyFromMinorUnits(item.refundableMinor, "MXN", "es-MX");
  const canReview = item.status === "REQUESTED";

  return (
    <Card className="max-w-3xl bg-[var(--admin-surface)]">
      <CardHeader>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <Link
            href={`/admin/orders/${item.orderId}`}
            className="type-label tracking-[0.12em] text-secondary hover:underline"
          >
            {item.orderNumber}
          </Link>
          <CancellationStatusBadge status={item.status} />
        </div>
        <p className="type-body">{item.customerName}</p>
        <p className="type-body-sm text-muted-foreground">{item.customerEmail}</p>
      </CardHeader>
      <CardContent className="grid gap-2 type-body-sm">
        <p>
          Total: <span className="tabular-nums">{total}</span>
          <span className="mx-2 text-muted-foreground">·</span>
          Fulfillment: {fulfillmentStatusLabel(item.fulfillmentStatus)}
        </p>
        <p>Motivo: {refundReasonLabel(item.reason)}</p>
        <p className="text-muted-foreground">Solicitada: {formatRequestedAt(item.createdAt)}</p>
      </CardContent>
      <CardFooter className="flex-wrap">
        <Button
          type="button"
          variant={open ? "ghost" : "secondary"}
          size="sm"
          aria-expanded={open}
          onClick={() => setOpen((current) => !current)}
        >
          {open ? "Ocultar detalle" : "Revisar solicitud"}
        </Button>
      </CardFooter>
      {open ? (
        <div className="mt-6 grid gap-6 border-t border-border pt-6">
          <section className="grid gap-3">
            <h3 className="type-h3">Solicitud del cliente</h3>
            <p className="type-body-sm">
              Pedido{" "}
              <Link href={`/admin/orders/${item.orderId}`} className="text-secondary hover:underline">
                {item.orderNumber}
              </Link>
            </p>
            <p className="type-body-sm">Motivo: {refundReasonLabel(item.reason)}</p>
            <p className="type-body-sm text-muted-foreground">Fecha: {formatRequestedAt(item.createdAt)}</p>
            {item.customerMessage ? (
              <p className="type-body">{item.customerMessage}</p>
            ) : (
              <p className="type-body-sm text-muted-foreground">Sin mensaje adicional.</p>
            )}
            <dl className="mt-2 grid gap-1 type-body-sm tabular-nums">
              <div className="flex justify-between gap-4">
                <dt>Total pagado</dt>
                <dd>{total}</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt>Ya reembolsado</dt>
                <dd>{refunded}</dd>
              </div>
              <div className="flex justify-between gap-4 border-t border-border pt-2 type-body">
                <dt>Disponible</dt>
                <dd>{available}</dd>
              </div>
            </dl>
          </section>
          {canReview ? (
            <AdminReviewCancellationForm
              requestId={item.id}
              canReview
              refundableMinor={item.refundableMinor}
            />
          ) : null}
        </div>
      ) : null}
    </Card>
  );
}
