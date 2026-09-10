"use client";

import { useEffect } from "react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[Global Error Boundary]", error);
  }, [error]);

  return (
    <html lang="es">
      <body
        style={{
          margin: 0,
          padding: "1rem",
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "#09090b",
          color: "#fafafa",
          fontFamily:
            '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
        }}
      >
        <div
          style={{
            maxWidth: "28rem",
            width: "100%",
            backgroundColor: "#141417",
            border: "1px solid rgba(239, 68, 68, 0.4)",
            borderRadius: "1.5rem",
            padding: "2rem",
            textAlign: "center",
            boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.5)",
          }}
        >
          <div
            style={{
              width: "3.5rem",
              height: "3.5rem",
              margin: "0 auto 1.25rem",
              borderRadius: "1rem",
              backgroundColor: "rgba(239, 68, 68, 0.15)",
              border: "1px solid rgba(239, 68, 68, 0.3)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#ef4444",
              fontSize: "1.75rem",
            }}
          >
            ⚠️
          </div>

          <h1
            style={{
              fontSize: "1.5rem",
              fontWeight: 900,
              margin: "0 0 0.5rem",
              color: "#fafafa",
            }}
          >
            Error Crítico del Sistema
          </h1>

          <p
            style={{
              fontSize: "0.875rem",
              color: "#a1a1aa",
              lineHeight: 1.5,
              margin: "0 0 1.5rem",
            }}
          >
            Ocurrió un error inesperado al inicializar la plataforma del taller.
          </p>

          <button
            type="button"
            onClick={() => reset()}
            style={{
              display: "inline-block",
              width: "100%",
              padding: "0.75rem 1.25rem",
              backgroundColor: "#f97316",
              color: "#ffffff",
              border: "none",
              borderRadius: "1rem",
              fontSize: "0.875rem",
              fontWeight: 700,
              cursor: "pointer",
            }}
          >
            Reintentar Iniciar
          </button>
        </div>
      </body>
    </html>
  );
}
