import { Link } from "@/i18n/navigation";
import { Container } from "@/components/layout/container";
import { Section } from "@/components/layout/section";
import { LegalBody } from "@/modules/legal/components/legal-body";
import { interpolateLegalBody } from "@/modules/legal/domain/interpolate";
import { getLegalReadiness } from "@/modules/legal/domain/readiness";
import type { LegalDocumentType } from "@/modules/legal/domain/types";
import {
  getLegalIdentity,
  getPublishedLegalDocument,
} from "@/modules/legal/queries";
import type { ReactNode } from "react";

export async function LegalPublicPage({
  type,
  locale,
  extra,
}: {
  type: LegalDocumentType;
  locale: string;
  extra?: ReactNode;
}) {
  const [document, identity] = await Promise.all([
    getPublishedLegalDocument(type),
    getLegalIdentity(),
  ]);
  const readiness = getLegalReadiness(identity);
  const isEnglish = locale === "en-US";

  if (!document) {
    return (
      <Section>
        <Container>
          <h1 className="type-display-l">Documento no disponible</h1>
          <p className="type-body mt-4 text-muted-foreground">
            Aún no hay una versión publicada de este documento.
          </p>
        </Container>
      </Section>
    );
  }

  const effective = document.effectiveAt.toISOString().slice(0, 10);
  const updated = document.updatedAt.toISOString().slice(0, 10);

  return (
    <Section>
      <Container className="max-w-4xl">
        {isEnglish ? (
          <p role="note" className="mb-6 rounded-md border border-border bg-muted/50 p-4 type-body-sm">
            Informative translation is not published. The legally relevant Spanish text follows.
            It is not an equivalent English legal version.
          </p>
        ) : null}
        <p className="type-label tracking-[0.18em] text-secondary">DELIVERSO</p>
        <h1 className="type-display-l mt-3">{document.title}</h1>
        <p className="type-caption mt-4 text-muted-foreground">
          Versión {document.version} · Entrada en vigor {effective} · Última actualización {updated}
        </p>
        <p className="type-caption mt-2 text-muted-foreground print:hidden">
          Puedes imprimir esta página desde el navegador.
        </p>
        {readiness.status === "INCOMPLETE" ? (
          <p role="status" className="mt-6 rounded-md border border-border p-4 type-body-sm">
            La identificación completa del responsable (razón social, RFC, domicilio y contactos
            legales) está pendiente de publicación. Los campos faltantes se muestran como
            “pendiente de publicación” en el texto.
          </p>
        ) : null}
        <div className="mt-8">
          <LegalBody body={interpolateLegalBody(document.body, identity)} />
        </div>
        {extra}
        <p className="type-caption mt-12 text-muted-foreground">
          Borrador de cumplimiento técnico. La versión jurídica definitiva debe ser revisada por
          un asesor legal mexicano.{" "}
          <Link href="/privacidad/derechos-arco" className="text-secondary">
            Derechos ARCO
          </Link>
        </p>
      </Container>
    </Section>
  );
}
