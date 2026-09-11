"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";

export type ItemActivoIsla =
  | {
      tipo: "ot";
      otId: string;
      numero: string;
      patente: string;
      estado: string;
      telefonoCliente?: string | null;
      total?: number | null;
      vehiculoModelo?: string | null;
      clienteNombre?: string | null;
    }
  | {
      tipo: "presupuesto";
      presupuestoId: string;
      numero: string;
      patente: string;
      estado: string;
      telefonoCliente?: string | null;
      total?: number | null;
      vehiculoModelo?: string | null;
      clienteNombre?: string | null;
    };

export type EstadoIsla =
  | { tipo: "oculta" }
  | ItemActivoIsla
  | { tipo: "progreso"; mensaje: string; actual: number; total: number }
  | { tipo: "exito"; mensaje: string }
  | { tipo: "alerta"; mensaje: string }
  | { tipo: "error"; mensaje: string };

interface IslaAPI {
  estado: EstadoIsla;
  activo: ItemActivoIsla | null;
  /** Fija una Orden de Trabajo activa en la isla. */
  fijarOT: (ot: Extract<EstadoIsla, { tipo: "ot" }> | null) => void;
  /** Fija un Presupuesto activo en la isla. */
  fijarPresupuesto: (pr: Extract<EstadoIsla, { tipo: "presupuesto" }> | null) => void;
  /** Fija cualquier ítem activo (OT o Presupuesto). */
  fijarActivo: (item: ItemActivoIsla | null) => void;
  /** Limpia el elemento activo de la isla y de localStorage. */
  limpiarActivo: () => void;
  /** Muestra una notificación temporal en la isla. */
  notificar: (estado: Exclude<EstadoIsla, { tipo: "oculta" } | { tipo: "ot" } | { tipo: "presupuesto" }>) => void;
  /** Descarta el aviso temporal. */
  descartar: () => void;
}

const Ctx = createContext<IslaAPI | null>(null);

const STORAGE_KEY = "taller_isla_activa_v2";

const DURACION: Record<string, number> = {
  exito: 2200,
  alerta: 4000,
  error: Infinity,
  progreso: Infinity,
};

export function IslaProvider({ children }: { children: React.ReactNode }) {
  const [activo, setActivo] = useState<ItemActivoIsla | null>(null);
  const [temporal, setTemporal] = useState<EstadoIsla | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const inicializado = useRef(false);

  // 1. Recuperar contexto activo guardado en localStorage al iniciar en el navegador
  useEffect(() => {
    try {
      const guardado = localStorage.getItem(STORAGE_KEY);
      if (guardado) {
        const parseado = JSON.parse(guardado) as ItemActivoIsla;
        if (parseado && (parseado.tipo === "ot" || parseado.tipo === "presupuesto")) {
          setActivo(parseado);
        }
      }
    } catch {
      // Ignorar fallos de acceso o JSON
    } finally {
      inicializado.current = true;
    }
  }, []);

  // 2. Persistir contexto activo en localStorage ante cualquier cambio
  useEffect(() => {
    if (!inicializado.current) return;
    try {
      if (activo) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(activo));
      } else {
        localStorage.removeItem(STORAGE_KEY);
      }
    } catch {
      // Ignorar en navegadores con cuotas bloqueadas
    }
  }, [activo]);

  const notificar = useCallback<IslaAPI["notificar"]>((nuevo) => {
    if (timer.current) clearTimeout(timer.current);
    setTemporal(nuevo);

    const ms = DURACION[nuevo.tipo] ?? 2500;
    if (Number.isFinite(ms)) {
      timer.current = setTimeout(() => setTemporal(null), ms);
    }
  }, []);

  const fijarActivo = useCallback((item: ItemActivoIsla | null) => {
    setActivo(item);
  }, []);

  const fijarOT = useCallback((nueva: Extract<EstadoIsla, { tipo: "ot" }> | null) => {
    setActivo(nueva);
  }, []);

  const fijarPresupuesto = useCallback((nuevo: Extract<EstadoIsla, { tipo: "presupuesto" }> | null) => {
    setActivo(nuevo);
  }, []);

  const limpiarActivo = useCallback(() => {
    setActivo(null);
  }, []);

  const descartar = useCallback(() => {
    if (timer.current) clearTimeout(timer.current);
    setTemporal(null);
  }, []);

  const valor = useMemo<IslaAPI>(
    () => ({
      estado: temporal ?? activo ?? { tipo: "oculta" },
      activo,
      fijarOT,
      fijarPresupuesto,
      fijarActivo,
      limpiarActivo,
      notificar,
      descartar,
    }),
    [temporal, activo, fijarOT, fijarPresupuesto, fijarActivo, limpiarActivo, notificar, descartar],
  );

  return <Ctx.Provider value={valor}>{children}</Ctx.Provider>;
}

export function useIsla(): IslaAPI {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useIsla necesita estar dentro de <IslaProvider>");
  return ctx;
}
