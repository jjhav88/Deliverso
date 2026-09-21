"use client";

import { useActionState, useMemo, useState } from "react";
import { Link } from "@/i18n/navigation";
import { Button, buttonClassName } from "@/components/ui/button";
import { QuantitySelector } from "@/modules/catalog/components/quantity-selector";
import type { PublicConfiguratorGroup } from "@/modules/catalog/public/configurator";
import { emptyCartActionState } from "@/modules/cart/action-state";
import { addToCartAction } from "@/modules/cart/actions";
import { formatMoney } from "@/lib/money/format";
import type { AppLocale } from "@/config/i18n";
import type { CurrencyCode } from "@/config/currency";

type ProductPurchaseProps = {
  productId: string;
  variantId: string | null;
  type: "STANDARD" | "CONFIGURABLE" | "CUSTOM_QUOTE";
  locale: AppLocale;
  displayCurrency: CurrencyCode;
  displayRate: string | null;
  baseAmountMinor: number | null;
  groups: PublicConfiguratorGroup[];
  labels: {
    add: string;
    quote: string;
    quantity: string;
    decrease: string;
    increase: string;
    estimated: string;
    required: string;
    selectUpTo: string;
    selectAtLeast: string;
    added: string;
    viewCart: string;
    continue: string;
    loginToAdd: string;
  };
  signedIn: boolean;
  nextPath: string;
};

export function ProductPurchase({
  productId,
  variantId,
  type,
  locale,
  displayCurrency,
  displayRate,
  baseAmountMinor,
  groups,
  labels,
  signedIn,
  nextPath,
}: ProductPurchaseProps) {
  const [quantity, setQuantity] = useState(1);
  const [selected, setSelected] = useState<Record<string, string[]>>({});
  const [state, action, pending] = useActionState(addToCartAction, emptyCartActionState);

  const selectedIds = Object.values(selected).flat();
  const previewMinor = useMemo(() => {
    if (baseAmountMinor === null) {
      return null;
    }
    const optionById = new Map(
      groups.flatMap((group) => group.options.map((option) => [option.id, option])),
    );
    const delta = selectedIds.reduce(
      (sum, id) => sum + Math.max(0, optionById.get(id)?.priceDeltaMinor ?? 0),
      0,
    );
    return Math.max(0, baseAmountMinor + delta) * quantity;
  }, [baseAmountMinor, groups, selectedIds, quantity]);

  const preview = previewMinor === null
    ? null
    : formatEstimated(previewMinor, locale, displayCurrency, displayRate);

  const incomplete = groups.some((group) => {
    const count = selected[group.id]?.length ?? 0;
    return count < group.minSelections;
  });

  if (type === "CUSTOM_QUOTE") {
    return <p className="type-body mt-8 font-medium">{labels.quote}</p>;
  }

  return (
    <form
      action={signedIn ? action : undefined}
      onSubmit={(event) => {
        if (!signedIn) {
          event.preventDefault();
        }
      }}
      className="mt-8 grid gap-6"
    >
      <input type="hidden" name="productId" value={productId} />
      {variantId ? <input type="hidden" name="variantId" value={variantId} /> : null}
      <input type="hidden" name="quantity" value={String(quantity)} />
      {selectedIds.map((id) => (
        <input key={id} type="hidden" name="optionIds" value={id} />
      ))}

      {groups.map((group) => (
        <fieldset key={group.id} className="grid gap-3">
          <legend className="type-label tracking-[0.12em] text-secondary">
            {group.name}
            {group.isRequired ? " *" : ""}
          </legend>
          {group.description ? (
            <p className="type-caption text-muted-foreground">{group.description}</p>
          ) : null}
          <p className="type-caption text-muted-foreground">
            {group.selectionType === "MULTIPLE"
              ? `${labels.selectAtLeast} ${group.minSelections}. ${labels.selectUpTo} ${group.maxSelections}.`
              : group.isRequired
                ? labels.required
                : null}
          </p>
          <div className="grid gap-2">
            {group.options.map((option) => {
              const checked = (selected[group.id] ?? []).includes(option.id);
              return (
                <label key={option.id} className="flex min-h-11 items-center gap-3">
                  <input
                    type={group.selectionType === "SINGLE" ? "radio" : "checkbox"}
                    name={`group-${group.id}`}
                    checked={checked}
                    onChange={() => {
                      setSelected((current) => {
                        const existing = current[group.id] ?? [];
                        if (group.selectionType === "SINGLE") {
                          return { ...current, [group.id]: [option.id] };
                        }
                        const next = checked
                          ? existing.filter((id) => id !== option.id)
                          : existing.length >= group.maxSelections
                            ? existing
                            : [...existing, option.id];
                        return { ...current, [group.id]: next };
                      });
                    }}
                  />
                  <span className="type-body">
                    {option.name}
                    {option.deltaFormatted ? (
                      <span className="ml-2 text-muted-foreground">{option.deltaFormatted}</span>
                    ) : null}
                  </span>
                </label>
              );
            })}
          </div>
        </fieldset>
      ))}

      <div>
        <p className="type-caption mb-2 text-muted-foreground">{labels.quantity}</p>
        <QuantitySelector
          value={quantity}
          onChange={setQuantity}
          decreaseLabel={labels.decrease}
          increaseLabel={labels.increase}
          inputLabel={labels.quantity}
        />
      </div>

      {preview ? (
        <p className="type-body font-medium">
          {labels.estimated}: {preview}
        </p>
      ) : null}

      {signedIn ? (
        <Button type="submit" disabled={incomplete || pending} loading={pending}>
          {labels.add}
        </Button>
      ) : (
        <Link
          href={{
            pathname: "/cuenta/iniciar-sesion",
            query: { next: nextPath },
          }}
          className={buttonClassName()}
        >
          {labels.loginToAdd}
        </Link>
      )}
      {state.error ? (
        <p role="alert" className="type-caption text-destructive">
          {state.error}
        </p>
      ) : null}
      {state.success ? (
        <div role="status" className="grid gap-2">
          <p className="type-caption text-secondary">{labels.added}</p>
          <div className="flex flex-wrap gap-4">
            <Link href="/carrito" className="type-label tracking-[0.12em] text-secondary">
              {labels.viewCart}
            </Link>
            <span className="type-caption text-muted-foreground">{labels.continue}</span>
          </div>
        </div>
      ) : null}
    </form>
  );
}

function formatEstimated(
  amountMinorMxn: number,
  locale: AppLocale,
  displayCurrency: CurrencyCode,
  displayRate: string | null,
): string {
  if (displayCurrency === "MXN" || !displayRate) {
    return formatMoney({ amountMinor: amountMinorMxn, currency: "MXN" }, locale);
  }
  const converted = Math.round((amountMinorMxn / 100) * Number(displayRate) * 100);
  if (!Number.isFinite(converted)) {
    return formatMoney({ amountMinor: amountMinorMxn, currency: "MXN" }, locale);
  }
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency: displayCurrency,
  }).format(converted / 100);
}
