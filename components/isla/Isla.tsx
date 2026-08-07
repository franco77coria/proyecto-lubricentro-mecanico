"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { motion, useReducedMotion } from "motion/react";
import {
  AlertOctagon,
  AlertTriangle,
  Camera,
  Check,
  ChevronDown,
  Phone,
  Plus,
  X,
} from "lucide-react";

import { useIsla, type EstadoIsla } from "./IslaContext";

/** Reposicionar / morfear: damping 1.0, response 0.4. Sin rebote — nada de
 *  esto viene con impulso, y el overshoot en algo que solo apareció se lee mal. */
const SPRING = { type: "spring", bounce: 0, duration: 0.4 } as const;

function acento(estado: EstadoIsla) {
  switch (estado.tipo) {
    case "exito":
      return "text-estado-ok";
    case "alerta":
      return "text-estado-observado";
    case "error":
      return "text-destructive";
    default:
      return "text-accent";
  }
}

function Icono({ estado }: { estado: EstadoIsla }) {
  const clase = `h-4 w-4 shrink-0 ${acento(estado)}`;
  switch (estado.tipo) {
    case "exito":
      return <Check className={clase} aria-hidden />;
    case "alerta":
      return <AlertTriangle className={clase} aria-hidden />;
    case "error":
      return <AlertOctagon className={clase} aria-hidden />;
    case "progreso":
      return <Camera className={clase} aria-hidden />;
    default:
      return <span className={`h-2 w-2 shrink-0 rounded-full bg-accent`} aria-hidden />;
  }
}

function Resumen({ estado }: { estado: EstadoIsla }) {
  switch (estado.tipo) {
    case "ot":
      return (
        <>
          <span className="text-display text-sm tracking-normal">{estado.numero}</span>
          <span className="text-slate-300" aria-hidden>
            ·
          </span>
          <span className="text-display text-sm tracking-normal">{estado.patente}</span>
          <span className="truncate text-caption text-muted-foreground">{estado.estado}</span>
        </>
      );
    case "progreso":
      return (
        <span className="truncate text-sm font-medium">
          {estado.mensaje} <span className="tabular">{estado.actual}</span> de{" "}
          <span className="tabular">{estado.total}</span>
        </span>
      );
    case "exito":
    case "alerta":
    case "error":
      return <span className="truncate text-sm font-medium">{estado.mensaje}</span>;
    default:
      return null;
  }
}

/**
 * Isla flotante dinámica.
 *
 * Vive SIEMPRE arriba. La barra de navegación vive abajo y las dos nunca se
 * superponen: son dos superficies translúcidas claras, y una encima de la otra
 * destruye la legibilidad. Por eso la isla expandida está topeada en altura.
 */
