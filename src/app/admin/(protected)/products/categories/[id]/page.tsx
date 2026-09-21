import { notFound } from "next/navigation";
import { CatalogSubnav } from "@/modules/admin/components/catalog-subnav";
import { TaxonomyForm } from "@/modules/admin/components/taxonomy-form";
import {
  getAdminCategory,
  listBusinessLineOptions,
} from "@/modules/catalog/queries";
import { saveCategoryAction } from "@/modules/catalog/taxonomy-actions";

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function AdminCategoryEditPage({ params }: PageProps) {
  const { id } = await params;
  const [item, businessLines] = await Promise.all([
    getAdminCategory(id),
    listBusinessLineOptions(),
  ]);
  if (!item) {
    notFound();
  }

  return (
    <div className="flex flex-col gap-8">
      <CatalogSubnav pathname="/admin/products/categories" />
      <TaxonomyForm
        title="Editar categoría"
        action={saveCategoryAction}
        businessLines={businessLines}
        initial={{
          id: item.id,
          isActive: item.isActive,
          sortOrder: item.sortOrder,
          businessLineId: item.businessLineId,
          es: item.es,
          en: item.en,
        }}
      />
    </div>
  );
}
