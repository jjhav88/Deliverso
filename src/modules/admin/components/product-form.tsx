"use client";

import { useActionState, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { AdminFeedback } from "@/modules/admin/components/admin-feedback";
import { ArchiveProductDialog } from "@/modules/admin/components/archive-product-dialog";
import { DeleteProductDialog } from "@/modules/admin/components/delete-product-dialog";
import { MediaPicker, type MediaPickerItem } from "@/modules/admin/components/media-picker";
import { ProductStatusBadge } from "@/modules/admin/components/product-status-badge";
import { emptyCatalogActionState } from "@/modules/catalog/action-state";
import {
  publishProductAction,
  reactivateProductAction,
  saveProductAction,
} from "@/modules/catalog/product-actions";
import { slugifyName } from "@/modules/catalog/slug";
import type {
  AdminProductFormState,
  CategoryOption,
  TaxonomyOption,
} from "@/modules/catalog/queries";
import { cn } from "@/lib/cn";

type ProductFormProps = {
  initial: AdminProductFormState;
  media: MediaPickerItem[];
  businessLines: TaxonomyOption[];
  categories: CategoryOption[];
  universes: TaxonomyOption[];
  flash?: string | null;
};

const typeHelp: Record<AdminProductFormState["type"], string> = {
  STANDARD: "Producto con compra directa.",
  CONFIGURABLE:
    "Producto con grupos de opciones. Configúralos en la sección de abajo.",
  CUSTOM_QUOTE: "Requiere cotización. El precio puede quedar vacío.",
};

export function ProductForm({
  initial,
  media,
  businessLines,
  categories,
  universes,
  flash,
}: ProductFormProps) {
  const [saveState, saveAction, saving] = useActionState(
    saveProductAction,
    emptyCatalogActionState,
  );
  const [publishState, publishAction, publishing] = useActionState(
    publishProductAction,
    emptyCatalogActionState,
  );
  const [reactivateState, reactivateAction, reactivating] = useActionState(
    reactivateProductAction,
    emptyCatalogActionState,
  );
  const [localeTab, setLocaleTab] = useState<"es" | "en">("es");
  const [type, setType] = useState(initial.type);
  const [nameEs, setNameEs] = useState(initial.es.name);
  const [slugEs, setSlugEs] = useState(initial.es.slug);
  const [slugEsTouched, setSlugEsTouched] = useState(Boolean(initial.es.slug));
  const [nameEn, setNameEn] = useState(initial.en.name);
  const [slugEn, setSlugEn] = useState(initial.en.slug);
  const [slugEnTouched, setSlugEnTouched] = useState(Boolean(initial.en.slug));
  const [quotePrice, setQuotePrice] = useState(initial.quotePrice);
  const [primaryId, setPrimaryId] = useState(initial.primaryMediaAssetId);
  const [primaryUrl, setPrimaryUrl] = useState(initial.primaryMediaUrl);
  const [gallery, setGallery] = useState(initial.gallery);
  const [businessLineId, setBusinessLineId] = useState(initial.businessLineId);
  const pending = saving || publishing || reactivating;

  const visibleCategories = useMemo(
    () =>
      categories.filter(
        (item) => !businessLineId || item.businessLineId === businessLineId,
      ),
    [categories, businessLineId],
  );

  function moveGallery(index: number, direction: -1 | 1) {
    const next = [...gallery];
    const target = index + direction;
    if (target < 0 || target >= next.length) {
      return;
    }
    const current = next[index];
    const swapped = next[target];
    if (!current || !swapped) {
      return;
    }
    next[index] = swapped;
    next[target] = current;
    setGallery(next);
  }

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="type-h2">
            {initial.id ? "Editar producto" : "Nuevo producto"}
          </h2>
          {initial.id ? (
            <div className="mt-3">
              <ProductStatusBadge status={initial.status} />
            </div>
          ) : null}
        </div>
      </div>

      <form id="product-form" action={saveAction} className="flex flex-col gap-8">
        {initial.id ? <input type="hidden" name="id" value={initial.id} /> : null}
        <input type="hidden" name="primaryMediaAssetId" value={primaryId ?? ""} />
        {gallery.map((item) => (
          <input
            key={item.id}
            type="hidden"
            name="galleryMediaAssetIds"
            value={item.id}
          />
        ))}

        <section className="rounded-lg border border-border bg-[var(--admin-surface)] p-5">
          <h3 className="type-h3">Información general</h3>
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            <div className="flex flex-col gap-2">
              <label htmlFor="product-type" className="type-label">
                Tipo de producto
              </label>
              <select
                id="product-type"
                name="type"
                value={type}
                disabled={pending}
                onChange={(event) =>
                  setType(event.target.value as AdminProductFormState["type"])
                }
                className="min-h-11 rounded-md border border-border-strong bg-surface-elevated px-3"
              >
                <option value="STANDARD">STANDARD</option>
                <option value="CONFIGURABLE">CONFIGURABLE</option>
                <option value="CUSTOM_QUOTE">CUSTOM_QUOTE</option>
              </select>
              <p className="type-caption text-muted-foreground">{typeHelp[type]}</p>
            </div>
            <div className="flex flex-col gap-2">
              <label htmlFor="business-line" className="type-label">
                Línea de negocio
              </label>
              <select
                id="business-line"
                name="businessLineId"
                required
                value={businessLineId}
                disabled={pending || businessLines.length === 0}
                onChange={(event) => setBusinessLineId(event.target.value)}
                className="min-h-11 rounded-md border border-border-strong bg-surface-elevated px-3"
              >
                <option value="">
                  {businessLines.length === 0
                    ? "Aún no hay líneas"
                    : "Selecciona una línea"}
                </option>
                {businessLines.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.name}
                    {item.isActive ? "" : " (inactiva)"}
                  </option>
                ))}
              </select>
              {businessLines.length === 0 ? (
                <p className="type-caption text-muted-foreground">
                  Primero crea una línea, por ejemplo Pastelería o Mesas dulces.{" "}
                  <Link
                    href="/admin/products/business-lines/new"
                    className="text-secondary underline-offset-2 hover:underline"
                  >
                    Crear línea de negocio
                  </Link>
                </p>
              ) : (
                <p className="type-caption text-muted-foreground">
                  Agrupa el producto (pastelería, mesas, personalizados, etc.).
                </p>
              )}
            </div>
            <Input
              name="leadTimeValue"
              label="Tiempo mínimo de preparación"
              type="number"
              min={0}
              defaultValue={initial.leadTimeValue}
              disabled={pending}
              helperText="Déjalo vacío si no hay mínimo."
            />
            <div className="flex flex-col gap-2">
              <label htmlFor="lead-time-unit" className="type-label">
                Unidad
              </label>
              <select
                id="lead-time-unit"
                name="leadTimeUnit"
                defaultValue={initial.leadTimeUnit}
                disabled={pending}
                className="min-h-11 rounded-md border border-border-strong bg-surface-elevated px-3"
              >
                <option value="hours">Horas</option>
                <option value="days">Días</option>
                <option value="minutes">Minutos</option>
              </select>
            </div>
          </div>
        </section>

        <section className="rounded-lg border border-border bg-[var(--admin-surface)] p-5">
          <h3 className="type-h3">Contenido</h3>
          <div role="tablist" aria-label="Idioma del contenido" className="mt-4 flex gap-2">
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
          <div
            className={cn("mt-5 grid gap-4", localeTab === "es" ? "grid" : "hidden")}
            hidden={localeTab !== "es"}
          >
            <p className="type-caption text-muted-foreground">Idioma: es-MX</p>
            <Input
              name="es.name"
              label="Nombre"
              required
              value={nameEs}
              disabled={pending}
              onChange={(event) => {
                const value = event.target.value;
                setNameEs(value);
                if (!slugEsTouched) {
                  setSlugEs(slugifyName(value));
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
              helperText="Único por idioma. Solo minúsculas, números y guiones."
            />
            <Textarea
              name="es.shortDescription"
              label="Descripción corta"
              defaultValue={initial.es.shortDescription}
              disabled={pending}
            />
            <Textarea
              name="es.description"
              label="Descripción"
              defaultValue={initial.es.description}
              disabled={pending}
            />
            <Input
              name="es.seoTitle"
              label="SEO title"
              defaultValue={initial.es.seoTitle}
              disabled={pending}
            />
            <Textarea
              name="es.seoDescription"
              label="SEO description"
              defaultValue={initial.es.seoDescription}
              disabled={pending}
            />
          </div>
          <div
            className={cn("mt-5 grid gap-4", localeTab === "en" ? "grid" : "hidden")}
            hidden={localeTab !== "en"}
          >
            <p className="type-caption text-muted-foreground">
              Idioma: en-US. No se traduce automáticamente. No es obligatoria para publicar.
            </p>
            <Input
              name="en.name"
              label="Name"
              value={nameEn}
              disabled={pending}
              onChange={(event) => {
                const value = event.target.value;
                setNameEn(value);
                if (!slugEnTouched) {
                  setSlugEn(slugifyName(value));
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
              name="en.shortDescription"
              label="Short description"
              defaultValue={initial.en.shortDescription}
              disabled={pending}
            />
            <Textarea
              name="en.description"
              label="Description"
              defaultValue={initial.en.description}
              disabled={pending}
            />
            <Input
              name="en.seoTitle"
              label="SEO title"
              defaultValue={initial.en.seoTitle}
              disabled={pending}
            />
            <Textarea
              name="en.seoDescription"
              label="SEO description"
              defaultValue={initial.en.seoDescription}
              disabled={pending}
            />
          </div>
        </section>

        <section className="rounded-lg border border-border bg-[var(--admin-surface)] p-5">
          <h3 className="type-h3">Precio y tipo</h3>
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            <Input
              name="priceInput"
              label="Precio MXN"
              inputMode="decimal"
              placeholder="450.00"
              defaultValue={initial.priceInput}
              disabled={pending || (type === "CUSTOM_QUOTE" && quotePrice)}
              helperText="Se guarda en centavos. Ejemplo: 450.00 → 45000."
            />
            <Input
              name="sku"
              label="SKU"
              defaultValue={initial.sku}
              disabled={pending}
              helperText="Opcional. Si lo usas, debe ser único."
            />
          </div>
          {type === "CUSTOM_QUOTE" ? (
            <label className="mt-4 flex items-center gap-3 type-body">
              <input
                type="checkbox"
                name="quotePrice"
                checked={quotePrice}
                disabled={pending}
                onChange={(event) => setQuotePrice(event.target.checked)}
              />
              Precio bajo cotización
            </label>
          ) : null}
        </section>

        <section className="rounded-lg border border-border bg-[var(--admin-surface)] p-5">
          <h3 className="type-h3">Clasificación</h3>
          <fieldset className="mt-4">
            <legend className="type-label">Categorías</legend>
            <div className="mt-3 grid gap-2">
              {visibleCategories.length === 0 ? (
                <p className="type-caption text-muted-foreground">
                  No hay categorías para esta línea. Crea una en Categorías.
                </p>
              ) : (
                visibleCategories.map((item) => (
                  <label key={item.id} className="flex items-center gap-3 type-body">
                    <input
                      type="checkbox"
                      name="categoryIds"
                      value={item.id}
                      defaultChecked={initial.categoryIds.includes(item.id)}
                      disabled={pending}
                    />
                    {item.name}
                    {item.isActive ? "" : " (inactiva)"}
                  </label>
                ))
              )}
            </div>
          </fieldset>
          <fieldset className="mt-6">
            <legend className="type-label">Universos</legend>
            <div className="mt-3 grid gap-2">
              {universes.length === 0 ? (
                <p className="type-caption text-muted-foreground">
                  Aún no hay universos activos.
                </p>
              ) : (
                universes.map((item) => (
                  <label key={item.id} className="flex items-center gap-3 type-body">
                    <input
                      type="checkbox"
                      name="universeIds"
                      value={item.id}
                      defaultChecked={initial.universeIds.includes(item.id)}
                      disabled={pending}
                    />
                    {item.name}
                    {item.isActive ? "" : " (inactivo)"}
                  </label>
                ))
              )}
            </div>
          </fieldset>
        </section>

        <section className="rounded-lg border border-border bg-[var(--admin-surface)] p-5">
          <h3 className="type-h3">Imágenes</h3>
          <div className="mt-4 grid gap-6 md:grid-cols-2">
            <MediaPicker
              label="Imagen principal"
              items={media}
              selectedId={primaryId}
              selectedUrl={primaryUrl}
              disabled={pending}
              onSelect={(id, url) => {
                setPrimaryId(id);
                setPrimaryUrl(url);
              }}
            />
            <div>
              <p className="type-label">Galería</p>
              <ul className="mt-3 grid gap-3">
                {gallery.map((item, index) => (
                  <li
                    key={item.id}
                    className="flex items-center gap-3 rounded-md border border-border p-2"
                  >
                    <div className="relative h-16 w-12 overflow-hidden rounded bg-muted">
                      <Image src={item.url} alt="" fill className="object-cover" sizes="48px" />
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <Button
                        type="button"
                        size="sm"
                        variant="ghost"
                        disabled={pending || index === 0}
                        onClick={() => moveGallery(index, -1)}
                      >
                        Subir
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        variant="ghost"
                        disabled={pending || index === gallery.length - 1}
                        onClick={() => moveGallery(index, 1)}
                      >
                        Bajar
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        disabled={pending}
                        onClick={() =>
                          setGallery(gallery.filter((entry) => entry.id !== item.id))
                        }
                      >
                        Quitar
                      </Button>
                    </div>
                  </li>
                ))}
              </ul>
              <div className="mt-4">
                <MediaPicker
                  label="Agregar imagen"
                  items={media}
                  selectedId={null}
                  selectedUrl={null}
                  disabled={pending}
                  onSelect={(id, url) => {
                    if (!id || !url || gallery.some((item) => item.id === id) || id === primaryId) {
                      return;
                    }
                    setGallery([...gallery, { id, url }]);
                  }}
                />
              </div>
            </div>
          </div>
        </section>
      </form>

      <section className="rounded-lg border border-border bg-[var(--admin-surface)] p-5">
        <h3 className="type-h3">Publicación</h3>
        <p className="mt-3 type-body text-muted-foreground">
          Para publicar se exige nombre y slug en español, línea de negocio,
          imagen principal y, salvo cotización, un precio MXN. El inglés no es
          obligatorio.
        </p>
        <AdminFeedback
          error={saveState.error || publishState.error || reactivateState.error}
          success={
            flash ||
            saveState.success ||
            publishState.success ||
            reactivateState.success
          }
        />
        <div className="mt-5 flex flex-wrap gap-2">
          <Button
            type="submit"
            form="product-form"
            variant="outline"
            loading={saving}
            disabled={pending}
          >
            {initial.status === "PUBLISHED" ? "Guardar" : "Guardar borrador"}
          </Button>
          <Button
            type="submit"
            form="product-form"
            formAction={publishAction}
            variant="secondary"
            loading={publishing}
            disabled={pending}
          >
            Publicar
          </Button>
          {initial.id && initial.status !== "ARCHIVED" ? (
            <ArchiveProductDialog productId={initial.id} disabled={pending} />
          ) : null}
          {initial.id && initial.status === "ARCHIVED" ? (
            <form action={reactivateAction}>
              <input type="hidden" name="id" value={initial.id} />
              <Button type="submit" variant="outline" loading={reactivating}>
                Volver a borrador
              </Button>
            </form>
          ) : null}
          {initial.id ? (
            <DeleteProductDialog
              productId={initial.id}
              productName={initial.es.name}
              disabled={pending}
            />
          ) : null}
        </div>
      </section>
    </div>
  );
}
