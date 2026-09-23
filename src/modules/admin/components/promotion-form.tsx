"use client";

import { useActionState, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { AdminFeedback } from "@/modules/admin/components/admin-feedback";
import {
  changePromotionStatusAction,
  emptyAdminPromotionState,
  savePromotionAction,
} from "@/modules/promotions/admin-actions";
import { promotionRulePreview } from "@/modules/promotions/domain/preview";
import type {
  PromotionBenefitType,
  PromotionMode,
  PromotionScopeType,
  PromotionStatus,
} from "@/modules/promotions/domain/types";

export type PromotionFormTarget = { id: string; name: string };

export type PromotionFormInitial = {
  id: string | null;
  internalName: string;
  mode: PromotionMode;
  status: PromotionStatus | null;
  code: string;
  labelEs: string;
  labelEn: string;
  descriptionEs: string;
  descriptionEn: string;
  benefitType: PromotionBenefitType;
  percentage: string;
  fixedAmount: string;
  minSubtotal: string;
  maxDiscount: string;
  startsAt: string;
  endsAt: string;
  usageLimitTotal: string;
  usageLimitPerCustomer: string;
  priority: string;
  scopeType: PromotionScopeType;
  selectedTargets: string[];
};

type PromotionFormProps = {
  initial: PromotionFormInitial;
  targets: {
    products: PromotionFormTarget[];
    categories: PromotionFormTarget[];
    universes: PromotionFormTarget[];
    businessLines: PromotionFormTarget[];
  };
  activationError?: boolean;
};

export function PromotionForm({ initial, targets, activationError }: PromotionFormProps) {
  const [state, formAction, pending] = useActionState(savePromotionAction, emptyAdminPromotionState);
  const [statusState, statusAction, statusPending] = useActionState(
    changePromotionStatusAction,
    emptyAdminPromotionState,
  );
  const [mode, setMode] = useState<PromotionMode>(initial.mode);
  const [benefitType, setBenefitType] = useState<PromotionBenefitType>(initial.benefitType);
  const [scopeType, setScopeType] = useState<PromotionScopeType>(initial.scopeType);
  const [percentage, setPercentage] = useState(initial.percentage);
  const [fixedAmount, setFixedAmount] = useState(initial.fixedAmount);
  const [minSubtotal, setMinSubtotal] = useState(initial.minSubtotal);
  const [maxDiscount, setMaxDiscount] = useState(initial.maxDiscount);
  const [usageLimitPerCustomer, setUsageLimitPerCustomer] = useState(initial.usageLimitPerCustomer);

  const preview = useMemo(
    () =>
      promotionRulePreview({
        benefitType,
        percentageBps: percentage ? Number.parseInt(percentage, 10) * 100 : null,
        fixedAmountMinor: fixedAmount ? Math.round(Number.parseFloat(fixedAmount.replace(",", ".")) * 100) : null,
        minSubtotalMinor: minSubtotal ? Math.round(Number.parseFloat(minSubtotal.replace(",", ".")) * 100) : null,
        maxDiscountMinor: maxDiscount ? Math.round(Number.parseFloat(maxDiscount.replace(",", ".")) * 100) : null,
        usageLimitPerCustomer: usageLimitPerCustomer ? Number.parseInt(usageLimitPerCustomer, 10) : null,
        scopeType,
      }),
    [benefitType, percentage, fixedAmount, minSubtotal, maxDiscount, usageLimitPerCustomer, scopeType],
  );

  const scopeOptions =
    scopeType === "PRODUCT"
      ? targets.products
      : scopeType === "CATEGORY"
        ? targets.categories
        : scopeType === "UNIVERSE"
          ? targets.universes
          : scopeType === "BUSINESS_LINE"
            ? targets.businessLines
            : [];

  return (
    <div className="flex max-w-3xl flex-col gap-8">
    <form action={formAction} className="flex flex-col gap-8">
      {initial.id ? <input type="hidden" name="id" value={initial.id} /> : null}
      <div>
        <h2 className="type-h2">{initial.id ? "Editar promoción" : "Nueva promoción"}</h2>
        <p className="mt-2 type-body-sm text-muted-foreground">
          Las fechas se capturan en America/Mexico_City y se guardan en UTC. Los importes son MXN.
        </p>
      </div>

      {activationError ? (
        <p role="alert" className="type-caption text-destructive">
          No se puede activar: revisa label ES, beneficio, alcance, fechas, mínimos y código.
        </p>
      ) : null}
      <AdminFeedback error={state.error} success={state.success} />

      <section className="grid gap-4 rounded-lg border border-border bg-[var(--admin-surface)] p-5">
        <Input name="internalName" label="Nombre interno" defaultValue={initial.internalName} required disabled={pending} />
        <div className="grid gap-4 sm:grid-cols-2">
          <SelectField
            name="mode"
            label="Modo"
            value={mode}
            disabled={pending}
            onChange={(value) => setMode(value as PromotionMode)}
            options={[
              ["CODE", "Código"],
              ["AUTOMATIC", "Automática"],
            ]}
          />
          <SelectField
            name="benefitType"
            label="Beneficio"
            value={benefitType}
            disabled={pending}
            onChange={(value) => setBenefitType(value as PromotionBenefitType)}
            options={[
              ["PERCENTAGE", "Porcentaje"],
              ["FIXED_AMOUNT", "Importe fijo MXN"],
              ["FREE_DELIVERY", "Envío gratis"],
            ]}
          />
        </div>
        {mode === "CODE" ? (
          <Input
            name="code"
            label="Código"
            defaultValue={initial.code}
            helperText="3–32 caracteres. Se guarda en mayúsculas."
            disabled={pending}
          />
        ) : null}
        <Input name="labelEs" label="Label ES" defaultValue={initial.labelEs} required disabled={pending} />
        <Input name="labelEn" label="Label EN" defaultValue={initial.labelEn} disabled={pending} />
        <Textarea name="descriptionEs" label="Descripción ES" defaultValue={initial.descriptionEs} disabled={pending} />
        <Textarea name="descriptionEn" label="Descripción EN" defaultValue={initial.descriptionEn} disabled={pending} />
      </section>

      <section className="grid gap-4 rounded-lg border border-border bg-[var(--admin-surface)] p-5">
        <h3 className="type-h3">Regla</h3>
        {benefitType === "PERCENTAGE" ? (
          <Input
            name="percentage"
            label="Porcentaje"
            type="number"
            min={1}
            max={90}
            value={percentage}
            onChange={(event) => setPercentage(event.target.value)}
            helperText="Máximo 90% en V1. 10 = 10%."
            disabled={pending}
          />
        ) : null}
        {benefitType === "FIXED_AMOUNT" ? (
          <Input
            name="fixedAmount"
            label="Importe fijo MXN"
            value={fixedAmount}
            onChange={(event) => setFixedAmount(event.target.value)}
            helperText="Ejemplo: 150.00"
            disabled={pending}
          />
        ) : null}
        <Input
          name="minSubtotal"
          label="Compra mínima MXN"
          value={minSubtotal}
          onChange={(event) => setMinSubtotal(event.target.value)}
          helperText={benefitType === "FIXED_AMOUNT" ? "Debe ser mayor que el importe fijo." : undefined}
          disabled={pending}
        />
        {benefitType !== "FREE_DELIVERY" ? (
          <Input
            name="maxDiscount"
            label="Tope máximo MXN"
            value={maxDiscount}
            onChange={(event) => setMaxDiscount(event.target.value)}
            disabled={pending}
          />
        ) : null}
        <Input
          name="startsAt"
          label="Inicio (Mexico City)"
          type="datetime-local"
          defaultValue={initial.startsAt}
          disabled={pending}
        />
        <Input
          name="endsAt"
          label="Fin (Mexico City)"
          type="datetime-local"
          defaultValue={initial.endsAt}
          disabled={pending}
        />
        <div className="grid gap-4 sm:grid-cols-3">
          <Input name="usageLimitTotal" label="Uso total" type="number" min={1} defaultValue={initial.usageLimitTotal} disabled={pending} />
          <Input
            name="usageLimitPerCustomer"
            label="Uso por cliente"
            type="number"
            min={1}
            value={usageLimitPerCustomer}
            onChange={(event) => setUsageLimitPerCustomer(event.target.value)}
            disabled={pending}
          />
          <Input name="priority" label="Prioridad" type="number" defaultValue={initial.priority || "0"} disabled={pending} />
        </div>
        <p className="type-body-sm text-muted-foreground">{preview}</p>
      </section>

      <section className="grid gap-4 rounded-lg border border-border bg-[var(--admin-surface)] p-5">
        <h3 className="type-h3">Alcance</h3>
        <SelectField
          name="scopeType"
          label="Scope"
          value={scopeType}
          disabled={pending}
          onChange={(value) => setScopeType(value as PromotionScopeType)}
          options={[
            ["ORDER", "Pedido completo"],
            ["PRODUCT", "Productos"],
            ["CATEGORY", "Categorías"],
            ["UNIVERSE", "Universos"],
            ["BUSINESS_LINE", "Líneas de negocio"],
          ]}
        />
        {scopeType !== "ORDER" ? (
          <fieldset className="grid gap-2">
            <legend className="type-label">Targets</legend>
            <p className="type-caption text-muted-foreground">
              Un artículo es elegible si coincide con al menos un target.
            </p>
            {scopeOptions.map((item) => (
              <label key={item.id} className="flex items-center gap-2 type-body-sm">
                <input
                  type="checkbox"
                  name="targets"
                  value={item.id}
                  defaultChecked={initial.selectedTargets.includes(item.id)}
                  disabled={pending}
                />
                {item.name}
              </label>
            ))}
          </fieldset>
        ) : null}
      </section>

      <div className="flex flex-wrap gap-3">
        <Button type="submit" disabled={pending} loading={pending}>
          Guardar
        </Button>
      </div>
    </form>

      {initial.id && initial.status ? (
        <section className="grid gap-3 rounded-lg border border-border bg-[var(--admin-surface)] p-5">
          <h3 className="type-h3">Estado persistido: {initial.status}</h3>
          <p className="type-body-sm text-muted-foreground">
            La edición afecta compras futuras. Los pedidos históricos conservan su snapshot.
            Las reservas de pedidos pendientes se honran si pausas o archivas.
          </p>
          <AdminFeedback error={statusState.error} success={statusState.success} />
          <div className="flex flex-wrap gap-3">
            {initial.status === "DRAFT" || initial.status === "PAUSED" ? (
              <StatusButton
                promotionId={initial.id}
                status="ACTIVE"
                label="Activar"
                action={statusAction}
                pending={statusPending}
              />
            ) : null}
            {initial.status === "ACTIVE" ? (
              <StatusButton
                promotionId={initial.id}
                status="PAUSED"
                label="Pausar"
                action={statusAction}
                pending={statusPending}
              />
            ) : null}
            {initial.status !== "ARCHIVED" ? (
              <StatusButton
                promotionId={initial.id}
                status="ARCHIVED"
                label="Archivar"
                action={statusAction}
                pending={statusPending}
              />
            ) : null}
            {initial.status === "PAUSED" ? (
              <StatusButton
                promotionId={initial.id}
                status="DRAFT"
                label="Volver a borrador"
                action={statusAction}
                pending={statusPending}
              />
            ) : null}
          </div>
        </section>
      ) : null}
    </div>
  );
}

function StatusButton({
  promotionId,
  status,
  label,
  action,
  pending,
}: {
  promotionId: string;
  status: PromotionStatus;
  label: string;
  action: (formData: FormData) => void;
  pending: boolean;
}) {
  return (
    <form action={action}>
      <input type="hidden" name="promotionId" value={promotionId} />
      <input type="hidden" name="status" value={status} />
      <Button type="submit" variant="secondary" size="sm" disabled={pending} loading={pending}>
        {label}
      </Button>
    </form>
  );
}

function SelectField({
  name,
  label,
  value,
  options,
  disabled,
  onChange,
}: {
  name: string;
  label: string;
  value: string;
  options: Array<[string, string]>;
  disabled?: boolean;
  onChange: (value: string) => void;
}) {
  return (
    <div className="flex flex-col gap-2">
      <label htmlFor={name} className="type-label">
        {label}
      </label>
      <select
        id={name}
        name={name}
        value={value}
        disabled={disabled}
        onChange={(event) => onChange(event.target.value)}
        className="min-h-11 rounded-md border border-border-strong bg-surface-elevated px-3"
      >
        {options.map(([optionValue, optionLabel]) => (
          <option key={optionValue} value={optionValue}>
            {optionLabel}
          </option>
        ))}
      </select>
    </div>
  );
}
