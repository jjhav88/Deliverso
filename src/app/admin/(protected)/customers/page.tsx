import Link from "next/link";
import { listAdminCustomers } from "@/modules/admin/customers/queries";

function formatAdminDate(value: Date | null) {
  if (!value) {
    return "—";
  }
  return new Intl.DateTimeFormat("es-MX", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(value);
}

export default async function AdminCustomersPage() {
  const customers = await listAdminCustomers();

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h2 className="type-h2">Clientes</h2>
        <p className="mt-2 max-w-2xl type-body text-muted-foreground">
          Cuentas de tienda. Las contraseñas viven en Supabase Auth y no se
          muestran aquí.
        </p>
      </div>

      {customers.length === 0 ? (
        <p className="type-body text-muted-foreground">Todavía no hay clientes.</p>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-border bg-[var(--admin-surface)]">
          <table className="w-full min-w-[44rem] text-left">
            <thead>
              <tr className="border-b border-border type-caption text-muted-foreground">
                <th className="px-4 py-3 font-medium">Correo</th>
                <th className="px-4 py-3 font-medium">Nombre</th>
                <th className="px-4 py-3 font-medium">Estado</th>
                <th className="px-4 py-3 font-medium">Registro</th>
                <th className="px-4 py-3 font-medium">Último acceso</th>
              </tr>
            </thead>
            <tbody>
              {customers.map((customer) => (
                <tr key={customer.id} className="border-b border-border last:border-b-0">
                  <td className="px-4 py-3">
                    <Link href={`/admin/customers/${customer.id}`} className="text-secondary">
                      {customer.email}
                    </Link>
                  </td>
                  <td className="px-4 py-3">{customer.displayName ?? "—"}</td>
                  <td className="px-4 py-3">{customer.status}</td>
                  <td className="px-4 py-3">{formatAdminDate(customer.createdAt)}</td>
                  <td className="px-4 py-3">{formatAdminDate(customer.lastLoginAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
