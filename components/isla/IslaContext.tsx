"use client";

import { createContext, useCallback, useContext, useMemo, useRef, useState } from "react";

/**
 * Estado de la isla.
 *
 * Cubre los cuatro tipos de feedback que una interfaz le debe al usuario:
 * estado en curso, finalización, advertencia y error. Tenerlos en un solo
 * canal evita que cada pantalla invente su propio toast.
 */
export type EstadoIsla =
  | { tipo: "oculta" }
  /** Persistente: la OT sobre la que se está trabajando. En un taller siempre
   *  se está adentro de un auto, así que esto casi nunca está vacío. */
  | { tipo: "ot"; otId: string; numero: string; patente: string; estado: string }
  | { tipo: "progreso"; mensaje: string; actual: number; total: number }
  | { tipo: "exito"; mensaje: string }
  | { tipo: "alerta"; mensaje: string }
  | { tipo: "error"; mensaje: string };

interface IslaAPI {
  estado: EstadoIsla;
  /** Fija el contexto persistente (la OT activa). */
  fijarOT: (ot: Extract<EstadoIsla, { tipo: "ot" }> | null) => void;
  /** Muestra algo temporal y después vuelve a la OT activa. */
  notificar: (estado: Exclude<EstadoIsla, { tipo: "oculta" } | { tipo: "ot" }>) => void;
  /** Descarta el aviso temporal. Los errores no se van solos: sin esto la
   *  isla queda tomada por un error que el usuario ya leyó. */
  descartar: () => void;
}

const Ctx = createContext<IslaAPI | null>(null);

/** Cuánto dura cada aviso antes de volver al estado persistente. */
const DURACION: Record<string, number> = {
  exito: 2200,
  alerta: 4000,
  // El error no se va solo: si algo falló, el usuario tiene que enterarse.
  error: Infinity,
  progreso: Infinity,
};

export function IslaProvider({ children }: { children: React.ReactNode }) {
  const [ot, setOt] = useState<Extract<EstadoIsla, { tipo: "ot" }> | null>(null);
  const [temporal, setTemporal] = useState<EstadoIsla | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const notificar = useCallback<IslaAPI["notificar"]>((nuevo) => {
    if (timer.current) clearTimeout(timer.current);
    setTemporal(nuevo);

    const ms = DURACION[nuevo.tipo] ?? 2500;
    if (Number.isFinite(ms)) {
      timer.current = setTimeout(() => setTemporal(null), ms);
    }
  }, []);

  const fijarOT = useCallback<IslaAPI["fijarOT"]>((nueva) => setOt(nueva), []);

  const descartar = useCallback(() => {
    if (timer.current) clearTimeout(timer.current);
    setTemporal(null);
  }, []);

  const valor = useMemo<IslaAPI>(
    () => ({
      estado: temporal ?? ot ?? { tipo: "oculta" },
      fijarOT,
      notificar,
      descartar,
    }),
    [temporal, ot, fijarOT, notificar, descartar],
  );

  return <Ctx.Provider value={valor}>{children}</Ctx.Provider>;
}

export function useIsla(): IslaAPI {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useIsla necesita estar dentro de <IslaProvider>");
  return ctx;
}
