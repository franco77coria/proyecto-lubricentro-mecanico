"use client";

import { useEffect, useId, useRef, useState } from "react";
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

const rad = (grados: number) => (grados * Math.PI) / 180;
const enArco = (v: number, r: number) => {
  const a = rad(ANGULO_INICIAL + v * GRADOS_ARCO);
  return [CENTRO + Math.cos(a) * r, CENTRO + Math.sin(a) * r] as const;
};

export type EstadoTacometro = "ralenti" | "acelerando" | "corte";

/**
 * El instrumento se dibuja sobre dos fondos distintos (la tarjeta clara y el
 * panel de marca oscuro), así que los colores no pueden salir de los tokens
 * de superficie: sobre el gradiente oscuro, `--muted` y `--border`
 * desaparecen y el arco se vuelve invisible.
 */
const TEMA = {
  claro: { pista: "var(--muted)", marca: "var(--border)", centro: "var(--card)" },
  oscuro: { pista: "rgb(255 255 255 / 0.14)", marca: "rgb(255 255 255 / 0.28)", centro: "#0b1220" },
} as const;

/**
 * Tacómetro del login.
 *
 * Barre de 0 a la zona roja al montar y queda en ralentí. Al entrar, sube y
 * corta.
 *
 * La aguja se dibuja calculando sus coordenadas, no rotando un grupo: el
 * `transform-origin` dentro de un SVG se resuelve distinto según el navegador
 * y la aguja terminaba apuntando a cualquier lado. Con las coordenadas
 * calculadas no hay ambigüedad posible.
 *
 * El ralentí oscila a ~1.4 Hz y no más lento: una animación que se repite sin
 * parar cerca de 0.2 Hz molesta en una pantalla que se mira fijo.
 */
export function Tacometro({
  estado = "ralenti",
  tema = "claro",
}: {
  estado?: EstadoTacometro;
  tema?: keyof typeof TEMA;
}) {
  const paleta = TEMA[tema];
  const svgRef = useRef<SVGSVGElement>(null);

  /**
   * El ralentí es un loop infinito. En celular el panel de marca está oculto
   * por CSS pero el componente igual se monta, así que sin esto quedaría una
   * animación corriendo para siempre sobre algo que nadie ve, gastando batería.
   * Un elemento con `display: none` nunca intersecta, así que el observer lo
   * detecta sin necesidad de duplicar los breakpoints en JS.
   */
  const [visible, setVisible] = useState(true);
  useEffect(() => {
    const el = svgRef.current;
    if (!el) return;
    const obs = new IntersectionObserver(([e]) => setVisible(e.isIntersecting));
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  // Un id fijo haría que dos instancias compartan el mismo gradiente.
  const idGradiente = `taco-${useId().replace(/:/g, "")}`;
  const reducirMovimiento = useReducedMotion();
  const valor = useMotionValue(reducirMovimiento ? RALENTI : 0);

  const agujaX = useTransform(valor, (v) => enArco(v, RADIO - 26)[0]);
  const agujaY = useTransform(valor, (v) => enArco(v, RADIO - 26)[1]);
  const colaX = useTransform(valor, (v) => enArco(v, -14)[0]);
  const colaY = useTransform(valor, (v) => enArco(v, -14)[1]);
  const dashProgreso = useTransform(valor, (v) => `${v * LARGO_ARCO} ${CIRCUNFERENCIA}`);

  // Barrido de bienvenida: 0 → redline → ralentí. Solo al montar.
  useEffect(() => {
    if (reducirMovimiento || !visible) return;
    const controls = animate(valor, [0, REDLINE, RALENTI], {
      duration: 1.4,
      times: [0, 0.45, 1],
      ease: [0.16, 1, 0.3, 1],
    });
    return () => controls.stop();
  }, [reducirMovimiento, visible, valor]);

  useEffect(() => {
    if (reducirMovimiento || !visible) return;

    if (estado === "ralenti") {
      const controls = animate(valor, [RALENTI, RALENTI + 0.022, RALENTI], {
        duration: 0.7,
        repeat: Infinity,
        ease: "easeInOut",
        delay: 1.4,
      });
      return () => controls.stop();
    }

    const destino = estado === "acelerando" ? 0.6 : 0.97;
    const controls = animate(valor, destino, {
      type: "spring",
      bounce: estado === "corte" ? 0.35 : 0.2,
      duration: 0.5,
    });
    return () => controls.stop();
  }, [estado, reducirMovimiento, visible, valor]);

  return (
    <svg ref={svgRef} viewBox="0 0 240 240" className="h-full w-full" aria-hidden>
      <defs>
        <linearGradient id={idGradiente} x1="0" y1="1" x2="1" y2="0">
          <stop offset="0%" stopColor="var(--accent)" stopOpacity="0.55" />
          <stop offset="100%" stopColor="var(--accent)" />
        </linearGradient>
      </defs>

      {/* Arco de fondo */}
      <circle
        cx={CENTRO}
        cy={CENTRO}
        r={RADIO}
        fill="none"
        stroke={paleta.pista}
        strokeWidth={9}
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
        strokeWidth={9}
        strokeLinecap="round"
        strokeDasharray={`${LARGO_ARCO * (1 - REDLINE)} ${CIRCUNFERENCIA}`}
        transform={`rotate(${ANGULO_INICIAL + REDLINE * GRADOS_ARCO} ${CENTRO} ${CENTRO})`}
        opacity={0.28}
      />

      {/* Progreso */}
      <motion.circle
        cx={CENTRO}
        cy={CENTRO}
        r={RADIO}
        fill="none"
        stroke={`url(#${idGradiente})`}
        strokeWidth={9}
        strokeLinecap="round"
        style={{ strokeDasharray: dashProgreso }}
        transform={`rotate(${ANGULO_INICIAL} ${CENTRO} ${CENTRO})`}
      />

      {/* Marcas cada 10%. Posiciones calculadas, nunca aleatorias: un
          Math.random() en el render rompe la hidratación. */}
      {Array.from({ length: 11 }, (_, i) => {
        const v = i / 10;
        const mayor = i % 5 === 0;
        const [x1, y1] = enArco(v, RADIO - 17);
        const [x2, y2] = enArco(v, RADIO - 17 - (mayor ? 11 : 6));
        return (
          <line
            key={i}
            x1={x1}
            y1={y1}
            x2={x2}
            y2={y2}
            stroke={v >= REDLINE ? "var(--destructive)" : paleta.marca}
            strokeWidth={mayor ? 3 : 1.75}
            strokeLinecap="round"
            opacity={v >= REDLINE ? 0.6 : 1}
          />
        );
      })}

      {/* Aguja */}
      <motion.line
        x1={colaX}
        y1={colaY}
        x2={agujaX}
        y2={agujaY}
        stroke="var(--accent)"
        strokeWidth={3.5}
        strokeLinecap="round"
      />
      <circle cx={CENTRO} cy={CENTRO} r={9} fill={paleta.centro} stroke="var(--accent)" strokeWidth={3} />
    </svg>
  );
}
