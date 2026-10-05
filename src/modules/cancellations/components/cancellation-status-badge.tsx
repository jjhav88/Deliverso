import { Badge } from "@/components/ui/badge";
import type { CancellationRequestStatus } from "@/modules/cancellations/domain/types";
import { cancellationStatusLabel } from "@/modules/cancellations/domain/labels";
import { cancellationStatusBadgeVariant } from "@/modules/cancellations/domain/presentation";

export function CancellationStatusBadge({
  status,
  locale = "es-MX",
}: {
  status: CancellationRequestStatus;
  locale?: string;
}) {
  return (
    <Badge variant={cancellationStatusBadgeVariant(status)}>
      {cancellationStatusLabel(status, locale)}
    </Badge>
  );
}
