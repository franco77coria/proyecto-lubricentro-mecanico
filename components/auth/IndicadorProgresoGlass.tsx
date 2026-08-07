"use client";

import { motion, useReducedMotion } from "motion/react";
import { Check } from "lucide-react";

interface Props {
  pasoActual: number;
  totalPasos: number;
  etiquetas: string[];
}

export function IndicadorProgresoGlass({ pasoActual, totalPasos, etiquetas }: Props) {
  const reducirMovimiento = useReducedMotion();
  const porcentaje = Math.round((pasoActual / totalPasos) * 100);

  return (
    <div className="w-full space-y-3">
      <div className="flex items-center justify-between text-xs font-medium text-muted-foreground">
        <span className="tracking-wide uppercase font-semibold">Paso {pasoActual} de {totalPasos}</span>
        <span className="tabular font-bold text-accent">{porcentaje}% listo</span>
      </div>

      {/* Progress Bar */}
      <div className="relative h-2 w-full overflow-hidden rounded-full border border-border bg-card/60 p-0.5 backdrop-blur-md">
        <motion.div
          className="h-full rounded-full bg-gradient-to-r from-accent/80 to-accent shadow-[0_0_12px_color-mix(in_srgb,var(--accent)_50%,transparent)]"
          initial={{ width: 0 }}
          animate={{ width: `${porcentaje}%` }}
          transition={reducirMovimiento ? { duration: 0 } : { type: "spring", stiffness: 180, damping: 24 }}
        />
      </div>

      {/* Steps Badge Indicators */}
      <div className="grid grid-cols-3 gap-2 pt-1">
        {etiquetas.map((etiqueta, idx) => {
          const numeroPaso = idx + 1;
          const esCompletado = pasoActual > numeroPaso;
          const esActual = pasoActual === numeroPaso;

          return (
            <div
              key={etiqueta}
              className={`flex items-center gap-1.5 rounded-xl border px-2.5 py-1.5 text-xs transition-all ${
                esActual
                  ? "border-accent/60 bg-accent/10 font-bold text-foreground shadow-sm"
                  : esCompletado
                  ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-semibold"
                  : "border-border/40 bg-card/30 text-muted-foreground/60"
              }`}
            >
              <span
                className={`flex h-4 w-4 shrink-0 items-center justify-center rounded-full text-[10px] font-black ${
                  esCompletado
                    ? "bg-emerald-500 text-white"
                    : esActual
                    ? "bg-accent text-white"
                    : "bg-muted text-muted-foreground"
                }`}
              >
                {esCompletado ? <Check className="h-2.5 w-2.5" /> : numeroPaso}
              </span>
              <span className="truncate">{etiqueta}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
