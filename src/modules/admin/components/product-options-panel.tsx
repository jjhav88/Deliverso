"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { AdminFeedback } from "@/modules/admin/components/admin-feedback";
import { emptyCatalogActionState } from "@/modules/catalog/action-state";
import {
  createOptionAction,
  createOptionGroupAction,
  moveOptionAction,
  moveOptionGroupAction,
  removeOptionAction,
  removeOptionGroupAction,
  updateOptionAction,
  updateOptionGroupAction,
} from "@/modules/catalog/option-actions";
import type { AdminProductOptionGroup } from "@/modules/catalog/option-queries";

type ProductOptionsPanelProps = {
  productId: string;
  groups: AdminProductOptionGroup[];
};

export function ProductOptionsPanel({ productId, groups }: ProductOptionsPanelProps) {
  const [createGroupState, createGroup, creatingGroup] = useActionState(
    createOptionGroupAction,
    emptyCatalogActionState,
  );

  return (
    <section className="mx-auto mt-10 max-w-2xl rounded-lg border border-border bg-[var(--admin-surface)] p-5">
      <h2 className="type-h2">Opciones del producto</h2>
      <p className="mt-2 type-body text-muted-foreground">
        Grupos SINGLE (una opción) o MULTIPLE (mínimo/máximo). El ajuste de precio se guarda en MXN.
      </p>

      <form action={createGroup} className="mt-6 grid gap-4">
        <input type="hidden" name="productId" value={productId} />
        <Input name="code" label="Código" required placeholder="size" />
        <label className="flex flex-col gap-2">
          <span className="type-label">Tipo de selección</span>
          <select name="selectionType" defaultValue="SINGLE" className="min-h-11 rounded-md border border-border-strong bg-surface-elevated px-3">
            <option value="SINGLE">SINGLE</option>
            <option value="MULTIPLE">MULTIPLE</option>
          </select>
        </label>
        <label className="flex items-center gap-2 type-body">
          <input type="checkbox" name="isRequired" />
          Obligatorio
        </label>
        <div className="grid grid-cols-2 gap-3">
          <Input name="minSelections" label="Mínimo" type="number" min={0} defaultValue="0" />
          <Input name="maxSelections" label="Máximo" type="number" min={1} defaultValue="1" />
        </div>
        <Input name="nameEs" label="Nombre ES" required />
        <Textarea name="descriptionEs" label="Descripción ES" />
        <Input name="nameEn" label="Nombre EN" />
        <Textarea name="descriptionEn" label="Descripción EN" />
        <Button type="submit" loading={creatingGroup}>
          Añadir grupo de opciones
        </Button>
        <AdminFeedback error={createGroupState.error} success={createGroupState.success} />
      </form>

      <div className="mt-10 grid gap-8">
        {groups.map((group) => (
          <OptionGroupCard key={group.id} productId={productId} group={group} />
        ))}
      </div>
    </section>
  );
}

