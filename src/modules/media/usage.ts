export type MediaUsageLocation = {
  kind: "hero" | "product" | "universe";
  label: string;
  href?: string;
};

export type MediaReferenceSnapshot = {
  productMediaCount: number;
  heroShowcaseCount: number;
  heroActive: boolean;
  universeCount: number;
};

export function collectMediaUsage(snapshot: MediaReferenceSnapshot): MediaUsageLocation[] {
  const usage: MediaUsageLocation[] = [];

  if (snapshot.heroShowcaseCount > 0) {
    usage.push({
      kind: "hero",
      label: snapshot.heroActive ? "Hero" : "Hero (inactivo)",
      href: "/admin/home",
    });
  }

  if (snapshot.productMediaCount > 0) {
    usage.push({
      kind: "product",
      label: "Producto",
      href: "/admin/products",
    });
  }

  if (snapshot.universeCount > 0) {
    usage.push({
      kind: "universe",
      label: "Universo",
      href: "/admin/universes",
    });
  }

  return usage;
}

export function canDeleteMediaAsset(snapshot: MediaReferenceSnapshot): boolean {
  return collectMediaUsage(snapshot).length === 0;
}
