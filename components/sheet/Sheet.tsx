"use client";

import { useEffect } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { X } from "lucide-react";

export interface SheetProps {
  abierto: boolean;
  /** Se llama al cerrar el sheet */
  onCerrar: () => void;
  /** Fracciones del alto del sheet donde puede quedar apoyado (retrocompatible) */
  detents?: readonly number[];
  titulo?: string;
  children: React.ReactNode;
}

export function Sheet({ abierto, onCerrar, titulo, children }: SheetProps) {
  const reducirMovimiento = useReducedMotion();

  useEffect(() => {
    if (!abierto) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onCerrar();
    };
    document.addEventListener("keydown", onKey);
    const overflowPrevio = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = overflowPrevio;
    };
  }, [abierto, onCerrar]);

  const transicion = reducirMovimiento
    ? { duration: 0.05 }
    : { type: "spring" as const, damping: 30, stiffness: 340 };

  return (
    <AnimatePresence>
      {abierto && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center"
          role="dialog"
          aria-modal="true"
          aria-label={titulo || "Panel emergente"}
        >
          {/* Backdrop Scrim */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onCerrar}
            className="fixed inset-0 bg-slate-950/75 backdrop-blur-xs cursor-pointer"
          />

          {/* Panel Sheet */}
          <motion.div
            initial={{ y: "100%", opacity: 0.95 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: "100%", opacity: 0.95 }}
            transition={transicion}
            drag="y"
            dragConstraints={{ top: 0 }}
            dragElastic={{ top: 0, bottom: 0.45 }}
            onDragEnd={(_, info) => {
              if (info.offset.y > 100 || info.velocity.y > 450) {
                onCerrar();
              }
            }}
            className="relative z-10 w-full max-w-xl max-h-[92dvh] flex flex-col rounded-t-3xl border-t border-x border-border/80 bg-card/98 backdrop-blur-2xl shadow-2xl overflow-hidden pb-[var(--safe-bottom)]"
          >
            {/* Zona de agarre / Drag handle y título */}
            <div className="flex cursor-grab touch-none items-center justify-between px-5 pt-3 pb-2.5 active:cursor-grabbing border-b border-border/40 shrink-0">
              <div className="w-8" />
              <div className="flex flex-col items-center gap-1.5 min-w-0">
                <div className="h-1.5 w-10 rounded-full bg-muted-foreground/30 hover:bg-muted-foreground/50 transition-colors" />
                {titulo && (
                  <h2 className="text-sm sm:text-base font-bold text-foreground truncate text-center">
                    {titulo}
                  </h2>
                )}
              </div>
              <button
                type="button"
                onClick={onCerrar}
                className="grid h-8 w-8 place-items-center rounded-xl text-muted-foreground hover:bg-muted hover:text-foreground active:scale-95 transition-all"
                aria-label="Cerrar ventana"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Contenido scrollable sin rotura de layout */}
            <div className="flex-1 overflow-y-auto overscroll-contain px-5 pb-5 pt-2">
              {children}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
