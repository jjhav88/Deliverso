"use client";

import { useActionState, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { AdminFeedback } from "@/modules/admin/components/admin-feedback";
import { MediaPicker, type MediaPickerItem } from "@/modules/admin/components/media-picker";
import { saveHomeCmsAction, type HomeSaveState } from "@/modules/home/actions";
import type { HomeAdminState } from "@/modules/home/admin-queries";
import type { HomeAdminCopy } from "@/modules/home/admin-queries";
import { cn } from "@/lib/cn";

type HomeCmsFormProps = {
  initial: HomeAdminState;
  media: MediaPickerItem[];
};

const initialSave: HomeSaveState = { error: null, success: null };

function CopyFields({
  locale,
  values,
  pending,
}: {
  locale: "es" | "en";
  values: HomeAdminCopy;
  pending: boolean;
}) {
  const prefix = locale;
  return (
    <div className="grid gap-4">
      <Input name={`${prefix}.heroEyebrow`} label="Hero eyebrow" defaultValue={values.heroEyebrow} disabled={pending} />
      <Input name={`${prefix}.heroHeadline`} label="Hero headline" defaultValue={values.heroHeadline} disabled={pending} />
      <Textarea name={`${prefix}.heroDescription`} label="Hero descripción" defaultValue={values.heroDescription} disabled={pending} />
      <Input name={`${prefix}.introductionTitle`} label="Introducción — título" defaultValue={values.introductionTitle} disabled={pending} />
      <Textarea name={`${prefix}.introductionBody`} label="Introducción — texto" defaultValue={values.introductionBody} disabled={pending} />
      <Input name={`${prefix}.featuredEyebrow`} label="Destacados — eyebrow" defaultValue={values.featuredEyebrow} disabled={pending} />
      <Input name={`${prefix}.featuredTitle`} label="Destacados — título" defaultValue={values.featuredTitle} disabled={pending} />
      <Input name={`${prefix}.universesTitle`} label="Universos — título" defaultValue={values.universesTitle} disabled={pending} />
      <Textarea name={`${prefix}.universesDescription`} label="Universos — descripción" defaultValue={values.universesDescription} disabled={pending} />
      <Input name={`${prefix}.personalizationTitle`} label="Personalización — título" defaultValue={values.personalizationTitle} disabled={pending} />
      <Textarea name={`${prefix}.personalizationDescription`} label="Personalización — descripción" defaultValue={values.personalizationDescription} disabled={pending} />
      <Input name={`${prefix}.finalCtaTitle`} label="CTA final — título" defaultValue={values.finalCtaTitle} disabled={pending} />
      <Textarea name={`${prefix}.finalCtaDescription`} label="CTA final — descripción" defaultValue={values.finalCtaDescription} disabled={pending} />
    </div>
  );
}

export function HomeCmsForm({ initial, media }: HomeCmsFormProps) {
  const [state, formAction, pending] = useActionState(saveHomeCmsAction, initialSave);
  const [localeTab, setLocaleTab] = useState<"es" | "en">("es");
  const [leftId, setLeftId] = useState(initial.hero.left.mediaAssetId);
  const [leftUrl, setLeftUrl] = useState(initial.hero.left.publicUrl);
  const [centerId, setCenterId] = useState(initial.hero.center.mediaAssetId);
  const [centerUrl, setCenterUrl] = useState(initial.hero.center.publicUrl);
  const [rightId, setRightId] = useState(initial.hero.right.mediaAssetId);
  const [rightUrl, setRightUrl] = useState(initial.hero.right.publicUrl);

  return (
    <form action={formAction} className="flex flex-col gap-10">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="type-h2">Gestión de la página principal</h2>
          <p className="mt-2 max-w-2xl type-body text-muted-foreground">
            DELIVERSO y el slogan oficial no se editan aquí. El resto del Home sí.
          </p>
        </div>
        <a
          href="/"
          target="_blank"
          rel="noreferrer"
          className="inline-flex min-h-11 items-center type-label text-secondary"
        >
          Ver página pública
        </a>
      </div>

      <section className="rounded-lg border border-border bg-[var(--admin-surface)] p-5">
        <h3 className="type-h3">Hero</h3>
        <label className="mt-4 flex items-center gap-3 type-body">
          <input type="checkbox" name="heroActive" defaultChecked={initial.hero.isActive} disabled={pending} />
          Activo
        </label>
        <label className="mt-4 block type-label">Tone</label>
        <select
          name="heroTone"
          defaultValue={initial.hero.tone}
          disabled={pending}
          className="mt-2 min-h-11 rounded-md border border-border-strong bg-surface-elevated px-3"
        >
          <option value="AUTO">AUTO</option>
          <option value="LIGHT">LIGHT</option>
          <option value="DARK">DARK</option>
        </select>

        <p className="mt-6 type-label">Abanico del Hero</p>
        <div className="mt-4 grid grid-cols-1 gap-5 md:grid-cols-3">
          <MediaPicker
            label="Posición izquierda"
            items={media}
            selectedId={leftId}
            selectedUrl={leftUrl}
            disabled={pending}
            onSelect={(id, url) => {
              setLeftId(id);
              setLeftUrl(url);
            }}
          />
          <MediaPicker
            label="Derecha principal"
            items={media}
            selectedId={centerId}
            selectedUrl={centerUrl}
            disabled={pending}
            onSelect={(id, url) => {
              setCenterId(id);
              setCenterUrl(url);
            }}
          />
          <MediaPicker
            label="Derecha secundaria"
            items={media}
            selectedId={rightId}
            selectedUrl={rightUrl}
            disabled={pending}
            onSelect={(id, url) => {
              setRightId(id);
              setRightUrl(url);
            }}
          />
        </div>
        <input type="hidden" name="leftMediaAssetId" value={leftId ?? ""} />
        <input type="hidden" name="centerMediaAssetId" value={centerId ?? ""} />
        <input type="hidden" name="rightMediaAssetId" value={rightId ?? ""} />
      </section>

      <section className="rounded-lg border border-border bg-[var(--admin-surface)] p-5">
        <h3 className="type-h3">Visibilidad de secciones</h3>
        <div className="mt-4 grid gap-3">
          {[
            ["showIntroduction", "Introducción", initial.visibility.showIntroduction],
            ["showFeaturedProducts", "Productos destacados", initial.visibility.showFeaturedProducts],
            ["showUniverses", "Universos", initial.visibility.showUniverses],
            ["showPersonalization", "Personalización", initial.visibility.showPersonalization],
            ["showValueProposition", "Propuesta de valor", initial.visibility.showValueProposition],
            ["showFinalCta", "CTA final", initial.visibility.showFinalCta],
          ].map(([name, label, checked]) => (
            <label key={String(name)} className="flex items-center gap-3 type-body">
              <input
                type="checkbox"
                name={String(name)}
                defaultChecked={Boolean(checked)}
                disabled={pending}
              />
              {label}
            </label>
          ))}
        </div>
      </section>

      <section className="rounded-lg border border-border bg-[var(--admin-surface)] p-5">
        <div className="flex gap-2">
          <button
            type="button"
            className={cn(
              "min-h-11 rounded-md px-4 type-label",
              localeTab === "es" ? "bg-secondary text-secondary-foreground" : "bg-muted",
            )}
            onClick={() => setLocaleTab("es")}
          >
            Español
          </button>
          <button
            type="button"
            className={cn(
              "min-h-11 rounded-md px-4 type-label",
              localeTab === "en" ? "bg-secondary text-secondary-foreground" : "bg-muted",
            )}
            onClick={() => setLocaleTab("en")}
          >
            English
          </button>
        </div>
        <div className={cn("mt-5", localeTab === "es" ? "block" : "hidden")}>
          <CopyFields locale="es" values={initial.es} pending={pending} />
        </div>
        <div className={cn("mt-5", localeTab === "en" ? "block" : "hidden")}>
          <CopyFields locale="en" values={initial.en} pending={pending} />
        </div>
      </section>

      <section className="rounded-lg border border-border bg-[var(--admin-surface)] p-5">
        <h3 className="type-h3">Productos destacados</h3>
        <p className="mt-3 type-body text-muted-foreground">
          Hasta 3 productos publicados. El Home usa nombre, descripción, imagen
          principal y precio del catálogo; no se duplican aquí.
        </p>
        {initial.publishedProducts.length === 0 ? (
          <p className="mt-4 type-caption text-muted-foreground">
            Publica productos en Catálogo para poder destacarlos.
          </p>
        ) : (
          <div className="mt-4 grid gap-4">
            {initial.featuredProducts.map((slot) => (
              <div key={slot.sortOrder} className="grid gap-2 md:grid-cols-[auto_minmax(0,1fr)_auto] md:items-end">
                <p className="type-label">Orden {slot.sortOrder}</p>
                <select
                  name={`featuredProductId-${slot.sortOrder}`}
                  defaultValue={slot.productId ?? ""}
                  disabled={pending}
                  className="min-h-11 rounded-md border border-border-strong bg-surface-elevated px-3"
                >
                  <option value="">Sin producto</option>
                  {initial.publishedProducts.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.name}
                    </option>
                  ))}
                </select>
                <label className="flex min-h-11 items-center gap-2 type-body">
                  <input
                    type="checkbox"
                    name={`featuredProductActive-${slot.sortOrder}`}
                    defaultChecked={slot.isActive}
                    disabled={pending}
                  />
                  Activo
                </label>
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="rounded-lg border border-border bg-[var(--admin-surface)] p-5">
        <h3 className="type-h3">Universos</h3>
        <p className="mt-3 type-body text-muted-foreground">
          Hasta 4 universos activos. El Home toma nombre y descripción del
          catálogo.
        </p>
        {initial.activeUniverses.length === 0 ? (
          <p className="mt-4 type-caption text-muted-foreground">
            Crea universos activos para seleccionarlos aquí.
          </p>
        ) : (
          <div className="mt-4 grid gap-4">
            {initial.featuredUniverses.map((slot) => (
              <div key={slot.sortOrder} className="grid gap-2 md:grid-cols-[auto_minmax(0,1fr)_auto] md:items-end">
                <p className="type-label">Orden {slot.sortOrder}</p>
                <select
                  name={`featuredUniverseId-${slot.sortOrder}`}
                  defaultValue={slot.universeId ?? ""}
                  disabled={pending}
                  className="min-h-11 rounded-md border border-border-strong bg-surface-elevated px-3"
                >
                  <option value="">Sin universo</option>
                  {initial.activeUniverses.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.name}
                    </option>
                  ))}
                </select>
                <label className="flex min-h-11 items-center gap-2 type-body">
                  <input
                    type="checkbox"
                    name={`featuredUniverseActive-${slot.sortOrder}`}
                    defaultChecked={slot.isActive}
                    disabled={pending}
                  />
                  Activo
                </label>
              </div>
            ))}
          </div>
        )}
      </section>

      <AdminFeedback error={state.error} success={state.success} />
      <div>
        <Button type="submit" variant="secondary" loading={pending}>
          Guardar inicio
        </Button>
      </div>
    </form>
  );
}
