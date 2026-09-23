import Link from "next/link";
import { notFound } from "next/navigation";
import { Button } from "@/components/ui/button";
import { getAdminOrderDetail } from "@/modules/admin/orders/queries";
import {
  cancelPaidOrderByAdmin,
  updateOrderFulfillmentStatus,
} from "@/modules/admin/orders/actions";
import { nextFulfillmentStatuses } from "@/modules/orders/domain/fulfillment-status";
import { formatMoneyFromMinorUnits } from "@/lib/money/format";
import { shouldShowStripeTestBadge } from "@/server/stripe/env";

function formatAdminDate(value: string | null) {
  if (!value) {
    return "—";
  }
  return new Intl.DateTimeFormat("es-MX", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function AdminOrderDetailPage({ params }: PageProps) {
  const { id } = await params;
  const order = await getAdminOrderDetail(id);
  if (!order) {
    notFound();
  }

  const nextStatuses = nextFulfillmentStatuses(order.fulfillmentStatus, order.fulfillmentMethod);
  const canCancelPaid =
    order.status === "PAID" &&
    order.fulfillmentStatus !== "COMPLETED" &&
    order.fulfillmentStatus !== "CANCELLED";

  return (
    <div className="flex flex-col gap-8">
      <div>
        <Link href="/admin/orders" className="type-caption text-secondary">
          ← Pedidos
        </Link>
        <h2 className="type-h2 mt-4">{order.orderNumber}</h2>
        <p className="mt-2 type-body text-muted-foreground">
          Snapshots históricos. Los importes no se pueden editar.
        </p>
        {order.quotationId && order.quotationNumberSnapshot ? (
          <p className="mt-2 type-body">
            Cotización origen:{" "}
            <Link href={`/admin/quotations/${order.quotationId}`} className="text-secondary hover:underline">
              {order.quotationNumberSnapshot}
            </Link>
          </p>
        ) : null}
        {shouldShowStripeTestBadge() ? (
          <p className="mt-2 type-caption text-muted-foreground">Stripe Test Mode</p>
        ) : null}
      </div>

      <section className="grid gap-3 rounded-lg border border-border bg-[var(--admin-surface)] p-6">
        <h3 className="type-h3">Cliente</h3>
        <p className="type-body">{order.customerName}</p>
        <p className="type-body-sm text-muted-foreground">{order.customerEmail}</p>
        <p className="type-body-sm text-muted-foreground">{order.customerPhone ?? "—"}</p>
      </section>

      <section className="grid gap-3 rounded-lg border border-border bg-[var(--admin-surface)] p-6">
        <h3 className="type-h3">Productos</h3>
        {order.items.map((item, index) => (
          <div key={`${item.productName}-${index}`}>
            <p className="type-body">
              {item.quantity} × {item.productName}
            </p>
            {item.options.map((option) => (
              <p key={`${option.groupName}-${option.optionName}`} className="type-body-sm text-muted-foreground">
                {option.groupName}: {option.optionName}
              </p>
            ))}
            <p className="type-body-sm tabular-nums">
              {formatMoneyFromMinorUnits(item.lineTotalMinor, "MXN", "es-MX")}
            </p>
          </div>
        ))}
        <p className="type-body tabular-nums">
          Subtotal: {formatMoneyFromMinorUnits(order.itemsSubtotalMinor, "MXN", "es-MX")}
        </p>
        <p className="type-body tabular-nums">
          Entrega: {formatMoneyFromMinorUnits(order.deliveryFeeMinor, "MXN", "es-MX")}
        </p>
        {order.promotionDiscountMinor > 0 ? (
          <p className="type-body tabular-nums">
            Promoción{order.promotionCodeSnapshot ? ` ${order.promotionCodeSnapshot}` : ""}
            {order.promotionLabelSnapshot ? ` · ${order.promotionLabelSnapshot}` : ""}
            : −{formatMoneyFromMinorUnits(order.promotionDiscountMinor, "MXN", "es-MX")}
          </p>
        ) : null}
        <p className="type-h3 tabular-nums">
          Total: {formatMoneyFromMinorUnits(order.grandTotalMinor, "MXN", "es-MX")}
        </p>
      </section>

      {order.promotionDiscountMinor > 0 || order.promotionId ? (
        <section className="grid gap-3 rounded-lg border border-border bg-[var(--admin-surface)] p-6">
          <h3 className="type-h3">Promoción (snapshot)</h3>
          <p className="type-body">{order.promotionLabelSnapshot ?? "—"}</p>
          <p className="type-body-sm text-muted-foreground">Código: {order.promotionCodeSnapshot ?? "—"}</p>
          <p className="type-body-sm text-muted-foreground">Beneficio: {order.promotionBenefitType ?? "—"}</p>
          <p className="type-body-sm tabular-nums">
            Descuento: {formatMoneyFromMinorUnits(order.promotionDiscountMinor, "MXN", "es-MX")}
          </p>
          <p className="type-body-sm tabular-nums">
            Subtotal elegible:{" "}
            {order.promotionEligibleSubtotalMinor != null
              ? formatMoneyFromMinorUnits(order.promotionEligibleSubtotalMinor, "MXN", "es-MX")
              : "—"}
          </p>
          <p className="type-body-sm text-muted-foreground">
            Reserva/redención: {order.promotionReservationStatus ?? "—"}
          </p>
        </section>
      ) : null}

      <section className="grid gap-3 rounded-lg border border-border bg-[var(--admin-surface)] p-6">
        <h3 className="type-h3">Fulfillment</h3>
        <p className="type-body">{order.fulfillmentMethod}</p>
        <p className="type-body-sm text-muted-foreground">
          {order.requestedDate} · {order.timeWindowStart}–{order.timeWindowEnd}
        </p>
        <p className="type-body-sm text-muted-foreground">
          {order.deliveryZoneName ?? order.pickupLocationName ?? "—"}
        </p>
        {order.address ? (
          <p className="type-body-sm text-muted-foreground">
            {[order.address.street, order.address.city, order.address.postalCode].filter(Boolean).join(", ")}
          </p>
        ) : null}
        <p className="type-body">Estado: {order.fulfillmentStatus}</p>
        {order.status === "PAID" && nextStatuses.length > 0
          ? nextStatuses.map((status) => (
              <form key={status} action={updateOrderFulfillmentStatus}>
                <input type="hidden" name="orderId" value={order.id} />
                <input type="hidden" name="fulfillmentStatus" value={status} />
                <Button type="submit" variant="secondary" size="sm">
                  Pasar a {status}
                </Button>
              </form>
            ))
          : null}
      </section>

      <section className="grid gap-3 rounded-lg border border-border bg-[var(--admin-surface)] p-6">
        <h3 className="type-h3">Pago</h3>
        <p className="type-body">{order.paymentStatus}</p>
        <p className="type-body">Pedido: {order.status}</p>
        <p className="type-body-sm text-muted-foreground">Pagado: {formatAdminDate(order.paidAt)}</p>
        <p className="type-body-sm text-muted-foreground">
          PaymentIntent: {order.stripePaymentIntentId ?? "—"}
        </p>
      </section>

      <section className="grid gap-3 rounded-lg border border-border bg-[var(--admin-surface)] p-6">
        <h3 className="type-h3">Timeline</h3>
        {order.events.length === 0 ? (
          <p className="type-body-sm text-muted-foreground">Sin eventos.</p>
        ) : (
          <ol className="grid gap-2">
            {order.events.map((event) => (
              <li key={`${event.type}-${event.createdAt}`} className="type-body-sm">
                {formatAdminDate(event.createdAt)} · {event.type}
              </li>
            ))}
          </ol>
        )}
      </section>

      {canCancelPaid ? (
        <section className="grid gap-3 rounded-lg border border-border bg-[var(--admin-surface)] p-6">
          <h3 className="type-h3">Cancelar pedido pagado</h3>
          <p className="type-body-sm text-destructive">
            Esta acción no genera reembolso automático. Los reembolsos requieren un módulo posterior.
          </p>
          <form action={cancelPaidOrderByAdmin} className="grid gap-3">
            <input type="hidden" name="orderId" value={order.id} />
            <label className="flex items-center gap-2 type-body-sm">
              <input type="checkbox" name="confirmNoRefund" value="1" required />
              Entiendo que no hay reembolso automático.
            </label>
            <Button type="submit" variant="destructive" size="sm">
              Cancelar pedido
            </Button>
          </form>
        </section>
      ) : null}
    </div>
  );
}
