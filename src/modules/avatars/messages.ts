import type { AvatarValidationError } from "@/modules/avatars/domain/validation";

export function avatarValidationMessage(code: AvatarValidationError): string {
  switch (code) {
    case "too_large":
      return "La foto no puede superar 2 MB.";
    case "mime":
      return "Usa una imagen JPEG, PNG o WEBP.";
    case "empty":
    case "missing":
      return "Elige una foto de perfil.";
    default:
      return "No se pudo validar la foto.";
  }
}
