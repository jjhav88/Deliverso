import { emailTemplateTypes, type EmailTemplateType } from "@/modules/email/domain/types";

export function isEmailTemplateType(value: string): value is EmailTemplateType {
  return (emailTemplateTypes as readonly string[]).includes(value);
}
