"use client";

import { useState } from "react";
import { motion, useReducedMotion } from "motion/react";
import { Check } from "lucide-react";

const RADIO = 54;
const CIRCUNFERENCIA = 2 * Math.PI * RADIO;

const SPRING = { type: "spring", bounce: 0, duration: 0.4 } as const;

export interface BotonArranqueProps {
  modo: "login" | "registro";
  cargando: boolean;
  exito?: boolean;
}

/**
 * Botón de arranque del login.
 *
 * Es un solo botón para los dos modos: el label morfea entre START (entrar) y
 * 0 KM (cuenta nueva). "0 KM" es la manera de decir "recién salido de fábrica"
 * en el rubro, así que la metáfora se entiende sola sin repetir "START".
 *
 * El anillo se llena al APRETAR, no al soltar: esperar al click se siente
 * muerto, y la respuesta inmediata al contacto es lo que hace que un control
 * parezca físico.
 */
export function BotonArranque({ modo, cargando, exito = false }: BotonArranqueProps) {
  const [apretado, setApretado] = useState(false);
  const reducirMovimiento = useReducedMotion();

  const etiqueta = modo === "login" ? "START" : "0 KM";
  const descripcion = modo === "login" ? "Iniciar sesión" : "Crear cuenta";

  // Cuánto del anillo se dibuja.
  const progreso = exito ? 1 : cargando ? 0.28 : apretado ? 0.6 : 0.12;

  return (
    <button
      type="submit"
      disabled={cargando}
      onPointerDown={() => setApretado(true)}
      onPointerUp={() => setApretado(false)}
      onPointerCancel={() => setApretado(false)}
      onPointerLeave={() => setApretado(false)}
      aria-label={descripcion}
      className="relative grid h-32 w-32 place-items-center rounded-full bg-card shadow-[0_8px_28px_rgb(15_23_42/0.14)] transition-transform active:scale-[0.97] disabled:cursor-wait"
    >
      <svg viewBox="0 0 128 128" className="absolute inset-0 h-full w-full -rotate-90" aria-hidden>
        <circle cx={64} cy={64} r={RADIO} fill="none" stroke="var(--border)" strokeWidth={4} />
        <motion.circle
          cx={64}
          cy={64}
          r={RADIO}
          fill="none"
          stroke={exito ? "var(--estado-ok)" : "var(--accent)"}
          strokeWidth={4}
          strokeLinecap="round"
          strokeDasharray={CIRCUNFERENCIA}
          initial={false}
          animate={{ strokeDashoffset: CIRCUNFERENCIA * (1 - progreso) }}
          transition={reducirMovimiento ? { duration: 0 } : SPRING}
        />
      </svg>

      {/* Mientras carga, el anillo gira como un motor en marcha. */}
      {cargando && !reducirMovimiento && (
        <motion.span
          className="absolute inset-0 rounded-full border-4 border-transparent border-t-accent"
          animate={{ rotate: 360 }}
          transition={{ duration: 0.9, repeat: Infinity, ease: "linear" }}
        />
      )}

      <span className="relative flex flex-col items-center gap-0.5">
        {exito ? (
          <Check className="h-8 w-8 text-estado-ok" aria-hidden />
        ) : (
          <>
            <motion.span
              key={etiqueta}
              initial={reducirMovimiento ? false : { opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              transition={SPRING}
              className="text-display text-2xl leading-none text-foreground"
            >
              {etiqueta}
            </motion.span>
            <span className="text-[0.625rem] font-medium tracking-wide text-muted-foreground">
              {descripcion}
            </span>
          </>
        )}
      </span>
    </button>
  );
}
