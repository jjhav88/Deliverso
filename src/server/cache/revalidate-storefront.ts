import "server-only";
import { revalidatePath } from "next/cache";

export function revalidateStorefront() {
  revalidatePath("/", "layout");
  revalidatePath("/en", "layout");
  revalidatePath("/productos", "layout");
  revalidatePath("/en/products", "layout");
  revalidatePath("/universos", "layout");
  revalidatePath("/en/universes", "layout");
}

export function revalidateAdminMedia() {
  revalidatePath("/admin/media");
  revalidatePath("/admin/home");
  revalidatePath("/admin");
}

export function revalidateAdminHome() {
  revalidatePath("/admin/home");
  revalidatePath("/admin");
  revalidateStorefront();
}

export function revalidateAdminSettings() {
  revalidatePath("/admin/settings");
  revalidatePath("/admin");
  revalidateStorefront();
}
