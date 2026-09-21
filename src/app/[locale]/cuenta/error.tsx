"use client";

type ErrorProps = {
  error: Error & { digest?: string };
  reset: () => void;
};

export default function AccountError({ reset }: ErrorProps) {
  return (
    <main className="mx-auto max-w-xl px-6 py-16">
      <h1 className="type-h2">No pudimos abrir tu cuenta</h1>
      <p className="type-body mt-3 text-muted-foreground">
        Si el problema continúa, vuelve a iniciar sesión más tarde.
      </p>
      <button
        type="button"
        onClick={() => reset()}
        className="mt-6 min-h-11 bg-foreground px-4 text-background"
      >
        Reintentar
      </button>
    </main>
  );
}
