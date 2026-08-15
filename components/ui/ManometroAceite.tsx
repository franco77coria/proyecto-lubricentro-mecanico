"use client";

import { motion } from "motion/react";
import { cn } from "@/lib/utils";

interface ManometroAceiteProps {
  litros: number;
  maxLitros?: number;
  viscosidad?: string;
  norma?: string;
  className?: string;
}

export function ManometroAceite({
  litros,
  maxLitros = 8,
  viscosidad = "5W-30",
  norma,
  className,
}: ManometroAceiteProps) {
  const porcentaje = Math.min(Math.max(litros / maxLitros, 0), 1);
  // Rango angular: -120° (vacío) a +120° (máximo)
  const angulo = -120 + porcentaje * 240;
  const perimeter = 210;
  const strokeOffset = perimeter * (1 - porcentaje);

  return (
    <div
      className={cn(
        "relative flex flex-col items-center justify-center rounded-2xl border border-border/80 bg-card p-4 shadow-sm",
        className,
      )}
    >
      <div className="relative flex items-center justify-center">
        <svg viewBox="0 0 160 105" className="h-28 w-44 overflow-visible">
          {/* Arco de fondo */}
          <path
            d="M 25 90 A 55 55 0 1 1 135 90"
            fill="none"
            stroke="currentColor"
            strokeWidth="10"
            strokeLinecap="round"
            className="text-muted/40"
          />
          {/* Arco activo con degradé ámbar/aceite */}
          <path
            d="M 25 90 A 55 55 0 1 1 135 90"
            fill="none"
            stroke="var(--accent, #f97316)"
            strokeWidth="10"
            strokeLinecap="round"
            strokeDasharray={perimeter}
            strokeDashoffset={strokeOffset}
            className="transition-all duration-700 ease-out"
          />
          {/* Marcas de graduación */}
          <line x1="25" y1="90" x2="33" y2="85" stroke="currentColor" strokeWidth="2" className="text-muted-foreground" />
          <line x1="80" y1="35" x2="80" y2="44" stroke="currentColor" strokeWidth="2" className="text-muted-foreground" />
          <line x1="135" y1="90" x2="127" y2="85" stroke="currentColor" strokeWidth="2" className="text-muted-foreground" />

          {/* Aguja de instrumental */}
          <motion.g
            style={{ transformOrigin: "80px 90px" }}
            initial={{ rotate: -120 }}
            animate={{ rotate: angulo }}
            transition={{ type: "spring", stiffness: 120, damping: 14 }}
          >
            <line x1="80" y1="90" x2="80" y2="42" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" className="text-foreground" />
            <circle cx="80" cy="90" r="7" className="fill-accent" />
            <circle cx="80" cy="90" r="3" className="fill-background" />
          </motion.g>
        </svg>
      </div>

      <div className="-mt-3 text-center">
        <div className="text-display text-2xl font-bold tracking-tight text-foreground">
          {litros} <span className="text-base font-normal text-muted-foreground">L</span>
        </div>
        <div className="flex flex-wrap items-center justify-center gap-1.5 pt-1">
          <span className="rounded-md bg-accent/15 px-2 py-0.5 text-xs font-bold text-accent">
            {viscosidad}
          </span>
          {norma && (
            <span className="rounded-md bg-muted px-2 py-0.5 text-[11px] font-medium text-muted-foreground">
              {norma}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
