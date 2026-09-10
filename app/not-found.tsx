import { ArrowLeft, Home, Wrench, Compass } from "lucide-react";
import Link from "next/link";

export default function NotFound() {
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center p-4 text-center bg-background text-foreground selection:bg-accent/30 selection:text-accent">
      <div className="w-full max-w-md space-y-6 rounded-3xl border border-border/80 bg-card p-6 sm:p-8 shadow-2xl">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-accent/10 border border-accent/20 text-accent">
          <Compass className="h-8 w-8 animate-pulse" aria-hidden />
        </div>

        <div className="space-y-2">
          <span className="inline-block rounded-full bg-accent/10 border border-accent/20 px-3 py-0.5 text-xs font-mono font-bold text-accent tracking-widest uppercase">
            Error 404
          </span>
          <h1 className="text-display text-2xl sm:text-3xl font-black tracking-tight text-foreground">
            Página o Vehículo no encontrado
          </h1>
          <p className="text-sm text-muted-foreground leading-relaxed">
            La dirección a la que intentás acceder no existe, fue dada de baja o no tenés autorización en este taller.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 pt-2 justify-center">
          <Link
            href="/tablero"
            className="inline-flex items-center justify-center gap-2 rounded-2xl bg-accent px-5 py-3 text-sm font-bold text-accent-foreground shadow-lg hover:brightness-110 active:scale-95 transition-all"
          >
            <Home className="h-4 w-4" aria-hidden />
            Ir al Tablero
          </Link>
          <Link
            href="/"
            className="inline-flex items-center justify-center gap-2 rounded-2xl border border-border bg-card-elevada px-5 py-3 text-sm font-semibold text-foreground hover:bg-muted active:scale-95 transition-all"
          >
            <ArrowLeft className="h-4 w-4 text-muted-foreground" aria-hidden />
            Inicio
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
