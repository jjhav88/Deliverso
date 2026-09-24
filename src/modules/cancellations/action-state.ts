export type CancellationActionState = {
  error: string | null;
  success: string | null;
};

export const emptyCancellationActionState: CancellationActionState = {
  error: null,
  success: null,
};
