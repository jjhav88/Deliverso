import { HomeCmsForm } from "@/modules/admin/components/home-cms-form";
import { getHomeAdminState } from "@/modules/home/admin-queries";
import { listAdminMedia } from "@/modules/media/queries";

export default async function AdminHomePage() {
  const [initial, media] = await Promise.all([
    getHomeAdminState(),
    listAdminMedia(),
  ]);

  return (
    <HomeCmsForm
      initial={initial}
      media={media.map((item) => ({
        id: item.id,
        publicUrl: item.publicUrl,
        originalFilename: item.originalFilename,
      }))}
    />
  );
}
