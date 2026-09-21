export type CatalogActionState = {
  error: string | null;
  success: string | null;
};

export const emptyCatalogActionState: CatalogActionState = {
  error: null,
  success: null,
};
