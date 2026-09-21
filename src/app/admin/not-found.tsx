import Link from "next/link";

export default function AdminNotFound() {
  return (
    <main className="mx-auto max-w-xl px-6 py-16">
      <h1 className="type-h2">Recurso no encontrado</h1>
      <p className="type-body mt-3 text-muted-foreground">Esta pantalla de admin no existe.</p>
      <Link href="/admin" className="mt-6 inline-block type-caption">
        Volver al panel
      </Link>
    </main>
  );
}
