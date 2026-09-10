"use client";

import Link from "next/link";
import { Sparkles, ArrowRight } from "lucide-react";

interface BannerTrialProps {
  diasRestantes: number;
  esDueno: boolean;
}

export function BannerTrial({ diasRestantes, esDueno }: BannerTrialProps) {
  if (diasRestantes <= 0) return null;

  return (
    <div className="relative z-30 flex items-center justify-between gap-3 bg-gradient-to-r from-accent/15 via-accent/10 to-amber-500/15 px-4 py-2 text-xs border-b border-accent/20 backdrop-blur-md">
      <div className="flex items-center gap-2 min-w-0">
        <span className="flex h-2 w-2 relative shrink-0">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-accent opacity-75" />
          <span className="relative inline-flex rounded-full h-2 w-2 bg-accent" />
        </span>
        <div className="flex items-center gap-1.5 truncate">
          <Sparkles className="h-3.5 w-3.5 text-accent shrink-0" aria-hidden />
          <span className="font-semibold text-foreground truncate">
            Estás en tu prueba gratuita de 7 días.
          </span>
          <span className="hidden sm:inline text-muted-foreground">
            {diasRestantes === 1
              ? "Te queda 1 día de acceso completo."
              : `Te quedan ${diasRestantes} días de acceso completo.`}
          </span>
        </div>
      </div>

      {esDueno && (
        <Link
          href="/suscripcion"
          className="inline-flex items-center gap-1 shrink-0 rounded-full bg-accent/90 px-3 py-1 text-[11px] font-bold text-accent-foreground hover:bg-accent transition-all active:scale-95 shadow-sm"
        >
          <span>Activar Plan</span>
          <ArrowRight className="h-3 w-3" aria-hidden />
        </Link>
      )}
    </div>
  );
}
