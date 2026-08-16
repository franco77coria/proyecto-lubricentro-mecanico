"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { registrarPulsoActividad } from "@/lib/actions/actividad";

const INTERVALO_PULSO_MS = 45_000; // Cada 45 segundos
const MAX_INACTIVIDAD_MS = 60_000; // Si no hay evento en 60 segundos, se considera inactivo

/**
 * Componente invisible que mide el tiempo de uso ACTIVO real en la herramienta.
 *
 * Solo computa minutos si:
 * 1. La pestaña está visible (document.visibilityState === 'visible').
 * 2. Hubo interacción reciente del usuario (clicks, scroll, teclado, toque táctil).
 */
export function TrackerActividad() {
  const pathname = usePathname();
  const ultimaInteraccion = useRef<number>(Date.now());
  const segundosAcumulados = useRef<number>(0);

  useEffect(() => {
    function marcarActividad() {
      ultimaInteraccion.current = Date.now();
    }

    const eventos = ["mousemove", "mousedown", "keydown", "touchstart", "scroll", "wheel"];
    eventos.forEach((ev) => window.addEventListener(ev, marcarActividad, { passive: true }));

    // Ticker cada 1 segundo para sumar segundos activos
    const ticker = setInterval(() => {
      const ahora = Date.now();
      const esVisible = typeof document !== "undefined" && document.visibilityState === "visible";
      const esActivo = ahora - ultimaInteraccion.current < MAX_INACTIVIDAD_MS;

      if (esVisible && esActivo) {
        segundosAcumulados.current += 1;
      }
    }, 1000);

    // Pulso periódico al servidor para enviar el tiempo acumulado
    const sender = setInterval(() => {
      const paraEnviar = segundosAcumulados.current;
      if (paraEnviar >= 15) {
        segundosAcumulados.current = 0;
        registrarPulsoActividad({
          ruta: pathname || "/",
          segundosActivos: paraEnviar,
        }).catch(() => {
          // Reintentar si falla
          segundosAcumulados.current += paraEnviar;
        });
      }
    }, INTERVALO_PULSO_MS);

    return () => {
      eventos.forEach((ev) => window.removeEventListener(ev, marcarActividad));
      clearInterval(ticker);
      clearInterval(sender);
    };
  }, [pathname]);

  return null;
}
