import { notFound } from "next/navigation";
import { CatalogSubnav } from "@/modules/admin/components/catalog-subnav";
import { TaxonomyForm } from "@/modules/admin/components/taxonomy-form";
import { getAdminBusinessLine } from "@/modules/catalog/queries";
import { saveBusinessLineAction } from "@/modules/catalog/taxonomy-actions";

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function AdminBusinessLineEditPage({ params }: PageProps) {
  const { id } = await params;
  const item = await getAdminBusinessLine(id);
  if (!item) {
    notFound();
  }

  return (
    <div className="flex flex-col gap-8">
      <CatalogSubnav pathname="/admin/products/business-lines" />
      <TaxonomyForm
        title="Editar línea de negocio"
        action={saveBusinessLineAction}
        initial={{
          id: item.id,
          isActive: item.isActive,
          sortOrder: item.sortOrder,
          es: item.es,
          en: item.en,
        }}
      />
    </div>
  );
}
