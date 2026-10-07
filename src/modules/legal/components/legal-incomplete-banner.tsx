import Link from "next/link";
import { legalFieldLabels } from "@/modules/legal/domain/readiness";
import type { LegalReadiness } from "@/modules/legal/domain/types";

export function LegalIncompleteBanner({ readiness }: { readiness: LegalReadiness }) {
  if (readiness.status === "READY") {
    return null;
  }

  return (
    <div
      role="status"
      className="mb-6 rounded-md border border-border bg-muted px-4 py-3"
    >
      <p className="type-label tracking-[0.12em]">Configuración legal incompleta</p>
      <p className="mt-2 type-body-sm">
        Falta identidad del responsable. El storefront no se bloquea, pero los textos legales
        marcan esos campos como pendientes.
      </p>
      <ul className="mt-2 list-disc pl-5 type-body-sm">
        {readiness.missing.map((field) => (
          <li key={field}>{legalFieldLabels[field]}</li>
        ))}
      </ul>
      <p className="mt-2 type-body-sm">
        Completa los datos en{" "}
        <Link href="/admin/settings" className="underline underline-offset-4">
          Configuración
        </Link>
        .
      </p>
    </div>
  );
}
