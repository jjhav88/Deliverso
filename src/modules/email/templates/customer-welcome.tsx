import { renderWelcomeEmail } from "@/modules/email/templates/render";
import type { WelcomeEmailView } from "@/modules/email/domain/types";

export function CustomerWelcomeTemplate(view: WelcomeEmailView, publicUrl?: string) {
  return renderWelcomeEmail(view, publicUrl);
}
