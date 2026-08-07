"use client";

import { useCallback, useRef } from "react";
import { velocidadDesde, type Muestra } from "./fisica";

export interface InfoArrastre {
  /** Desplazamiento acumulado desde que empezó el gesto, en px. */
  delta: number;
  /** px/s en el momento de soltar. */
  velocidad: number;
}

export interface OpcionesArrastre {
  eje?: "x" | "y";
  /** Movimiento mínimo antes de comprometerse al gesto. Evita que un tap
   *  tembloroso se interprete como arrastre. */
  umbral?: number;
  onInicio?: () => void;
  onMover?: (info: Omit<InfoArrastre, "velocidad">) => void;
  onFin?: (info: InfoArrastre) => void;
}

/**
 * Arrastre 1:1 con Pointer Events.
 *
 * Tres cosas que hace y que son las que separan "nativo" de "web":
 *
 * 1. `setPointerCapture` — el seguimiento sigue aunque el dedo se salga del
 *    elemento. Sin esto, arrastrar rápido "suelta" el objeto solo.
 * 2. Respeta el offset de agarre — se mueve por el delta desde donde se tocó,
 *    nunca centrando el elemento bajo el dedo. Saltar al centro al agarrar
 *    rompe la ilusión al instante.
 * 3. Guarda historial de posiciones y calcula la velocidad sobre una ventana
 *    corta, no sobre los dos últimos puntos. Es lo que permite continuar la
 *    animación a la velocidad exacta del dedo al soltar.
 *
 * No hace setState durante el movimiento: un re-render por frame produce
 * jank. El consumidor recibe los deltas por callback y decide qué hacer
 * (normalmente escribir un MotionValue, que va al compositor sin re-render).
 *
 * IMPORTANTE: el elemento necesita `touch-action` acorde (`none` para
 * arrastrar en ambos ejes, `pan-x` si solo se arrastra en Y). Sin eso el
 * navegador se queda con el gesto y `pointermove` deja de llegar a mitad
 * del arrastre.
 */
export function useArrastre({
  eje = "y",
  umbral = 10,
  onInicio,
  onMover,
  onFin,
}: OpcionesArrastre) {
  const activo = useRef(false);
  const comprometido = useRef(false);
  const inicio = useRef(0);
  const muestras = useRef<Muestra[]>([]);

  const coord = useCallback(
    (e: React.PointerEvent) => (eje === "y" ? e.clientY : e.clientX),
    [eje],
  );

  const onPointerDown = useCallback(
    (e: React.PointerEvent) => {
      // Solo el botón principal; un click derecho no arrastra.
      if (e.button !== 0) return;

      activo.current = true;
      comprometido.current = false;
      inicio.current = coord(e);
      muestras.current = [{ valor: coord(e), t: e.timeStamp }];

      e.currentTarget.setPointerCapture(e.pointerId);
    },
    [coord],
  );

  const onPointerMove = useCallback(
    (e: React.PointerEvent) => {
      if (!activo.current) return;

      const actual = coord(e);
      const delta = actual - inicio.current;

      muestras.current.push({ valor: actual, t: e.timeStamp });
      // Con ~150 ms de historial alcanza para la ventana de velocidad.
      if (muestras.current.length > 12) muestras.current.shift();

      if (!comprometido.current) {
        if (Math.abs(delta) < umbral) return;
        comprometido.current = true;
        onInicio?.();
      }

      onMover?.({ delta });
    },
    [coord, umbral, onInicio, onMover],
  );

  const terminar = useCallback(
    (e: React.PointerEvent) => {
      if (!activo.current) return;
      activo.current = false;

      if (e.currentTarget.hasPointerCapture(e.pointerId)) {
        e.currentTarget.releasePointerCapture(e.pointerId);
      }

      // Sin compromiso fue un tap, no un arrastre: no hay nada que continuar.
      if (!comprometido.current) {
        muestras.current = [];
        return;
      }
      comprometido.current = false;

      const delta = coord(e) - inicio.current;
      const velocidad = velocidadDesde(muestras.current);
      muestras.current = [];

      onFin?.({ delta, velocidad });
    },
    [coord, onFin],
  );

  return {
    onPointerDown,
    onPointerMove,
    onPointerUp: terminar,
    // pointercancel llega cuando el sistema se queda con el gesto (una llamada
    // entrante, el gesto de "atrás" de Android). Sin manejarlo, el elemento
    // queda pegado al dedo para siempre.
    onPointerCancel: terminar,
  };
}
