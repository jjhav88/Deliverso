import { CatalogSubnav } from "@/modules/admin/components/catalog-subnav";
import { TaxonomyForm } from "@/modules/admin/components/taxonomy-form";
import { saveBusinessLineAction } from "@/modules/catalog/taxonomy-actions";

export default function AdminBusinessLineNewPage() {
  return (
    <div className="flex flex-col gap-8">
      <CatalogSubnav pathname="/admin/products/business-lines" />
      <TaxonomyForm
        title="Nueva línea de negocio"
        action={saveBusinessLineAction}
        initial={{
          id: null,
          isActive: true,
          sortOrder: 0,
          es: { name: "", slug: "", description: "" },
          en: { name: "", slug: "", description: "" },
        }}
      />
    </div>
  );
}
