"use client";

import { useEffect, useState, useRef, useSyncExternalStore } from "react";
import Image from "next/image";
import { motion, useReducedMotion, useScroll, useTransform, useSpring } from "motion/react";

/**
 * Escenas Fotográficas Reales de Taller y Fosa de Precisión:
 * 1. Bahía principal con Toyota Hilux en elevador hidráulico sobre fosa.
 * 2. Vista desde la fosa mirando cárter, tren delantero y recuperador de aceite.
 * 3. Bahía diagnóstica con motor turbo diesel y tablet de telemetría.
 */
const SCENES = [
  {
    id: "bay",
    src: "/img/marketing/hero-fosa-hilux.jpg",
    alt: "Taller mecánico y lubricentro argentino con Toyota Hilux en elevador",
  },
  {
    id: "pit",
    src: "/img/marketing/fosa-carter.jpg",
    alt: "Fosa de lubricentro con vista de cárter y suspensión",
  },
  {
    id: "diag",
    src: "/img/marketing/motor-diagnostico.jpg",
    alt: "Diagnóstico computarizado de motor turbo diesel",
  },
] as const;

const emptySubscribe = () => () => {};

export function WorkshopAtmosphere() {
  const reduceMotion = useReducedMotion();
  const containerRef = useRef<HTMLDivElement>(null);
  const mounted = useSyncExternalStore(emptySubscribe, () => true, () => false);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  const { scrollYProgress } = useScroll();

  // Suavizado cinemático de scroll
  const smoothProgress = useSpring(scrollYProgress, {
    stiffness: 70,
    damping: 24,
    restDelta: 0.001,
  });

  // Opacidades y escalas por etapa del scroll
  // Escena 1 (Hero e Introducción: 0% a 35%)
  const scene1Opacity = useTransform(smoothProgress, [0, 0.2, 0.38], [0.85, 0.85, 0]);
  const scene1Scale = useTransform(smoothProgress, [0, 0.35], [1.02, 1.1]);
  const scene1Y = useTransform(smoothProgress, [0, 0.35], ["0%", "-5%"]);

  // Escena 2 (Fosa y Chasis Técnico: 25% a 70%)
  const scene2Opacity = useTransform(smoothProgress, [0.28, 0.42, 0.58, 0.7], [0, 0.8, 0.8, 0]);
  const scene2Scale = useTransform(smoothProgress, [0.28, 0.7], [1.04, 1.12]);
  const scene2Y = useTransform(smoothProgress, [0.28, 0.7], ["4%", "-4%"]);

  // Escena 3 (Diagnóstico y Motor: 60% a 95%)
  const scene3Opacity = useTransform(smoothProgress, [0.62, 0.76, 0.88, 0.98], [0, 0.75, 0.75, 0.2]);
  const scene3Scale = useTransform(smoothProgress, [0.62, 1], [1.05, 1.12]);

  // Láser de escaneo óptico / barra de luz que barre con el scroll
  const scanLaserY = useTransform(smoothProgress, [0, 1], ["5%", "95%"]);

  // Paralaje de mouse sutil (tilt 3D)
  useEffect(() => {
    if (reduceMotion) return;

    const handleMouseMove = (e: MouseEvent) => {
      const { innerWidth, innerHeight } = window;
      const x = (e.clientX / innerWidth - 0.5) * 16; // ±8px
      const y = (e.clientY / innerHeight - 0.5) * 16; // ±8px
      setMousePos({ x, y });
    };

    window.addEventListener("mousemove", handleMouseMove, { passive: true });
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, [reduceMotion]);

  return (
    <div
      ref={containerRef}
      aria-hidden
      className="fixed inset-0 -z-10 bg-[#f8fafc] overflow-hidden pointer-events-none select-none"
    >
      {/* ── PLANO 0: Iluminación de Bahía & Grilla de Precisión Técnica ── */}
      <div className="absolute inset-0 bg-radial-[circle_at_50%_15%,rgba(249,115,22,0.12)_0%,transparent_65%] pointer-events-none" />
      <div className="absolute inset-0 bg-radial-[circle_at_15%_45%,rgba(14,165,233,0.08)_0%,transparent_60%] pointer-events-none" />

      {/* Grilla técnica sutil de ingeniería de taller */}
      <div className="absolute inset-0 opacity-[0.07] pointer-events-none">
        <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="fosa-blueprint-grid" width="48" height="48" patternUnits="userSpaceOnUse">
              <path
                d="M 48 0 L 0 0 0 48"
                fill="none"
                stroke="rgba(0, 0, 0, 0.15)"
                strokeWidth="0.7"
              />
              <circle cx="0" cy="0" r="1.2" fill="rgba(249, 115, 22, 0.7)" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#fosa-blueprint-grid)" />
        </svg>
      </div>

      {/* ── PLANO 1: Escenografía Fotográfica Real con Transición Cinemática por Scroll ── */}
      <motion.div
        style={
          reduceMotion || !mounted
            ? undefined
            : {
                x: mousePos.x,
                y: mousePos.y,
              }
        }
        className="absolute inset-0 w-full h-full transition-transform duration-700 ease-out"
      >
        {/* Escena 1: Bahía Principal - Toyota Hilux en Elevador */}
        <motion.div
          style={reduceMotion || !mounted ? undefined : { opacity: scene1Opacity, scale: scene1Scale, y: scene1Y }}
          className="absolute inset-0 w-full h-full will-change-transform"
        >
          <Image
            src={SCENES[0].src}
            alt={SCENES[0].alt}
            fill
            priority
            sizes="100vw"
            className="object-cover object-[center_32%] sm:object-center filter brightness-[1.02] contrast-[1.08] opacity-30 mix-blend-multiply"
          />
        </motion.div>

        {/* Escena 2: Perspectiva de Fosa y Cárter */}
        <motion.div
          style={reduceMotion || !mounted ? undefined : { opacity: scene2Opacity, scale: scene2Scale, y: scene2Y }}
          className="absolute inset-0 w-full h-full will-change-transform"
        >
          <Image
            src={SCENES[1].src}
            alt={SCENES[1].alt}
            fill
            sizes="100vw"
            className="object-cover object-[center_38%] sm:object-center filter brightness-[1.02] contrast-[1.08] opacity-25 mix-blend-multiply"
          />
        </motion.div>

        {/* Escena 3: Diagnóstico Computarizado & Motor */}
        <motion.div
          style={reduceMotion || !mounted ? undefined : { opacity: scene3Opacity, scale: scene3Scale }}
          className="absolute inset-0 w-full h-full will-change-transform"
        >
          <Image
            src={SCENES[2].src}
            alt={SCENES[2].alt}
            fill
            sizes="100vw"
            className="object-cover object-[center_45%] sm:object-center filter brightness-[1.02] contrast-[1.08] opacity-25 mix-blend-multiply"
          />
        </motion.div>
      </motion.div>

      {/* ── PLANO 2: Láser Óptico de Telemetría (Línea de Escaneo de Taller) ── */}
      {!reduceMotion && mounted && (
        <motion.div
          style={{ top: scanLaserY }}
          className="absolute left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-orange-500/40 to-transparent shadow-[0_0_12px_rgba(249,115,22,0.4)] opacity-40 pointer-events-none overflow-hidden"
        >
          <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-48 h-3 bg-orange-400/20 blur-md rounded-full" />
        </motion.div>
      )}

      {/* Micro-partículas lumínicas ambientales flotantes */}
      {!reduceMotion && mounted && (
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute top-1/4 left-1/5 w-1.5 h-1.5 rounded-full bg-orange-500/30 blur-[0.5px] animate-pulse" />
          <div className="absolute top-1/2 right-1/4 w-2 h-2 rounded-full bg-amber-500/25 blur-[1px] animate-ping" />
          <div className="absolute bottom-1/3 left-1/3 w-1 h-1 rounded-full bg-cyan-500/30 blur-[0.5px] animate-pulse" />
        </div>
      )}

      {/* ── PLANO 3: Scrims & Viñeteado Cinemático para Contraste Impecable de Textos ── */}
      {/* Gradiente vertical calibrado para mobile y desktop en modo claro */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#f8fafc]/92 via-[#f8fafc]/75 to-[#f8fafc]/98 sm:from-[#f8fafc]/88 sm:via-[#f8fafc]/65 sm:to-[#f8fafc]/98 pointer-events-none" />

      {/* Gradiente lateral izquierdo para anclar la columna de lectura en desktop */}
      <div className="absolute inset-0 bg-gradient-to-r from-[#f8fafc]/95 via-[#f8fafc]/75 to-[#f8fafc]/40 sm:to-transparent pointer-events-none" />

      {/* Viñeta perimetral de contraste suave */}
      <div className="absolute inset-0 bg-radial-[circle_at_center,transparent_45%,#f8fafc_95%] pointer-events-none" />
    </div>
  );
}
