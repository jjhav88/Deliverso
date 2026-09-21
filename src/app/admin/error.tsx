"use client";

type ErrorProps = {
  error: Error & { digest?: string };
  reset: () => void;
};

export default function AdminError({ reset }: ErrorProps) {
  return (
    <main className="mx-auto max-w-xl px-6 py-16">
      <h1 className="type-h2">Error en Admin</h1>
      <p className="type-body mt-3 text-muted-foreground">
        La consola no pudo completar esta acción. Reintenta.
      </p>
      <button type="button" onClick={() => reset()} className="mt-6 min-h-11 border border-border px-4">
        Reintentar
      </button>
    </main>
  );
}
