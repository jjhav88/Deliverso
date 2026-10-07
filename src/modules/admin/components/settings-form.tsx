"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { AdminFeedback } from "@/modules/admin/components/admin-feedback";
import {
  saveSiteSettingsAction,
  type SettingsSaveState,
} from "@/modules/settings/actions";
import type { PublicSiteSettings } from "@/modules/settings/queries";

type SettingsFormProps = {
  initial: PublicSiteSettings;
};

const initialSave: SettingsSaveState = { error: null, success: null };

function socialFor(
  initial: PublicSiteSettings,
  platform: "FACEBOOK" | "INSTAGRAM" | "TIKTOK",
) {
  return initial.social.find((item) => item.platform === platform);
}

export function SettingsForm({ initial }: SettingsFormProps) {
  const [state, formAction, pending] = useActionState(
    saveSiteSettingsAction,
    initialSave,
  );
  const facebook = socialFor(initial, "FACEBOOK");
  const instagram = socialFor(initial, "INSTAGRAM");
  const tiktok = socialFor(initial, "TIKTOK");

  return (
    <form action={formAction} className="mx-auto flex max-w-2xl flex-col gap-8">
      <div>
        <h2 className="type-h2">Configuración pública</h2>
        <p className="mt-2 type-body text-muted-foreground">
          Contacto y redes del storefront. Los campos vacíos no se muestran.
        </p>
      </div>

      <section className="rounded-lg border border-border bg-[var(--admin-surface)] p-5">
        <h3 className="type-h3">Información de contacto</h3>
        <div className="mt-4 grid gap-4">
          <Input
            name="contactEmail"
            type="email"
            label="Correo"
            defaultValue={initial.contactEmail ?? ""}
            disabled={pending}
          />
          <Input
            name="whatsapp"
            label="WhatsApp"
            defaultValue={initial.whatsapp ?? ""}
            disabled={pending}
            helperText="Número con lada, por ejemplo +52 55 1234 5678"
          />
          <Textarea
            name="physicalAddress"
            label="Dirección física"
            defaultValue={initial.physicalAddress ?? ""}
            disabled={pending}
            rows={3}
          />
        </div>
      </section>

      <section className="rounded-lg border border-border bg-[var(--admin-surface)] p-5">
        <h3 className="type-h3">Identidad legal</h3>
        <p className="mt-2 type-body-sm text-muted-foreground">
          No inventes estos datos. Déjalos vacíos hasta que Julio los proporcione. El storefront
          mostrará “pendiente de publicación” mientras falten.
        </p>
        <div className="mt-4 grid gap-4">
          <Input
            name="legalEntityName"
            label="Nombre / razón social del responsable"
            defaultValue={initial.legalEntityName ?? ""}
            disabled={pending}
          />
          <Input name="rfc" label="RFC" defaultValue={initial.rfc ?? ""} disabled={pending} />
          <Textarea
            name="legalAddress"
            label="Domicilio legal"
            defaultValue={initial.legalAddress ?? ""}
            disabled={pending}
            rows={3}
          />
          <Input
            name="legalPhone"
            label="Teléfono legal"
            defaultValue={initial.legalPhone ?? ""}
            disabled={pending}
          />
          <Input
            name="privacyEmail"
            type="email"
            label="Correo de privacidad / ARCO"
            defaultValue={initial.privacyEmail ?? ""}
            disabled={pending}
          />
          <p className="type-caption text-muted-foreground">País: México (fijo).</p>
        </div>
      </section>

      <section className="rounded-lg border border-border bg-[var(--admin-surface)] p-5">
        <h3 className="type-h3">Redes sociales</h3>
        <div className="mt-4 grid gap-6">
          <div className="grid gap-3">
            <Input
              name="facebookUrl"
              label="Facebook URL"
              defaultValue={facebook?.url ?? ""}
              disabled={pending}
            />
            <label className="flex items-center gap-3 type-body">
              <input
                type="checkbox"
                name="facebookActive"
                defaultChecked={facebook?.isActive ?? false}
                disabled={pending}
              />
              Mostrar Facebook
            </label>
          </div>
          <div className="grid gap-3">
            <Input
              name="instagramUrl"
              label="Instagram URL"
              defaultValue={instagram?.url ?? ""}
              disabled={pending}
            />
            <label className="flex items-center gap-3 type-body">
              <input
                type="checkbox"
                name="instagramActive"
                defaultChecked={instagram?.isActive ?? false}
                disabled={pending}
              />
              Mostrar Instagram
            </label>
          </div>
          <div className="grid gap-3">
            <Input
              name="tiktokUrl"
              label="TikTok URL"
              defaultValue={tiktok?.url ?? ""}
              disabled={pending}
            />
            <label className="flex items-center gap-3 type-body">
              <input
                type="checkbox"
                name="tiktokActive"
                defaultChecked={tiktok?.isActive ?? false}
                disabled={pending}
              />
              Mostrar TikTok
            </label>
          </div>
        </div>
      </section>

      <AdminFeedback error={state.error} success={state.success} />
      <Button type="submit" variant="secondary" loading={pending}>
        Guardar configuración
      </Button>
    </form>
  );
}
