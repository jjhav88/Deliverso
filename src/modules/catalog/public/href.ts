export type ProductDetailHref = {
  pathname: "/productos/[slug]";
  params: { slug: string };
};

export type UniverseDetailHref = {
  pathname: "/universos/[slug]";
  params: { slug: string };
};

export function productDetailHref(slug: string): ProductDetailHref {
  return { pathname: "/productos/[slug]", params: { slug } };
}

export function universeDetailHref(slug: string): UniverseDetailHref {
  return { pathname: "/universos/[slug]", params: { slug } };
}
