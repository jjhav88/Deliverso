"use client";

type GlobalErrorProps = {
  error: Error & { digest?: string };
  retry: () => void;
};

export default function GlobalError({ retry }: GlobalErrorProps) {
  return (
    <html lang="es">
      <body style={{ margin: 0, background: "#FFF6E9", color: "#234166", fontFamily: "Georgia, serif" }}>
        <main style={{ maxWidth: 560, margin: "4rem auto", padding: "0 1.5rem" }}>
          <title>DELIVERSO</title>
          <p style={{ letterSpacing: "0.18em", fontSize: 12 }}>DELIVERSO</p>
          <h1 style={{ fontSize: 28, fontWeight: 400 }}>Algo salió mal</h1>
          <p>No pudimos completar esta página. Inténtalo de nuevo en un momento.</p>
          <button
            type="button"
            onClick={() => retry()}
            style={{ background: "#234166", color: "#FFF6E9", border: 0, padding: "12px 18px", borderRadius: 8 }}
          >
            Reintentar
          </button>
        </main>
      </body>
    </html>
  );
}
