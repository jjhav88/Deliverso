import { Button } from "@/components/ui/button";
import { isDevSandboxSendAllowed } from "@/server/email/env";
import { sendSandboxTemplateTest } from "@/modules/email/admin-actions";
import { emailTemplateTypes } from "@/modules/email/domain/types";
import { getEmailSubject } from "@/modules/email/domain/subjects";
import {
  sampleOrderVariants,
  sampleOrderView,
  sampleWelcomeView,
  type SampleOrderVariant,
} from "@/modules/email/sample-data";
import { renderTransactionalEmail } from "@/modules/email/templates/render";
import { resolvePublicAppUrl } from "@/config/site";
import Link from "next/link";

type PageProps = {
  searchParams?: Promise<{ template?: string; locale?: string; variant?: string }>;
};

const variantLabels: Record<SampleOrderVariant, string> = {
  delivery: "Delivery",
  pickup: "Pickup",
  multi: "Múltiples productos",
  configurable: "Item configurable",
};

export default async function EmailPreviewPage({ searchParams }: PageProps) {
  const query = searchParams ? await searchParams : {};
  const template = emailTemplateTypes.includes(query.template as (typeof emailTemplateTypes)[number])
    ? (query.template as (typeof emailTemplateTypes)[number])
    : "ORDER_PAID";
  const locale = query.locale === "en-US" ? "en-US" : "es-MX";
  const variant = sampleOrderVariants.includes(query.variant as SampleOrderVariant)
    ? (query.variant as SampleOrderVariant)
    : "delivery";
  const order = sampleOrderView(locale, variant);
  const rendered = renderTransactionalEmail({
    template,
    welcome: sampleWelcomeView(locale),
    order,
    publicUrl: resolvePublicAppUrl(),
  });
  const allowSend = isDevSandboxSendAllowed();

  return (
    <section className="mx-auto max-w-3xl">
      <Link href="/admin/settings" className="type-caption text-secondary">
        Volver a configuración
      </Link>
      <h1 className="type-h2 mt-4">Vista previa de email</h1>
      <p className="mt-2 type-body text-muted-foreground">
        Datos de muestra. No contacta Resend al previsualizar.
      </p>
      <nav className="mt-6 flex flex-wrap gap-2">
        {emailTemplateTypes.map((item) => (
          <Link
            key={item}
            href={`/admin/settings/email-preview?template=${item}&locale=${locale}&variant=${variant}`}
            className={`type-caption border px-3 py-2 ${
              item === template ? "border-foreground" : "border-border text-muted-foreground"
            }`}
          >
            {item}
          </Link>
        ))}
      </nav>
      <form method="get" className="mt-4 flex flex-wrap gap-3">
        <input type="hidden" name="template" value={template} />
        <select name="variant" defaultValue={variant} className="min-h-11 border border-border bg-background px-3">
          {sampleOrderVariants.map((item) => (
            <option key={item} value={item}>
              {variantLabels[item]}
            </option>
          ))}
        </select>
        <select name="locale" defaultValue={locale} className="min-h-11 border border-border bg-background px-3">
          <option value="es-MX">es-MX</option>
          <option value="en-US">en-US</option>
        </select>
        <Button type="submit" variant="outline">
          Previsualizar
        </Button>
      </form>
      <p className="mt-6 type-body">Asunto: {getEmailSubject(template, locale, order)}</p>
      <iframe
        title="Email preview"
        className="mt-4 min-h-[720px] w-full rounded-md border border-border bg-white"
        srcDoc={rendered.html}
      />
      <pre className="mt-4 overflow-auto rounded-md border border-border p-4 type-caption">
        {rendered.text}
      </pre>
      {allowSend ? (
        <form action={sendSandboxTemplateTest} className="mt-6">
          <input type="hidden" name="template" value={template} />
          <input type="hidden" name="locale" value={locale} />
          <Button type="submit">Enviar prueba</Button>
        </form>
      ) : null}
    </section>
  );
}
