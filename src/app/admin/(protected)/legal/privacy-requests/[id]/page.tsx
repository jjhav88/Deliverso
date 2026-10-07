import { notFound } from "next/navigation";
import { AdminPrivacyRequestReview } from "@/modules/legal/components/admin-privacy-requests";
import { getPrivacyRequestForAdmin } from "@/modules/legal/queries";

export default async function AdminPrivacyRequestDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const request = await getPrivacyRequestForAdmin(id);
  if (!request) {
    notFound();
  }
  return (
    <div className="mx-auto max-w-3xl">
      <h2 className="type-h2">Revisar solicitud</h2>
      <div className="mt-8">
        <AdminPrivacyRequestReview request={request} />
      </div>
    </div>
  );
}
