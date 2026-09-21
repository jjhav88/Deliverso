import { Badge } from "@/components/ui/badge";
import type { ProductStatus } from "@/modules/catalog/domain";

const labels: Record<ProductStatus, string> = {
  DRAFT: "Borrador",
  PUBLISHED: "Publicado",
  ARCHIVED: "Archivado",
};

const variants: Record<ProductStatus, "warning" | "success" | "secondary"> = {
  DRAFT: "warning",
  PUBLISHED: "success",
  ARCHIVED: "secondary",
};

export function ProductStatusBadge({ status }: { status: ProductStatus }) {
  return <Badge variant={variants[status]}>{labels[status]}</Badge>;
}
