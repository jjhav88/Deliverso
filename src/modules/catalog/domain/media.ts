export const mediaKinds = ["IMAGE"] as const;

export type MediaKind = (typeof mediaKinds)[number];

export const productMediaRoles = ["PRIMARY", "GALLERY"] as const;

export type ProductMediaRole = (typeof productMediaRoles)[number];

export function isMediaKind(value: string): value is MediaKind {
  return (mediaKinds as readonly string[]).includes(value);
}

export function isProductMediaRole(value: string): value is ProductMediaRole {
  return (productMediaRoles as readonly string[]).includes(value);
}
