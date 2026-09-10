"use client";

import { useEffect } from "react";
import { AlertTriangle, Home, RotateCcw, Wrench } from "lucide-react";
import Link from "next/link";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log seguro en la consola del cliente (sin exponer credenciales)
    console.error("[App Error Boundary]", error);
  }, [error]);

  return (
    <main className="flex min-h-dvh flex-col items-center justify-center p-4 text-center bg-background text-foreground selection:bg-accent/30 selection:text-accent">
      <div className="w-full max-w-md space-y-6 rounded-3xl border border-destructive/40 bg-card p-6 sm:p-8 shadow-2xl">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-destructive/10 border border-destructive/20 text-destructive">
          <AlertTriangle className="h-8 w-8 animate-bounce" aria-hidden />
        </div>

        <div className="space-y-2">
          <span className="inline-block rounded-full bg-destructive/10 border border-destructive/20 px-3 py-0.5 text-xs font-mono font-bold text-destructive tracking-widest uppercase">
            Falla Inesperada
          </span>
          <h1 className="text-display text-2xl sm:text-3xl font-black tracking-tight text-foreground">
            Ocurrió un problema en el taller
          </h1>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Se produjo un error al procesar esta operación. Podés intentar reanudar la tarea o volver a la pantalla principal.
          </p>
          {error.digest && (
            <p className="text-[11px] font-mono text-muted-foreground/70 bg-muted/40 rounded-lg p-1.5 inline-block">
              ID de error: {error.digest}
            </p>
          )}
        </div>

        <div className="flex flex-col sm:flex-row gap-3 pt-2 justify-center">
          <button
            type="button"
            onClick={() => reset()}
            className="inline-flex items-center justify-center gap-2 rounded-2xl bg-accent px-5 py-3 text-sm font-bold text-accent-foreground shadow-lg hover:brightness-110 active:scale-95 transition-all cursor-pointer"
          >
            <RotateCcw className="h-4 w-4" aria-hidden />
            Reintentar
          </button>
          <Link
            href="/tablero"
            className="inline-flex items-center justify-center gap-2 rounded-2xl border border-border bg-card-elevada px-5 py-3 text-sm font-semibold text-foreground hover:bg-muted active:scale-95 transition-all"
          >
            <Home className="h-4 w-4 text-muted-foreground" aria-hidden />
            Ir al Tablero
          </Link>
        </div>

        <footer className="pt-4 border-t border-border/50 text-[11px] text-muted-foreground flex items-center justify-center gap-1.5">
          <Wrench className="h-3 w-3 text-accent" aria-hidden />
          <span>Sistema de Gestión de Taller</span>
        </footer>
      </div>
    </main>
  );
}
