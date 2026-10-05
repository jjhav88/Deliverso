import Link from "next/link";
import { notFound } from "next/navigation";
import { getAdminOrderDetail } from "@/modules/admin/orders/queries";
import { getAdminOrderFinance } from "@/modules/cancellations/queries";
import {
  AdminCancelPaidForm,
  AdminCancelPendingForm,
  AdminRefundForm,
  AdminReviewCancellationForm,
} from "@/modules/cancellations/components/admin-refund-form";
import {
  cancellationStatusLabel,
  financialStatusLabel,
  refundReasonLabel,
  refundStatusLabel,
} from "@/modules/cancellations/domain/labels";
import { fulfillmentStatusLabel } from "@/modules/orders/domain/labels";
import { FulfillmentTransitionActions } from "@/modules/operations/components/fulfillment-transition-actions";
import { getAllowedFulfillmentTransitions } from "@/modules/operations/domain/transitions";
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
  const [order, finance] = await Promise.all([getAdminOrderDetail(id), getAdminOrderFinance(id)]);
  if (!order) {
    notFound();
  }

  const nextStatuses = getAllowedFulfillmentTransitions({
    status: order.status,
    paymentStatus: order.paymentStatus,
    fulfillmentStatus: order.fulfillmentStatus,
    fulfillmentMethod: order.fulfillmentMethod,
  });
  const failedRefund = finance?.refunds.find((row) => row.status === "FAILED");

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
        {finance && finance.refundedAmountMinor > 0 ? (
          <>
            <p className="type-body tabular-nums">
              Reembolsado: −{formatMoneyFromMinorUnits(finance.refundedAmountMinor, "MXN", "es-MX")}
            </p>
            <p className="type-body tabular-nums">
              Neto: {formatMoneyFromMinorUnits(finance.netPaidMinor, "MXN", "es-MX")}
            </p>
          </>
        ) : null}
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
        <p className="type-body">Estado: {fulfillmentStatusLabel(order.fulfillmentStatus)}</p>
        <FulfillmentTransitionActions
          orderId={order.id}
          method={order.fulfillmentMethod}
          transitions={nextStatuses}
        />
      </section>

      <section className="grid gap-3 rounded-lg border border-border bg-[var(--admin-surface)] p-6">
        <h3 className="type-h3">Pago</h3>
        <p className="type-body">{order.paymentStatus}</p>
        <p className="type-body">Pedido: {order.status}</p>
        <p className="type-body">
          Estado financiero: {finance ? financialStatusLabel(finance.financialStatus) : "—"}
        </p>
        <p className="type-body-sm text-muted-foreground">Pagado: {formatAdminDate(order.paidAt)}</p>
        <p className="type-body-sm text-muted-foreground">
          PaymentIntent: {order.stripePaymentIntentId ?? "—"}
        </p>
      </section>

      {finance ? (
        <section className="grid gap-3 rounded-lg border border-border bg-[var(--admin-surface)] p-6">
          <h3 className="type-h3">Refunds</h3>
          {finance.refunds.length === 0 ? (
            <p className="type-body-sm text-muted-foreground">Sin reembolsos.</p>
          ) : (
            <ol className="grid gap-2">
              {finance.refunds.map((refund) => (
                <li key={refund.id} className="type-body-sm">
                  {formatAdminDate(refund.createdAt)} · {refund.type} · {refundStatusLabel(refund.status)} ·{" "}
                  {formatMoneyFromMinorUnits(refund.amountMinor, "MXN", "es-MX")} ·{" "}
                  {refundReasonLabel(refund.reason)}
                  {refund.stripeRefundId ? ` · ${refund.stripeRefundId}` : ""}
                  {refund.providerFailureMessage ? ` · ${refund.providerFailureMessage}` : ""}
                </li>
              ))}
            </ol>
          )}
        </section>
      ) : null}

      {finance && finance.requests.length > 0 ? (
        <section className="grid gap-3 rounded-lg border border-border bg-[var(--admin-surface)] p-6">
          <h3 className="type-h3">Solicitud de cancelación</h3>
          {finance.requests.map((request) => (
            <div key={request.id} className="grid gap-2">
              <p className="type-body">
                {cancellationStatusLabel(request.status)} · {refundReasonLabel(request.reason)}
              </p>
              <p className="type-body-sm text-muted-foreground">
                {formatAdminDate(request.createdAt)}
                {request.customerMessage ? ` · ${request.customerMessage}` : ""}
              </p>
              {request.status === "REQUESTED" ? (
                <AdminReviewCancellationForm
                  requestId={request.id}
                  canReview
                  refundableMinor={finance.refundableMinor}
                />
              ) : null}
            </div>
          ))}
        </section>
      ) : null}

      {finance?.canRefund ? (
        <AdminRefundForm
          orderId={order.id}
          paidMinor={order.grandTotalMinor}
          refundedMinor={finance.refundedAmountMinor}
          refundableMinor={finance.refundableMinor}
          canRefund={finance.canRefund}
          failedRefundId={failedRefund?.id}
        />
      ) : failedRefund ? (
        <AdminRefundForm
          orderId={order.id}
          paidMinor={order.grandTotalMinor}
          refundedMinor={finance?.refundedAmountMinor ?? 0}
          refundableMinor={finance?.refundableMinor ?? 0}
          canRefund={false}
          failedRefundId={failedRefund.id}
        />
      ) : null}

      {finance?.canCancelPaid ? (
        <AdminCancelPaidForm orderId={order.id} refundableMinor={finance.refundableMinor} />
      ) : null}
      {finance?.canCancelPending ? <AdminCancelPendingForm orderId={order.id} /> : null}

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

    </div>
  );
}
