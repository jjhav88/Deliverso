import { AdminPrivacyRequestTable } from "@/modules/legal/components/admin-privacy-requests";
import { listPrivacyRequestsForAdmin } from "@/modules/legal/queries";

export default async function AdminPrivacyRequestsPage() {
  const requests = await listPrivacyRequestsForAdmin();
  return (
    <div className="mx-auto max-w-5xl">
      <h2 className="type-h2">Solicitudes de privacidad (ARCO)</h2>
      <p className="mt-2 max-w-2xl type-body text-muted-foreground">
        Recibida → revisión → verificación de identidad → resolución manual. No se entregan
        expedientes automáticos.
      </p>
      <div className="mt-8">
        <AdminPrivacyRequestTable requests={requests} />
      </div>
    </div>
  );
}
