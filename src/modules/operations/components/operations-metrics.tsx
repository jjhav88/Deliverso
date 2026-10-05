import { Card } from "@/components/ui/card";
import type { OperationsMetrics } from "@/modules/operations/dto";

const metricItems: Array<{ key: keyof OperationsMetrics; label: string }> = [
  { key: "today", label: "Pedidos de hoy" },
  { key: "toPrepare", label: "Por preparar" },
  { key: "inProduction", label: "En producción" },
  { key: "ready", label: "Listos" },
  { key: "deliveries", label: "Entregas" },
  { key: "pickups", label: "Recogidas" },
  { key: "overdue", label: "Atrasados" },
];

export function OperationsMetricsCards({ metrics }: { metrics: OperationsMetrics }) {
  return (
    <div className="grid grid-cols-2 gap-3 md:grid-cols-4 xl:grid-cols-7">
      {metricItems.map((item) => (
        <Card key={item.key} className="bg-[var(--admin-surface)] p-4">
          <p className="type-caption uppercase tracking-[0.14em] text-muted-foreground">{item.label}</p>
          <p className="mt-2 font-display text-3xl tabular-nums text-foreground">{metrics[item.key]}</p>
        </Card>
      ))}
    </div>
  );
}
