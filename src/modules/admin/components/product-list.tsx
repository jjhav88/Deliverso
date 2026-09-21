import Image from "next/image";
import Link from "next/link";
import { buttonClassName } from "@/components/ui/button";
import { DeleteProductDialog } from "@/modules/admin/components/delete-product-dialog";
import { ProductStatusBadge } from "@/modules/admin/components/product-status-badge";
import { formatMoney } from "@/lib/money";
import type { AdminProductListItem } from "@/modules/catalog/queries";

const typeLabels = {
  STANDARD: "Estándar",
  CONFIGURABLE: "Configurable",
  CUSTOM_QUOTE: "Cotización",
} as const;

type ProductListProps = {
  items: AdminProductListItem[];
};

export function ProductList({ items }: ProductListProps) {
  return (
    <>
      <div className="mt-8 hidden overflow-x-auto rounded-lg border border-border bg-[var(--admin-surface)] md:block">
        <table className="w-full min-w-[52rem] text-left">
          <thead>
            <tr className="border-b border-border type-caption text-muted-foreground">
              <th className="px-4 py-3 font-medium">Imagen</th>
              <th className="px-4 py-3 font-medium">Producto</th>
              <th className="px-4 py-3 font-medium">Tipo</th>
              <th className="px-4 py-3 font-medium">Precio</th>
              <th className="px-4 py-3 font-medium">Línea</th>
              <th className="px-4 py-3 font-medium">Estado</th>
              <th className="px-4 py-3 font-medium">Actualizado</th>
              <th className="px-4 py-3 font-medium">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item) => (
              <tr key={item.id} className="border-b border-border last:border-b-0">
                <td className="px-4 py-3">
                  <div className="relative h-14 w-11 overflow-hidden rounded bg-muted">
                    {item.imageUrl ? (
                      <Image
                        src={item.imageUrl}
                        alt=""
                        fill
                        className="object-cover"
                        sizes="44px"
                      />
                    ) : null}
                  </div>
                </td>
                <td className="px-4 py-3 type-body">{item.name}</td>
                <td className="px-4 py-3 type-caption">{typeLabels[item.type]}</td>
                <td className="px-4 py-3 type-caption tabular-nums">
                  {item.priceMinor === null
                    ? "Cotización"
                    : formatMoney(
                        { amountMinor: item.priceMinor, currency: "MXN" },
                        "es-MX",
                      )}
                </td>
                <td className="px-4 py-3 type-caption">{item.businessLineName}</td>
                <td className="px-4 py-3">
                  <ProductStatusBadge status={item.status} />
                </td>
                <td className="px-4 py-3 type-caption">
                  {item.updatedAt.toLocaleDateString("es-MX")}
                </td>
                <td className="px-4 py-3">
                  <div className="flex flex-wrap items-center gap-3">
                    <Link
                      href={`/admin/products/${item.id}`}
                      className="type-label text-secondary hover:underline"
                    >
                      Editar
                    </Link>
                    <DeleteProductDialog
                      compact
                      productId={item.id}
                      productName={item.name}
                    />
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <ul className="mt-8 grid gap-4 md:hidden">
        {items.map((item) => (
          <li
            key={item.id}
            className="flex gap-3 rounded-lg border border-border bg-[var(--admin-surface)] p-4"
          >
            <div className="relative h-20 w-16 shrink-0 overflow-hidden rounded bg-muted">
              {item.imageUrl ? (
                <Image src={item.imageUrl} alt="" fill className="object-cover" sizes="64px" />
              ) : null}
            </div>
            <div className="min-w-0 flex-1">
              <p className="type-body">{item.name}</p>
              <p className="mt-1 type-caption text-muted-foreground">
                {typeLabels[item.type]} · {item.businessLineName}
              </p>
              <div className="mt-2">
                <ProductStatusBadge status={item.status} />
              </div>
              <div className="mt-2 flex flex-wrap items-center gap-3">
                <Link
                  href={`/admin/products/${item.id}`}
                  className={buttonClassName({
                    variant: "ghost",
                    size: "sm",
                    className: "px-0",
                  })}
                >
                  Editar
                </Link>
                <DeleteProductDialog
                  compact
                  productId={item.id}
                  productName={item.name}
                />
              </div>
            </div>
          </li>
        ))}
      </ul>
    </>
  );
}
