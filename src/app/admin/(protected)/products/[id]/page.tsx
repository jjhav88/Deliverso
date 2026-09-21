import { notFound } from "next/navigation";
import { CatalogSubnav } from "@/modules/admin/components/catalog-subnav";
import { ProductForm } from "@/modules/admin/components/product-form";
import { ProductOptionsPanel } from "@/modules/admin/components/product-options-panel";
import { listAdminMedia } from "@/modules/media/queries";
import { getAdminProductOptionGroups } from "@/modules/catalog/option-queries";
import {
  getAdminProduct,
  listBusinessLineOptions,
  listCategoryOptions,
  listUniverseOptions,
} from "@/modules/catalog/queries";

const flashMessages: Record<string, string> = {
  created: "Producto creado.",
  published: "Producto publicado.",
};

type ProductFormPageProps = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ ok?: string }>;
};

export default async function AdminProductEditPage({
  params,
  searchParams,
}: ProductFormPageProps) {
  const { id } = await params;
  const { ok } = await searchParams;
  const [product, media, businessLines, categories, universes, optionGroups] =
    await Promise.all([
      getAdminProduct(id),
      listAdminMedia(),
      listBusinessLineOptions(),
      listCategoryOptions(),
      listUniverseOptions(),
      getAdminProductOptionGroups(id),
    ]);

  if (!product) {
    notFound();
  }

  return (
    <div className="flex flex-col gap-8">
      <CatalogSubnav pathname={`/admin/products/${id}`} />
      <ProductForm
        initial={product}
        businessLines={businessLines}
        categories={categories}
        universes={universes}
        flash={ok ? flashMessages[ok] ?? null : null}
        media={media.map((item) => ({
          id: item.id,
          publicUrl: item.publicUrl,
          originalFilename: item.originalFilename,
        }))}
      />
      {product.type === "CONFIGURABLE" ? (
        <ProductOptionsPanel productId={id} groups={optionGroups} />
      ) : null}
    </div>
  );
}
