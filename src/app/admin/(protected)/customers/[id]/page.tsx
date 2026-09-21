import Link from "next/link";
import { notFound } from "next/navigation";
import { Button } from "@/components/ui/button";
import { setCustomerStatusAction } from "@/modules/admin/customers/actions";
import { getAdminCustomer } from "@/modules/admin/customers/queries";

function formatAdminDate(value: Date | null) {
  if (!value) {
    return "—";
  }
  return new Intl.DateTimeFormat("es-MX", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(value);
}

type PageProps = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ ok?: string }>;
};

export default async function AdminCustomerDetailPage({
  params,
  searchParams,
}: PageProps) {
  const { id } = await params;
  const query = await searchParams;
  const customer = await getAdminCustomer(id);
  if (!customer) {
    notFound();
  }

  const activeCart = customer.carts[0] ?? null;
  const nextStatus = customer.status === "ACTIVE" ? "BLOCKED" : "ACTIVE";

  return (
    <div className="flex flex-col gap-8">
      <div>
        <Link href="/admin/customers" className="type-caption text-secondary">
          ← Clientes
        </Link>
        <h2 className="type-h2 mt-4">{customer.email}</h2>
        <p className="mt-2 type-body text-muted-foreground">
          Perfil operativo. El correo autenticado vive en Supabase Auth.
        </p>
      </div>

      {query.ok === "status" ? (
        <p role="status" className="type-caption text-secondary">
          Estado actualizado.
        </p>
      ) : null}

      <section className="grid gap-3 rounded-lg border border-border bg-[var(--admin-surface)] p-6">
        <h3 className="type-h3">Perfil</h3>
        <p className="type-body">Nombre: {customer.displayName ?? "—"}</p>
        <p className="type-body">Teléfono: {customer.phone ?? "—"}</p>
        <p className="type-body">Estado: {customer.status}</p>
        <p className="type-body">Registro: {formatAdminDate(customer.createdAt)}</p>
        <p className="type-body">Último acceso: {formatAdminDate(customer.lastLoginAt)}</p>
        <p className="type-body">
          Términos: {formatAdminDate(customer.termsAcceptedAt)}
        </p>
        <p className="type-body">
          Privacidad: {formatAdminDate(customer.privacyAcceptedAt)}
        </p>
        <form action={setCustomerStatusAction} className="mt-4">
          <input type="hidden" name="id" value={customer.id} />
          <input type="hidden" name="status" value={nextStatus} />
          <Button type="submit" variant={nextStatus === "BLOCKED" ? "destructive" : "secondary"}>
            {nextStatus === "BLOCKED" ? "Bloquear" : "Reactivar"}
          </Button>
        </form>
      </section>

      <section className="grid gap-3 rounded-lg border border-border bg-[var(--admin-surface)] p-6">
        <h3 className="type-h3">Carrito activo</h3>
        {activeCart ? (
          <p className="type-body">
            {activeCart._count.items} artículo(s). Actualizado{" "}
            {formatAdminDate(activeCart.updatedAt)}.
          </p>
        ) : (
          <p className="type-body text-muted-foreground">Sin carrito activo.</p>
        )}
      </section>

      <section className="grid gap-3 rounded-lg border border-border bg-[var(--admin-surface)] p-6">
        <h3 className="type-h3">Pedidos</h3>
        <p className="type-body text-muted-foreground">
          Disponible cuando exista Order.
        </p>
      </section>
    </div>
  );
}
