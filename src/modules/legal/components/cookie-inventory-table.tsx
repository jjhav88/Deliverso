import { cookieInventory } from "@/modules/legal/domain/cookie-inventory";

export function CookieInventoryTable() {
  return (
    <section className="mt-12" aria-labelledby="inventario-cookies">
      <h2 id="inventario-cookies" className="type-h2">
        Inventario
      </h2>
      <div className="mt-4 overflow-x-auto">
        <table className="w-full min-w-[40rem] border-collapse text-left type-body-sm">
          <thead>
            <tr>
              <th className="border-b border-border px-3 py-2">Nombre</th>
              <th className="border-b border-border px-3 py-2">Proveedor</th>
              <th className="border-b border-border px-3 py-2">Finalidad</th>
              <th className="border-b border-border px-3 py-2">Duración</th>
              <th className="border-b border-border px-3 py-2">Tipo</th>
            </tr>
          </thead>
          <tbody>
            {cookieInventory.map((item) => (
              <tr key={item.name}>
                <td className="border-b border-border px-3 py-2">{item.name}</td>
                <td className="border-b border-border px-3 py-2">{item.provider}</td>
                <td className="border-b border-border px-3 py-2 text-muted-foreground">
                  {item.purpose}
                </td>
                <td className="border-b border-border px-3 py-2">{item.duration}</td>
                <td className="border-b border-border px-3 py-2">Esencial</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
