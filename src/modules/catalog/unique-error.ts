export function isUniqueConstraintError(error: unknown): boolean {
  return Boolean(
    error &&
      typeof error === "object" &&
      "code" in error &&
      (error as { code: string }).code === "P2002",
  );
}

export function uniqueConstraintKind(error: unknown): "slug" | "sku" | "other" {
  if (!isUniqueConstraintError(error)) {
    return "other";
  }

  const target = JSON.stringify(
    (error as { meta?: { target?: unknown } }).meta?.target ?? "",
  ).toLowerCase();

  if (target.includes("sku")) {
    return "sku";
  }

  if (target.includes("slug")) {
    return "slug";
  }

  return "other";
}

export function uniqueConstraintMessage(error: unknown): string {
  const kind = uniqueConstraintKind(error);

  if (kind === "slug") {
    return "Ese slug ya existe en este idioma. Elige otro.";
  }

  if (kind === "sku") {
    return "Ese SKU ya está en uso.";
  }

  return "Ya existe un registro con esos datos.";
}
