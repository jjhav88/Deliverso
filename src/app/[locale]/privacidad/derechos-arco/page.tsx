import type { Metadata } from "next";
import { hasLocale } from "next-intl";
import { setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import { Container } from "@/components/layout/container";
import { Section } from "@/components/layout/section";
import { routing } from "@/i18n/routing";
import { isAppLocale } from "@/config/i18n";
import { getPathname } from "@/i18n/navigation";
import { Link } from "@/i18n/navigation";
import { ArcoRequestForm } from "@/modules/legal/components/arco-request-form";
import { getLegalIdentity } from "@/modules/legal/queries";
import { getOptionalCustomer } from "@/modules/customer-auth/queries";
import { legalPageMetadata } from "@/modules/legal/legal-metadata";

export const dynamic = "force-dynamic";

type PageProps = {
  params: Promise<{ locale: string }>;
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale) || !isAppLocale(locale)) {
    return { robots: { index: false, follow: true } };
  }
  return legalPageMetadata({
    title: "Derechos ARCO",
    pathname: getPathname({ locale, href: "/privacidad/derechos-arco" }),
  });
}

export default async function ArcoRightsPage({ params }: PageProps) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale) || !isAppLocale(locale)) {
    notFound();
  }
  setRequestLocale(locale);
  const [identity, customer] = await Promise.all([getLegalIdentity(), getOptionalCustomer()]);
  const privacyEmail = identity.privacyEmail?.trim() || identity.contactEmail;

  return (
    <Section>
      <Container className="max-w-3xl">
        {locale === "en-US" ? (
          <p role="note" className="mb-6 rounded-md border border-border bg-muted/50 p-4 type-body-sm">
            The legally relevant explanation is in Spanish. This is not an equivalent English legal version.
          </p>
        ) : null}
        <p className="type-label tracking-[0.18em] text-secondary">Privacidad</p>
        <h1 className="type-display-l mt-3">Derechos ARCO</h1>
        <p className="type-body mt-6 max-w-2xl text-muted-foreground">
          Puedes solicitar Acceso, Rectificación, Cancelación u Oposición respecto de tus datos
          personales. La solicitud se recibe, se revisa y tu identidad se verifica de forma
          manual antes de entregar, corregir o cancelar información. No hay descarga automática.
        </p>
        <ul className="mt-6 max-w-2xl list-disc space-y-2 pl-6 type-body text-muted-foreground">
          <li>
            <strong>Acceso:</strong> conocer qué datos tratamos sobre ti.
          </li>
          <li>
            <strong>Rectificación:</strong> corregir datos inexactos o incompletos.
          </li>
          <li>
            <strong>Cancelación:</strong> solicitar que dejemos de tratar datos cuando proceda.
            Los pedidos históricos pueden conservarse por obligaciones operativas o legales.
          </li>
          <li>
            <strong>Oposición:</strong> oponerte a un tratamiento que no sea necesario para el
            servicio solicitado.
          </li>
        </ul>
        {privacyEmail ? (
          <p className="type-body-sm mt-6 text-muted-foreground">
            También puedes escribir a {privacyEmail}.
          </p>
        ) : (
          <p className="type-body-sm mt-6 text-muted-foreground">
            El correo de privacidad aún no está publicado. Usa este formulario; el equipo
            revisará la solicitud cuando la configuración legal esté completa.
          </p>
        )}
        <div className="mt-10">
          <ArcoRequestForm
            defaultEmail={customer?.email}
            labels={{
              type: "Tipo de solicitud",
              email: "Correo para contacto",
              message: "Describe tu solicitud",
              submit: "Enviar solicitud",
              verifyNote:
                "Enviar este formulario no entrega un expediente. Verificaremos tu identidad antes de resolver.",
            }}
          />
        </div>
        <p className="type-caption mt-10 text-muted-foreground">
          Consulta el{" "}
          <Link href="/aviso-de-privacidad" className="text-secondary">
            Aviso de Privacidad
          </Link>
          .
        </p>
      </Container>
    </Section>
  );
}
