import "server-only";
import { revalidatePath } from "next/cache";
import { revalidateStorefront } from "@/server/cache/revalidate-storefront";

export function revalidateAdminCatalog() {
  revalidatePath("/admin/products");
  revalidatePath("/admin/universes");
  revalidatePath("/admin/home");
  revalidatePath("/admin");
  revalidateStorefront();
}
