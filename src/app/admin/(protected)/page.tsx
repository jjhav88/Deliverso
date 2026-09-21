import { DashboardCard } from "@/modules/admin/components/dashboard-card";
import { countCatalogDashboard } from "@/modules/catalog/queries";
import { getHomeAdminState } from "@/modules/home/admin-queries";
import { countAdminMedia } from "@/modules/media/queries";
import { getSettingsAdminState } from "@/modules/settings/queries";

export default async function AdminDashboardPage() {
  const [home, mediaCount, settings, catalog] = await Promise.all([
    getHomeAdminState(),
    countAdminMedia(),
    getSettingsAdminState(),
    countCatalogDashboard(),
  ]);

  return (
    <div className="mx-auto max-w-5xl">
      <p className="type-label tracking-[0.18em] text-secondary">DELIVERSO Admin</p>
      <h2 className="mt-3 type-h2 text-pretty">Bienvenido a DELIVERSO Admin</h2>
      <p className="mt-3 max-w-2xl type-body text-muted-foreground">
        Productos: {catalog.products}. Publicados: {catalog.published}.
        Universos: {catalog.universes}. Media: {mediaCount}.
      </p>

      <div className="mt-10 grid grid-cols-1 gap-5 md:grid-cols-2">
        <DashboardCard
          href="/admin/home"
          title="Gestionar Inicio"
          description="Hero, copy y visibilidad de secciones."
          status={home.configured ? "Configurado" : "Sin configurar"}
        />
        <DashboardCard
          href="/admin/media"
          title="Biblioteca de Media"
          description="Fotografías reutilizables para el storefront."
          status={`${mediaCount} ${mediaCount === 1 ? "imagen" : "imágenes"}`}
        />
        <DashboardCard
          href="/admin/settings"
          title="Configuración"
          description="Correo, WhatsApp, dirección y redes sociales."
          status={settings.configured ? "Configurado" : "Pendiente"}
        />
        <DashboardCard
          href="/admin/products"
          title="Catálogo"
          description={`${catalog.products} productos · ${catalog.published} publicados.`}
          status={`${catalog.universes} universos`}
        />
      </div>
    </div>
  );
}
