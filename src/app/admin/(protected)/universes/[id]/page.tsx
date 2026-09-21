import { notFound } from "next/navigation";
import { UniverseForm } from "@/modules/admin/components/universe-form";
import { getAdminUniverse } from "@/modules/catalog/queries";
import { listAdminMedia } from "@/modules/media/queries";

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function AdminUniverseEditPage({ params }: PageProps) {
  const { id } = await params;
  const [item, media] = await Promise.all([
    getAdminUniverse(id),
    listAdminMedia(),
  ]);

  if (!item) {
    notFound();
  }

  return (
    <UniverseForm
      initial={item}
      media={media.map((entry) => ({
        id: entry.id,
        publicUrl: entry.publicUrl,
        originalFilename: entry.originalFilename,
      }))}
    />
  );
}
