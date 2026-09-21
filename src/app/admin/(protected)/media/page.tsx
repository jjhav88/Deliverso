import { MediaLibrary } from "@/modules/admin/components/media-library";
import { listAdminMedia } from "@/modules/media/queries";

export default async function AdminMediaPage() {
  const items = await listAdminMedia();

  return (
    <MediaLibrary
      items={items.map((item) => ({
        ...item,
        createdAt: item.createdAt.toISOString(),
      }))}
    />
  );
}
