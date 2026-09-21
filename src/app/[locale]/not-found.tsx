import Link from "next/link";

export default function StorefrontNotFound() {
  return (
    <main className="mx-auto max-w-xl px-6 py-16">
      <p className="type-caption text-secondary">DELIVERSO</p>
      <h1 className="type-h2 mt-4">Página no encontrada</h1>
      <p className="type-body mt-3 text-muted-foreground">
        El enlace no existe o ya no está disponible.
      </p>
      <Link href="/" className="mt-6 inline-block type-label tracking-[0.12em] text-secondary">
        Volver al inicio
      </Link>
    </main>
  );
}
