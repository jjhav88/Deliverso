import { UniverseForm } from "@/modules/admin/components/universe-form";
import { listAdminMedia } from "@/modules/media/queries";

export default async function AdminUniverseNewPage() {
  const media = await listAdminMedia();

  return (
    <UniverseForm
      initial={{
        id: null,
        isActive: true,
        sortOrder: 0,
        featuredMediaAssetId: null,
        featuredMediaUrl: null,
        es: { name: "", slug: "", description: "" },
        en: { name: "", slug: "", description: "" },
      }}
      media={media.map((item) => ({
        id: item.id,
        publicUrl: item.publicUrl,
        originalFilename: item.originalFilename,
      }))}
    />
  );
}
