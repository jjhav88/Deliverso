import type { CustomerOrderItem } from "@/modules/orders/dto";
import { formatMoneyFromMinorUnits } from "@/lib/money/format";
import type { AppLocale } from "@/config/i18n";

export function OrderItemsList(props: {
  items: CustomerOrderItem[];
  locale: AppLocale;
}) {
  return (
    <ul className="grid gap-4">
      {props.items.map((item, index) => (
        <li key={`${item.productName}-${index}`} className="grid gap-1">
          <p className="type-body">
            {item.quantity} × {item.productName}
            {item.variantName ? ` · ${item.variantName}` : ""}
          </p>
          {item.options.map((option) => (
            <p key={`${option.groupName}-${option.optionName}`} className="type-body-sm text-muted-foreground">
              {option.groupName}: {option.optionName}
            </p>
          ))}
          <p className="type-body-sm tabular-nums">
            {formatMoneyFromMinorUnits(item.lineTotalMinor, "MXN", props.locale)}
          </p>
        </li>
      ))}
    </ul>
  );
}