export function Isla() {
  const { estado, descartar } = useIsla();
  const [quiereExpandir, setExpandida] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const reducirMovimiento = useReducedMotion();

  const puedeExpandir = estado.tipo === "ot";
  // Derivado, no sincronizado con un efecto: si entra un aviso mientras está
  // abierta, se colapsa sola porque el aviso importa más que el panel.
  const expandida = quiereExpandir && puedeExpandir;

  useEffect(() => {
    if (!expandida) return;
    const fuera = (e: PointerEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setExpandida(false);
    };
    const escape = (e: KeyboardEvent) => e.key === "Escape" && setExpandida(false);
    document.addEventListener("pointerdown", fuera);
    document.addEventListener("keydown", escape);
    return () => {
      document.removeEventListener("pointerdown", fuera);
      document.removeEventListener("keydown", escape);
    };
  }, [expandida]);

  if (estado.tipo === "oculta") return null;

  const transicion = reducirMovimiento ? { duration: 0 } : SPRING;

  return (
    <div
      className="pointer-events-none fixed inset-x-0 top-0 z-40 flex justify-center px-3 pt-[calc(var(--safe-top)+0.5rem)]"
      aria-live={estado.tipo === "error" ? "assertive" : "polite"}
    >
      <motion.div
        ref={ref}
        layout
        transition={transicion}
        style={{ borderRadius: expandida ? 24 : 999 }}
        className="material material-thick backdrop-blur-2xl backdrop-saturate-150 sin-transparencia:backdrop-blur-none pointer-events-auto w-full max-w-[26rem] overflow-hidden"
      >
        {/* --- Píldora --- */}
        <motion.button
          layout="position"
          type="button"
          disabled={!puedeExpandir && estado.tipo !== "error"}
          onClick={() => {
            if (puedeExpandir) setExpandida((v) => !v);
            // Un error se queda hasta que alguien lo lee y lo saca.
            else if (estado.tipo === "error") descartar();
          }}
          aria-label={estado.tipo === "error" ? "Descartar el error" : undefined}
          aria-expanded={puedeExpandir ? expandida : undefined}
          className="flex w-full items-center gap-2 px-4 py-2.5 text-left text-foreground transition-[opacity] active:opacity-70 disabled:cursor-default"
        >
          <Icono estado={estado} />
          <div className="flex min-w-0 flex-1 items-center gap-2">
            <Resumen estado={estado} />
          </div>
          {puedeExpandir && (
            <motion.span animate={{ rotate: expandida ? 180 : 0 }} transition={transicion}>
              <ChevronDown className="h-4 w-4 text-muted-foreground" aria-hidden />
            </motion.span>
          )}
          {estado.tipo === "error" && (
            <X className="h-4 w-4 text-muted-foreground" aria-hidden />
          )}
        </motion.button>

        {/* Barra de progreso, pegada al borde inferior de la píldora. */}
        {estado.tipo === "progreso" && (
          <div className="h-0.5 w-full bg-muted">
            <motion.div
              className="h-full bg-accent"
              initial={false}
              animate={{ width: `${(estado.actual / Math.max(estado.total, 1)) * 100}%` }}
              transition={transicion}
            />
          </div>
        )}

        {/* --- Acciones rápidas --- */}
        {/* Sin AnimatePresence a propósito. El contenedor tiene `layout`, que
            ya anima el alto al montar y desmontar este panel. Envolverlo en
            AnimatePresence solo agregaba un fade de salida, y además dejaba el
            panel montado para siempre cuando entraba un aviso con la isla
            abierta: el hijo quedaba en estado "saliendo" sin completar nunca. */}
        {expandida && estado.tipo === "ot" && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={transicion}
            className="border-t border-border px-3 pt-3 pb-3"
          >
            <div className="grid grid-cols-2 gap-2">
              <AccionRapida icono={Camera} etiqueta="Agregar foto" />
              <AccionRapida icono={Plus} etiqueta="Agregar ítem" />
              <AccionRapida icono={Check} etiqueta="Cambiar estado" />
              <AccionRapida icono={Phone} etiqueta="Llamar al cliente" />
            </div>
            <Link
              href={`/ot/${estado.otId}`}
              onClick={() => setExpandida(false)}
              className="mt-2 flex min-h-12 w-full items-center justify-center rounded-[var(--radius-sm)] px-3 text-caption text-muted-foreground"
            >
              Ver la orden completa
            </Link>
          </motion.div>
        )}
      </motion.div>
    </div>
  );
}

function AccionRapida({
  icono: Icono,
  etiqueta,
}: {
  icono: typeof Camera;
  etiqueta: string;
}) {
  return (
    <button
      type="button"
      // 48px de alto mínimo: acá se toca con guantes puestos.
      className="flex min-h-12 items-center gap-2 rounded-[var(--radius-sm)] bg-muted px-3 py-2 text-sm font-medium text-foreground transition-transform active:scale-[0.97]"
    >
      <Icono className="h-4 w-4 shrink-0 text-accent" aria-hidden />
      <span className="truncate">{etiqueta}</span>
    </button>
  );
}
