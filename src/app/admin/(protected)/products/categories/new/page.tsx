import { CatalogSubnav } from "@/modules/admin/components/catalog-subnav";
import { TaxonomyForm } from "@/modules/admin/components/taxonomy-form";
import { listBusinessLineOptions } from "@/modules/catalog/queries";
import { saveCategoryAction } from "@/modules/catalog/taxonomy-actions";

export default async function AdminCategoryNewPage() {
  const businessLines = await listBusinessLineOptions();

  return (
    <div className="flex flex-col gap-8">
      <CatalogSubnav pathname="/admin/products/categories" />
      <TaxonomyForm
        title="Nueva categoría"
        action={saveCategoryAction}
        businessLines={businessLines}
        initial={{
          id: null,
          isActive: true,
          sortOrder: 0,
          businessLineId: "",
          es: { name: "", slug: "", description: "" },
          en: { name: "", slug: "", description: "" },
        }}
      />
    </div>
  );
}
