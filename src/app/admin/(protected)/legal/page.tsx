import { AdminLegalWorkspace } from "@/modules/legal/components/admin-legal-workspace";
import { listLegalDocumentsForAdmin } from "@/modules/legal/queries";

export default async function AdminLegalPage() {
  const documents = await listLegalDocumentsForAdmin();
  return <AdminLegalWorkspace documents={documents} />;
}
