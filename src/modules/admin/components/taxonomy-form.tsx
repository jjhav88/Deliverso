"use client";

import { useActionState, useState, type ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { AdminFeedback } from "@/modules/admin/components/admin-feedback";
import { emptyCatalogActionState } from "@/modules/catalog/action-state";
import { slugifyName } from "@/modules/catalog/slug";
import { cn } from "@/lib/cn";
import type { CatalogActionState } from "@/modules/catalog/action-state";

type TaxonomyValues = {
  id: string | null;
  isActive: boolean;
  sortOrder: number;
  businessLineId?: string;
  es: { name: string; slug: string; description: string };
  en: { name: string; slug: string; description: string };
};

type TaxonomyFormProps = {
  title: string;
  action: (
    prev: CatalogActionState,
    formData: FormData,
  ) => Promise<CatalogActionState>;
  initial: TaxonomyValues;
  businessLines?: Array<{ id: string; name: string }>;
  extra?: ReactNode;
  flash?: string | null;
};

export function TaxonomyForm({
  title,
  action,
  initial,
  businessLines,
  extra,
  flash,
}: TaxonomyFormProps) {
  const [state, formAction, pending] = useActionState(
    action,
    emptyCatalogActionState,
  );
  const [localeTab, setLocaleTab] = useState<"es" | "en">("es");
  const [nameEs, setNameEs] = useState(initial.es.name);
  const [slugEs, setSlugEs] = useState(initial.es.slug);
  const [slugEsTouched, setSlugEsTouched] = useState(Boolean(initial.es.slug));
  const [nameEn, setNameEn] = useState(initial.en.name);
  const [slugEn, setSlugEn] = useState(initial.en.slug);
  const [slugEnTouched, setSlugEnTouched] = useState(Boolean(initial.en.slug));

  return (
    <form action={formAction} className="flex max-w-3xl flex-col gap-8">
      {initial.id ? <input type="hidden" name="id" value={initial.id} /> : null}
      <h2 className="type-h2">{title}</h2>

      <section className="rounded-lg border border-border bg-[var(--admin-surface)] p-5">
        <h3 className="type-h3">Estado</h3>
        <label className="mt-4 flex items-center gap-3 type-body">
          <input
            type="checkbox"
            name="isActive"
            defaultChecked={initial.isActive}
            disabled={pending}
          />
          Activo
        </label>
        <div className="mt-4">
          <Input
            name="sortOrder"
            label="Orden"
            type="number"
            min={0}
            defaultValue={initial.sortOrder}
            disabled={pending}
          />
        </div>
        {businessLines ? (
          <div className="mt-4 flex flex-col gap-2">
            <label htmlFor="taxonomy-line" className="type-label">
              Línea de negocio
            </label>
            <select
              id="taxonomy-line"
              name="businessLineId"
              required
              defaultValue={initial.businessLineId ?? ""}
              disabled={pending}
              className="min-h-11 rounded-md border border-border-strong bg-surface-elevated px-3"
            >
              <option value="">Selecciona una línea</option>
              {businessLines.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name}
                </option>
              ))}
            </select>
          </div>
        ) : null}
        {extra}
      </section>

      <section className="rounded-lg border border-border bg-[var(--admin-surface)] p-5">
        <div role="tablist" aria-label="Idioma" className="flex gap-2">
          <button
            type="button"
            role="tab"
            aria-selected={localeTab === "es"}
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
            role="tab"
            aria-selected={localeTab === "en"}
            className={cn(
              "min-h-11 rounded-md px-4 type-label",
              localeTab === "en" ? "bg-secondary text-secondary-foreground" : "bg-muted",
            )}
            onClick={() => setLocaleTab("en")}
          >
            English
          </button>
        </div>
        <div className={cn("mt-5 grid gap-4", localeTab === "es" ? "grid" : "hidden")}>
          <Input
            name="es.name"
            label="Nombre"
            required
            value={nameEs}
            disabled={pending}
            onChange={(event) => {
              setNameEs(event.target.value);
              if (!slugEsTouched) {
                setSlugEs(slugifyName(event.target.value));
              }
            }}
          />
          <Input
            name="es.slug"
            label="Slug"
            required
            value={slugEs}
            disabled={pending}
            onChange={(event) => {
              setSlugEsTouched(true);
              setSlugEs(event.target.value);
            }}
          />
          <Textarea
            name="es.description"
            label="Descripción"
            defaultValue={initial.es.description}
            disabled={pending}
          />
        </div>
        <div className={cn("mt-5 grid gap-4", localeTab === "en" ? "grid" : "hidden")}>
          <Input
            name="en.name"
            label="Name"
            value={nameEn}
            disabled={pending}
            onChange={(event) => {
              setNameEn(event.target.value);
              if (!slugEnTouched) {
                setSlugEn(slugifyName(event.target.value));
              }
            }}
          />
          <Input
            name="en.slug"
            label="Slug"
            value={slugEn}
            disabled={pending}
            onChange={(event) => {
              setSlugEnTouched(true);
              setSlugEn(event.target.value);
            }}
          />
          <Textarea
            name="en.description"
            label="Description"
            defaultValue={initial.en.description}
            disabled={pending}
          />
        </div>
      </section>

      <AdminFeedback error={state.error} success={flash || state.success} />
      <div>
        <Button type="submit" variant="secondary" loading={pending}>
          Guardar
        </Button>
      </div>
    </form>
  );
}
