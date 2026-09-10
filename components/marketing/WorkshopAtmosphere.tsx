"use client";

import { useReducedMotion, useScroll, useTransform } from "motion/react";
import { motion } from "motion/react";
import { useEffect, useState } from "react";

/**
 * Atmósfera Visual de Taller y Fosa de Precisión.
 *
 * Reemplaza el video scrub por una puesta en escena lumínica y geométrica
 * acelerada por hardware (60 FPS fijos, 0 decodificación de video, cero lag de scroll):
 *
 * 1. Iluminación cenital de bahía de servicio (ámbar cálido de lámparas de taller
 *    y cian de instrumental diagnóstico).
 * 2. Rieles y líneas de perspectiva técnica en el suelo (guías de elevador y fosa).
 * 3. Partículas lumínicas ambientales que responden al scroll con paralaje sutil.
 */
export function WorkshopAtmosphere() {
  const reduceMotion = useReducedMotion();
  const { scrollY } = useScroll();

  // Transformaciones suaves basadas en scroll
  const glowY = useTransform(scrollY, [0, 1200], [0, 180]);
  const ambientOpacity = useTransform(scrollY, [0, 600, 1800], [0.85, 0.65, 0.4]);
  const gridY = useTransform(scrollY, [0, 1000], [0, -40]);

  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <div
      aria-hidden
      className="fixed inset-0 -z-10 bg-[#070709] overflow-hidden pointer-events-none select-none"
    >
      {/* 1. Iluminación Cenital de Bahía: Spot ámbar central superior */}
      <motion.div
        style={reduceMotion || !mounted ? undefined : { y: glowY, opacity: ambientOpacity }}
        className="absolute -top-[20%] left-1/2 -translate-x-1/2 w-[85vw] max-w-[1100px] h-[650px] rounded-full blur-[140px] opacity-70 pointer-events-none"
        aria-hidden
      >
        <div className="w-full h-full bg-gradient-to-b from-orange-500/25 via-amber-500/15 to-transparent rounded-full" />
      </motion.div>

      {/* 2. Haz de luz diagnóstica lateral (Cian técnico) */}
      <div
        className="absolute top-[35%] -left-[15%] w-[600px] h-[600px] rounded-full blur-[160px] opacity-20 bg-sky-500/30 pointer-events-none"
        aria-hidden
      />

      {/* 3. Reflejo cálido de elevador/piso de fosa inferior */}
      <div
        className="absolute bottom-[-10%] right-[-10%] w-[700px] h-[500px] rounded-full blur-[150px] opacity-25 bg-orange-600/20 pointer-events-none"
        aria-hidden
      />

      {/* 4. Grilla de precisión técnica y líneas de fosa en perspectiva */}
      <motion.div
        style={reduceMotion || !mounted ? undefined : { y: gridY }}
        className="absolute inset-0 opacity-[0.07] pointer-events-none"
        aria-hidden
      >
        <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="fosa-grid" width="60" height="60" patternUnits="userSpaceOnUse">
              <path
                d="M 60 0 L 0 0 0 60"
                fill="none"
                stroke="rgba(255, 255, 255, 0.6)"
                strokeWidth="0.75"
              />
              <circle cx="0" cy="0" r="1.5" fill="rgba(249, 115, 22, 0.8)" />
            </pattern>
            {/* Gradiente de atenuación para que la grilla se funda en el espacio */}
            <radialGradient id="grid-mask" cx="50%" cy="35%" r="65%">
              <stop offset="0%" stopColor="#fff" />
              <stop offset="60%" stopColor="#fff" stopOpacity="0.4" />
              <stop offset="100%" stopColor="#000" stopOpacity="0" />
            </radialGradient>
            <mask id="fosa-mask">
              <rect width="100%" height="100%" fill="url(#grid-mask)" />
            </mask>
          </defs>
          <rect width="100%" height="100%" fill="url(#fosa-grid)" mask="url(#fosa-mask)" />
        </svg>
      </motion.div>

      {/* 5. Líneas longitudinales de fosa (guías de ruedas de elevador) */}
      <div className="absolute inset-0 flex justify-center pointer-events-none opacity-[0.09]" aria-hidden>
        <div className="w-full max-w-6xl h-full border-x border-dashed border-orange-500" />
      </div>

      {/* 6. Viñeta perimetral de contraste para garantizar legibilidad absoluta de textos */}
      <div className="absolute inset-0 bg-radial-[circle_at_center,transparent_20%,#070709_90%] pointer-events-none" />
      <div className="absolute inset-0 bg-gradient-to-b from-[#070709]/60 via-transparent to-[#070709] pointer-events-none" />
    </div>
  );
}
