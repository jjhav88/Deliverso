"use client";

type ErrorProps = {
  error: Error & { digest?: string };
  reset: () => void;
};

export default function StorefrontError({ reset }: ErrorProps) {
  return (
    <main className="mx-auto max-w-xl px-6 py-16">
      <p className="type-caption text-secondary">DELIVERSO</p>
      <h1 className="type-h2 mt-4">Algo salió mal</h1>
      <p className="type-body mt-3 text-muted-foreground">
        No pudimos cargar esta página. Puedes reintentar sin perder tu sesión.
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