function OptionGroupCard({
  productId,
  group,
}: {
  productId: string;
  group: AdminProductOptionGroup;
}) {
  const [updateState, updateAction, updating] = useActionState(
    updateOptionGroupAction,
    emptyCatalogActionState,
  );
  const [createState, createAction, creating] = useActionState(
    createOptionAction,
    emptyCatalogActionState,
  );

  return (
    <article className="rounded-md border border-border p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 className="type-h3">{group.es.name || group.code}</h3>
        <div className="flex gap-2">
          <form action={moveOptionGroupAction}>
            <input type="hidden" name="productId" value={productId} />
            <input type="hidden" name="groupId" value={group.id} />
            <input type="hidden" name="direction" value="up" />
            <Button type="submit" variant="ghost" size="sm">
              Subir
            </Button>
          </form>
          <form action={moveOptionGroupAction}>
            <input type="hidden" name="productId" value={productId} />
            <input type="hidden" name="groupId" value={group.id} />
            <input type="hidden" name="direction" value="down" />
            <Button type="submit" variant="ghost" size="sm">
              Bajar
            </Button>
          </form>
          <form action={removeOptionGroupAction}>
            <input type="hidden" name="productId" value={productId} />
            <input type="hidden" name="groupId" value={group.id} />
            <Button type="submit" variant="destructive" size="sm">
              {group.usedInCart ? "Desactivar" : "Eliminar"}
            </Button>
          </form>
        </div>
      </div>

      <form action={updateAction} className="mt-4 grid gap-3">
        <input type="hidden" name="productId" value={productId} />
        <input type="hidden" name="groupId" value={group.id} />
        <Input name="code" label="Código" defaultValue={group.code} required />
        <label className="flex flex-col gap-2">
          <span className="type-label">Tipo de selección</span>
          <select name="selectionType" defaultValue={group.selectionType} className="min-h-11 rounded-md border border-border-strong bg-surface-elevated px-3">
            <option value="SINGLE">SINGLE</option>
            <option value="MULTIPLE">MULTIPLE</option>
          </select>
        </label>
        <label className="flex items-center gap-2 type-body">
          <input type="checkbox" name="isRequired" defaultChecked={group.isRequired} />
          Obligatorio
        </label>
        <label className="flex items-center gap-2 type-body">
          <input type="checkbox" name="isActive" defaultChecked={group.isActive} />
          Activo
        </label>
        <div className="grid grid-cols-2 gap-3">
          <Input name="minSelections" label="Mínimo" type="number" min={0} defaultValue={String(group.minSelections)} />
          <Input name="maxSelections" label="Máximo" type="number" min={1} defaultValue={String(group.maxSelections)} />
        </div>
        <Input name="nameEs" label="Nombre ES" defaultValue={group.es.name} required />
        <Textarea name="descriptionEs" label="Descripción ES" defaultValue={group.es.description} />
        <Input name="nameEn" label="Nombre EN" defaultValue={group.en.name} />
        <Textarea name="descriptionEn" label="Descripción EN" defaultValue={group.en.description} />
        <Button type="submit" loading={updating}>
          Guardar grupo
        </Button>
        <AdminFeedback error={updateState.error} success={updateState.success} />
      </form>

      <ul className="mt-6 grid gap-4">
        {group.options.map((option) => (
          <li key={option.id} className="rounded-md bg-muted/40 p-3">
            <OptionEditor productId={productId} groupId={group.id} option={option} />
          </li>
        ))}
      </ul>

      <form action={createAction} className="mt-4 grid gap-3 border-t border-border pt-4">
        <input type="hidden" name="productId" value={productId} />
        <input type="hidden" name="groupId" value={group.id} />
        <p className="type-label">Añadir opción</p>
        <Input name="code" label="Código" required placeholder="chocolate" />
        <Input name="priceDelta" label="Ajuste de precio MXN" defaultValue="0.00" helperText="Ejemplo: 50.00 se guarda como 5000." />
        <Input name="nameEs" label="Nombre ES" required />
        <Textarea name="descriptionEs" label="Descripción ES" />
        <Input name="nameEn" label="Nombre EN" />
        <Textarea name="descriptionEn" label="Descripción EN" />
        <Button type="submit" variant="secondary" loading={creating}>
          Añadir opción
        </Button>
        <AdminFeedback error={createState.error} success={createState.success} />
      </form>
    </article>
  );
}

function OptionEditor({
  productId,
  groupId,
  option,
}: {
  productId: string;
  groupId: string;
  option: AdminProductOptionGroup["options"][number];
}) {
  const [state, action, pending] = useActionState(updateOptionAction, emptyCatalogActionState);

  return (
    <div className="grid gap-3">
      <div className="flex flex-wrap gap-2">
        <form action={moveOptionAction}>
          <input type="hidden" name="productId" value={productId} />
          <input type="hidden" name="groupId" value={groupId} />
          <input type="hidden" name="optionId" value={option.id} />
          <input type="hidden" name="direction" value="up" />
          <Button type="submit" variant="ghost" size="sm">
            Subir
          </Button>
        </form>
        <form action={moveOptionAction}>
          <input type="hidden" name="productId" value={productId} />
          <input type="hidden" name="groupId" value={groupId} />
          <input type="hidden" name="optionId" value={option.id} />
          <input type="hidden" name="direction" value="down" />
          <Button type="submit" variant="ghost" size="sm">
            Bajar
          </Button>
        </form>
        <form action={removeOptionAction}>
          <input type="hidden" name="productId" value={productId} />
          <input type="hidden" name="optionId" value={option.id} />
          <Button type="submit" variant="destructive" size="sm">
            {option.usedInCart ? "Desactivar" : "Eliminar"}
          </Button>
        </form>
      </div>
      <form action={action} className="grid gap-3">
        <input type="hidden" name="productId" value={productId} />
        <input type="hidden" name="optionId" value={option.id} />
        <Input name="code" label="Código" defaultValue={option.code} required />
        <Input name="priceDelta" label="Ajuste de precio MXN" defaultValue={option.priceDeltaInput} />
        <label className="flex items-center gap-2 type-body">
          <input type="checkbox" name="isActive" defaultChecked={option.isActive} />
          Activa
        </label>
        <Input name="nameEs" label="Nombre ES" defaultValue={option.es.name} required />
        <Textarea name="descriptionEs" label="Descripción ES" defaultValue={option.es.description} />
        <Input name="nameEn" label="Nombre EN" defaultValue={option.en.name} />
        <Textarea name="descriptionEn" label="Descripción EN" defaultValue={option.en.description} />
        <Button type="submit" loading={pending}>
          Guardar opción
        </Button>
        <AdminFeedback error={state.error} success={state.success} />
      </form>
    </div>
  );
}
