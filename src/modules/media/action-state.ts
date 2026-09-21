export type MediaActionState = {
  error: string | null;
  success: string | null;
};

export const emptyMediaActionState: MediaActionState = {
  error: null,
  success: null,
};
