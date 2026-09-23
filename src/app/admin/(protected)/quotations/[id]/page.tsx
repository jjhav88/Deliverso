import Link from "next/link";
import { notFound } from "next/navigation";
import { QuotationWorkspace } from "@/modules/admin/components/quotation-workspace";
import { getAdminQuotation, listQuoteFulfillmentOptions } from "@/modules/quotations/admin-queries";
import { quotationStatusLabel } from "@/modules/quotations/domain/labels";
import { formatMoneyFromMinorUnits } from "@/lib/money/format";

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function AdminQuotationDetailPage({ params }: PageProps) {
  const { id } = await params;
  const [quote, options] = await Promise.all([getAdminQuotation(id), listQuoteFulfillmentOptions()]);
  if (!quote) {
    notFound();
  }

  return (
    <div className="flex flex-col gap-8">
      <div>
        <Link href="/admin/quotations" className="type-caption text-secondary">
          ← Cotizaciones
        </Link>
        <h2 className="type-h2 mt-4">{quote.quoteNumber}</h2>
        <p className="mt-2 type-body text-muted-foreground">
          {quotationStatusLabel(quote.status)} · {quote.productNameSnapshot}
        </p>
        {quote.order ? (
          <p className="mt-2 type-body-sm">
            Pedido{" "}
            <Link href={`/admin/orders/${quote.order.id}`} className="text-secondary hover:underline">
              {quote.order.orderNumber}
            </Link>
          </p>
        ) : null}
      </div>

      <section className="grid gap-2 rounded-lg border border-border bg-[var(--admin-surface)] p-6">
        <h3 className="type-h3">Cliente</h3>
        <p className="type-body">{quote.customerNameSnapshot}</p>
        <p className="type-body-sm text-muted-foreground">{quote.customerEmailSnapshot}</p>
        <p className="type-body-sm text-muted-foreground">{quote.customerPhoneSnapshot ?? "—"}</p>
      </section>

      <section className="grid gap-2 rounded-lg border border-border bg-[var(--admin-surface)] p-6">
        <h3 className="type-h3">Solicitud</h3>
        {quote.requestTitle ? <p className="type-body">{quote.requestTitle}</p> : null}
        <p className="type-body whitespace-pre-wrap">{quote.requestDescription}</p>
        <p className="type-body-sm text-muted-foreground">
          Evento: {quote.eventDate ? new Date(quote.eventDate).toLocaleDateString("es-MX") : "—"} ·
          Personas: {quote.guestCount ?? "—"}
        </p>
      </section>

      {quote.attachments.length > 0 ? (
        <section className="grid gap-3 rounded-lg border border-border bg-[var(--admin-surface)] p-6">
          <h3 className="type-h3">Referencias</h3>
          <ul className="grid gap-4 sm:grid-cols-2">
            {quote.attachments.map((item) => (
              <li key={item.id}>
                {item.url ? (
                  <a href={item.url} target="_blank" rel="noreferrer">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={item.url} alt={item.fileName} className="max-h-56 w-full rounded-md object-cover" />
                  </a>
                ) : (
                  <p className="type-caption">{item.fileName}</p>
                )}
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {quote.offers.length > 0 ? (
        <section className="grid gap-3 rounded-lg border border-border bg-[var(--admin-surface)] p-6">
          <h3 className="type-h3">Ofertas</h3>
          {quote.offers.map((offer) => (
            <p key={offer.id} className="type-body-sm">
              v{offer.version}
              {quote.activeOfferId === offer.id ? " · activa" : ""}
              {offer.supersededAt ? " · reemplazada" : ""} ·{" "}
              {formatMoneyFromMinorUnits(offer.totalMinor, "MXN", "es-MX")} · {offer.fulfillmentMethod}
            </p>
          ))}
        </section>
      ) : null}

      {quote.messages.length > 0 ? (
        <section className="grid gap-3 rounded-lg border border-border bg-[var(--admin-surface)] p-6">
          <h3 className="type-h3">Mensajes</h3>
          {quote.messages.map((item) => (
            <p key={item.id} className="type-body-sm whitespace-pre-wrap">
              {item.authorType}: {item.message}
            </p>
          ))}
        </section>
      ) : null}

      <section className="grid gap-3 rounded-lg border border-border bg-[var(--admin-surface)] p-6">
        <h3 className="type-h3">Timeline</h3>
        {quote.events.map((event) => (
          <p key={event.id} className="type-caption">
            {new Date(event.createdAt).toLocaleString("es-MX")} · {event.type}
          </p>
        ))}
      </section>

      <QuotationWorkspace
        quotationId={quote.id}
        status={quote.status}
        notes={quote.adminInternalNotes ?? ""}
        pickups={options.pickups.map((item) => ({ id: item.id, name: item.name }))}
        zones={options.zones.map((item) => ({ id: item.id, name: item.name }))}
      />
    </div>
  );
}
