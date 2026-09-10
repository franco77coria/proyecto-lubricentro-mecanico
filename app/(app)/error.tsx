"use client";

import { useEffect } from "react";
import { AlertCircle, RotateCcw, Home } from "lucide-react";
import Link from "next/link";

export default function AppInternalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[App Shell Error]", error);
  }, [error]);

  return (
    <main className="flex-1 flex items-center justify-center p-4 pt-[calc(var(--safe-top)+2rem)] pb-12">
      <div className="w-full max-w-lg space-y-5 rounded-3xl border border-border/80 bg-card p-6 sm:p-8 shadow-xl text-center">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-destructive/10 border border-destructive/20 text-destructive">
          <AlertCircle className="h-7 w-7" aria-hidden />
        </div>

        <div className="space-y-1.5">
          <span className="text-xs font-mono font-bold text-destructive uppercase tracking-wider">
            Atención en esta sección
          </span>
          <h2 className="text-xl sm:text-2xl font-black text-foreground">
            No pudimos cargar esta vista
          </h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Se produjo una interrupción momentánea al obtener los datos. Tu sesión sigue activa.
          </p>
          {error.digest && (
            <p className="text-[11px] font-mono text-muted-foreground/60 bg-muted/40 rounded px-2 py-0.5 inline-block">
              Referencia: {error.digest}
            </p>
          )}
        </div>

        <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
          <button
            type="button"
            onClick={() => reset()}
            className="inline-flex items-center gap-2 rounded-2xl bg-accent px-5 py-2.5 text-sm font-bold text-accent-foreground shadow-md hover:brightness-110 active:scale-95 transition-all cursor-pointer"
          >
            <RotateCcw className="h-4 w-4" aria-hidden />
            Reintentar carga
          </button>
          <Link
            href="/tablero"
            className="inline-flex items-center gap-2 rounded-2xl border border-border bg-card-elevada px-5 py-2.5 text-sm font-semibold text-foreground hover:bg-muted active:scale-95 transition-all"
          >
            <Home className="h-4 w-4 text-muted-foreground" aria-hidden />
            Volver al Tablero
          </Link>
        </div>
      </div>
    </main>
  );
}
