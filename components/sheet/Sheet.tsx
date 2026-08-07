"use client";

import { useCallback, useEffect, useRef } from "react";
import { animate, motion, useMotionValue, useReducedMotion, useTransform } from "motion/react";

import { useArrastre } from "@/lib/gesto/useArrastre";
import { acotarElastico, detentDestino } from "@/lib/gesto/fisica";

/**
 * Spring de cajón con los valores que usa Apple para sheets:
 * damping 0.8 / response 0.3. En la API de Motion `bounce` es el complemento
 * del damping y `duration` es el response — NO es una duración fija: un spring
 * no tiene duración, el tiempo de asentamiento sale de los parámetros.
 */
const SPRING = { type: "spring", bounce: 0.2, duration: 0.3 } as const;

export interface SheetProps {
  abierto: boolean;
  /** Se llama cuando el sheet YA terminó de salir de pantalla. */
  onCerrar: () => void;
  /** Fracciones del alto del sheet donde puede quedar apoyado. 1 = completo. */
  detents?: readonly number[];
  titulo?: string;
  children: React.ReactNode;
}

export function Sheet({ abierto, onCerrar, detents = [1], titulo, children }: SheetProps) {
  const panelRef = useRef<HTMLDivElement>(null);
  const reducirMovimiento = useReducedMotion();

  // Desplazamiento hacia abajo desde "abierto del todo", en px.
  // 0 = arriba de todo; alto del panel = fuera de pantalla.
  const y = useMotionValue(0);

  // El alto se lee del DOM cuando hace falta en vez de guardarse en estado:
  // así no hay un setState dentro de un efecto (que dispara renders en
  // cascada) ni un render extra entre montar y medir.
  const altoPanel = () => panelRef.current?.offsetHeight ?? 0;
  const tope = useCallback(
    () => altoPanel() * (1 - Math.max(...detents)),
    [detents],
  );

  // El scrim acompaña al gesto en tiempo real: arrastrar el sheet hacia abajo
  // aclara el fondo mientras se arrastra. Si solo cambiara al abrir y cerrar,
  // el gesto se sentiría desconectado del resultado.
  const opacidadScrim = useTransform(y, (v) => {
    const h = altoPanel();
    return h ? 1 - Math.min(Math.max(v / h, 0), 1) : 1;
  });

  // Entrada. Corre una sola vez por apertura.
  useEffect(() => {
    if (!abierto) return;
    const h = altoPanel();
    y.set(h);
    if (reducirMovimiento) {
      y.set(tope());
      return;
    }
    const controls = animate(y, tope(), SPRING);
    return () => controls.stop();
  }, [abierto, reducirMovimiento, tope, y]);

  /**
   * Única vía de cierre. Anima la salida y recién ahí avisa al padre, para que
   * el desmontaje ocurra cuando el panel ya está fuera de pantalla.
   */
  const cerrar = useCallback(
    (velocidad = 0) => {
      if (reducirMovimiento) {
        onCerrar();
        return;
      }
      animate(y, altoPanel(), { ...SPRING, velocity: velocidad }).then(onCerrar);
    },
    [onCerrar, reducirMovimiento, y],
  );

  const arrastre = useArrastre({
    eje: "y",
    onMover: ({ delta }) => {
      const base = tope();
      const h = altoPanel();
      // Hacia abajo sigue al dedo 1:1; hacia arriba del tope resiste.
      y.set(acotarElastico(base + delta, base, h, h));
    },
    onFin: ({ velocidad }) => {
      const h = altoPanel();
      // Posiciones posibles, incluida "cerrado" (= alto completo).
      const posiciones = [...detents.map((d) => h * (1 - d)), h];
      const destino = detentDestino(y.get(), velocidad, posiciones);

      // Se decide por dónde iba el gesto, no por dónde quedó el dedo: por eso
      // un flick corto y rápido cierra aunque haya soltado casi arriba.
      if (destino >= h) {
        cerrar(velocidad);
        return;
      }
      animate(y, destino, { ...SPRING, velocity: velocidad });
    },
  });

  useEffect(() => {
    if (!abierto) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") cerrar();
    };
    document.addEventListener("keydown", onKey);
    const overflowPrevio = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = overflowPrevio;
    };
  }, [abierto, cerrar]);

  if (!abierto) return null;

  return (
    <div className="fixed inset-0 z-50" role="dialog" aria-modal="true" aria-label={titulo}>
      <motion.button
        type="button"
        aria-label="Cerrar"
        onClick={() => cerrar()}
        style={{ opacity: opacidadScrim }}
        className="absolute inset-0 w-full cursor-default bg-slate-900/50"
      />

      <motion.div
        ref={panelRef}
        style={{ y }}
        className="material material-thick backdrop-blur-2xl backdrop-saturate-150 sin-transparencia:backdrop-blur-none absolute inset-x-0 bottom-0 max-h-[90dvh] overflow-hidden rounded-t-[var(--radius-lg)] pb-[var(--safe-bottom)]"
      >
        {/* Zona de agarre. `touch-none` es obligatorio: sin eso el navegador se
            queda con el gesto vertical y pointermove deja de llegar a mitad
            del arrastre. */}
        <div
          {...arrastre}
          className="flex cursor-grab touch-none flex-col items-center gap-1 px-4 pt-3 pb-2 active:cursor-grabbing"
        >
          <div className="h-1 w-9 rounded-full bg-slate-300" />
          {titulo && <h2 className="pt-1 text-base font-semibold text-foreground">{titulo}</h2>}
        </div>

        <div className="max-h-[calc(90dvh-4rem)] overflow-y-auto overscroll-contain px-4 pb-4">
          {children}
        </div>
      </motion.div>
    </div>
  );
}
