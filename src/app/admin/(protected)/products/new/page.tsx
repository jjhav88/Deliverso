import { CatalogSubnav } from "@/modules/admin/components/catalog-subnav";
import { ProductForm } from "@/modules/admin/components/product-form";
import { listAdminMedia } from "@/modules/media/queries";
import {
  emptyProductFormState,
  listBusinessLineOptions,
  listCategoryOptions,
  listUniverseOptions,
} from "@/modules/catalog/queries";

export default async function AdminProductNewPage() {
  const [media, businessLines, categories, universes] = await Promise.all([
    listAdminMedia(),
    listBusinessLineOptions(),
    listCategoryOptions(),
    listUniverseOptions(),
  ]);

  return (
    <div className="flex flex-col gap-8">
      <CatalogSubnav pathname="/admin/products/new" />
      <ProductForm
        initial={emptyProductFormState()}
        businessLines={businessLines}
        categories={categories}
        universes={universes}
        media={media.map((item) => ({
          id: item.id,
          publicUrl: item.publicUrl,
          originalFilename: item.originalFilename,
        }))}
      />
    </div>
  );
}
