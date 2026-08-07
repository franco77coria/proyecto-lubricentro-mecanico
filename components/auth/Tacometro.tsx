"use client";

import { useEffect } from "react";
import { animate, motion, useMotionValue, useReducedMotion, useTransform } from "motion/react";

const CENTRO = 120;
const RADIO = 92;
const CIRCUNFERENCIA = 2 * Math.PI * RADIO;

/** Arco de 270°, como un tablero de verdad: de 135° a 405°. */
const FRACCION_ARCO = 0.75;
const LARGO_ARCO = CIRCUNFERENCIA * FRACCION_ARCO;
const GRADOS_ARCO = 360 * FRACCION_ARCO;
const ANGULO_INICIAL = 135;

/** Dónde empieza la zona roja. */
const REDLINE = 0.82;

const RALENTI = 0.12;

export type EstadoTacometro = "ralenti" | "acelerando" | "corte";

/**
 * Tacómetro del login.
 *
 * Barre de 0 a redline al montar y se queda en ralentí. Al entrar, sube y
 * corta.
 *
 * El ralentí oscila a ~1.4 Hz y no más lento: una animación que se repite sin
 * parar cerca de 0.2 Hz (un ciclo cada cinco segundos) resulta molesta en una
 * pantalla que se está mirando fijo.
 */
export function Tacometro({ estado = "ralenti" }: { estado?: EstadoTacometro }) {
  const reducirMovimiento = useReducedMotion();
  const valor = useMotionValue(reducirMovimiento ? RALENTI : 0);

  const anguloAguja = useTransform(valor, (v) => ANGULO_INICIAL + v * GRADOS_ARCO);
  const largoProgreso = useTransform(valor, (v) => v * LARGO_ARCO);

  // Barrido de bienvenida: 0 → redline → ralentí. Solo al montar.
  useEffect(() => {
    if (reducirMovimiento) return;
    const controls = animate(valor, [0, REDLINE, RALENTI], {
      duration: 1.4,
      times: [0, 0.45, 1],
      ease: [0.16, 1, 0.3, 1],
    });
    return () => controls.stop();
  }, [reducirMovimiento, valor]);

  useEffect(() => {
    if (reducirMovimiento) return;

    if (estado === "ralenti") {
      // Vibración de motor en marcha lenta.
      const controls = animate(valor, [RALENTI, RALENTI + 0.02, RALENTI], {
        duration: 0.7,
        repeat: Infinity,
        ease: "easeInOut",
        delay: 1.4,
      });
      return () => controls.stop();
    }

    if (estado === "acelerando") {
      const controls = animate(valor, 0.6, { type: "spring", bounce: 0.2, duration: 0.5 });
      return () => controls.stop();
    }

    // Corte: sube al redline y se apoya ahí.
    const controls = animate(valor, 0.97, { type: "spring", bounce: 0.35, duration: 0.5 });
    return () => controls.stop();
  }, [estado, reducirMovimiento, valor]);

  return (
    <svg
      viewBox="0 0 240 240"
      className="h-full w-full"
      role="img"
      aria-label="Tacómetro"
      // El SVG es decorativo: el estado real lo comunican el botón y el texto.
      aria-hidden
    >
      {/* Arco de fondo */}
      <circle
        cx={CENTRO}
        cy={CENTRO}
        r={RADIO}
        fill="none"
        stroke="var(--border)"
        strokeWidth={6}
        strokeLinecap="round"
        strokeDasharray={`${LARGO_ARCO} ${CIRCUNFERENCIA}`}
        transform={`rotate(${ANGULO_INICIAL} ${CENTRO} ${CENTRO})`}
      />

      {/* Zona roja */}
      <circle
        cx={CENTRO}
        cy={CENTRO}
        r={RADIO}
        fill="none"
        stroke="var(--destructive)"
        strokeWidth={6}
        strokeLinecap="round"
        strokeDasharray={`${LARGO_ARCO * (1 - REDLINE)} ${CIRCUNFERENCIA}`}
        transform={`rotate(${ANGULO_INICIAL + REDLINE * GRADOS_ARCO} ${CENTRO} ${CENTRO})`}
        opacity={0.35}
      />

      {/* Progreso */}
      <motion.circle
        cx={CENTRO}
        cy={CENTRO}
        r={RADIO}
        fill="none"
        stroke="var(--accent)"
        strokeWidth={6}
        strokeLinecap="round"
        style={{ strokeDasharray: useTransform(largoProgreso, (l) => `${l} ${CIRCUNFERENCIA}`) }}
        transform={`rotate(${ANGULO_INICIAL} ${CENTRO} ${CENTRO})`}
      />

      {/* Marcas cada 10%. Posiciones calculadas, nunca aleatorias: un
          Math.random() en el render rompe la hidratación. */}
      {Array.from({ length: 11 }, (_, i) => {
        const angulo = ANGULO_INICIAL + (i / 10) * GRADOS_ARCO;
        const rad = (angulo * Math.PI) / 180;
        const interior = RADIO - 14;
        const mayor = i % 5 === 0;
        return (
          <line
            key={i}
            x1={CENTRO + Math.cos(rad) * interior}
            y1={CENTRO + Math.sin(rad) * interior}
            x2={CENTRO + Math.cos(rad) * (interior - (mayor ? 10 : 6))}
            y2={CENTRO + Math.sin(rad) * (interior - (mayor ? 10 : 6))}
            stroke="var(--border)"
            strokeWidth={mayor ? 2.5 : 1.5}
            strokeLinecap="round"
          />
        );
      })}

      {/* Aguja */}
      <motion.g style={{ rotate: anguloAguja, originX: "120px", originY: "120px" }}>
        <line
          x1={CENTRO - 12}
          y1={CENTRO}
          x2={CENTRO + RADIO - 22}
          y2={CENTRO}
          stroke="var(--accent)"
          strokeWidth={3}
          strokeLinecap="round"
        />
      </motion.g>
      <circle cx={CENTRO} cy={CENTRO} r={7} fill="var(--card)" stroke="var(--accent)" strokeWidth={2.5} />
    </svg>
  );
}
