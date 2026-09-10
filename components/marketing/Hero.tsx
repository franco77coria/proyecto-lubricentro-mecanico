"use client";

import { ArrowRight, ShieldCheck, Droplets } from "lucide-react";
import { motion, useReducedMotion, useScroll, useTransform } from "motion/react";
import Link from "next/link";
import { useRef } from "react";
import { InteractiveHeroMockup } from "./InteractiveHeroMockup";

const EASE = [0.23, 1, 0.32, 1] as const;

function Fade({
  children,
  delay = 0,
  className,
}: {
  children: React.ReactNode;
  delay?: number;
  className?: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.7, delay, ease: EASE }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

export function Hero() {
  const ref = useRef<HTMLDivElement>(null);
  const reduceMotion = useReducedMotion();

  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start start", "end start"],
  });

  // Planos de profundidad paralaje independientes (Nate's Layering Standard)
  const opacity = useTransform(scrollYProgress, [0, 0.85], [1, 0]);
  const yContent = useTransform(scrollYProgress, [0, 1], ["0px", "-45px"]);
  const yChipTop = useTransform(scrollYProgress, [0, 1], ["0px", "-50px"]);
  const yChipBottom = useTransform(scrollYProgress, [0, 1], ["0px", "40px"]);
  const bayLighting = useTransform(scrollYProgress, [0, 0.8], [1, 0.3]);

  return (
    <section ref={ref} className="relative w-full min-h-[100svh] flex items-center pt-20 sm:pt-24 pb-12 sm:pb-16 overflow-hidden">
      {/* ── PLANO 0 & 1: Iluminación de Bahía de Servicio y Guías de Elevador ── */}
      <motion.div
        style={reduceMotion ? undefined : { opacity: bayLighting }}
        className="absolute inset-0 pointer-events-none -z-10 overflow-hidden"
        aria-hidden
      >
        {/* Haz de luz de reflector de fosa apuntando al elevador */}
        <div className="absolute top-1/4 right-[15%] w-[320px] sm:w-[500px] h-[320px] sm:h-[500px] rounded-full bg-radial from-orange-500/10 via-orange-500/5 to-transparent blur-3xl" />
        <div className="absolute top-1/3 right-[30%] w-[240px] sm:w-[350px] h-[240px] sm:h-[350px] rounded-full bg-radial from-cyan-500/8 to-transparent blur-2xl" />

        {/* Columnas estructurales de elevador hidráulico en perspectiva sutil */}
        <div className="absolute right-[5%] top-12 bottom-0 w-px bg-gradient-to-b from-black/10 via-black/5 to-transparent hidden lg:block" />
        <div className="absolute right-[46%] top-12 bottom-0 w-px bg-gradient-to-b from-black/10 via-black/5 to-transparent hidden lg:block" />
      </motion.div>

      <motion.div
        style={reduceMotion ? undefined : { opacity, y: yContent }}
        className="w-full max-w-7xl mx-auto px-3.5 sm:px-8 lg:px-12 py-6 sm:py-12 relative z-10"
      >
        <div className="grid gap-10 lg:grid-cols-[1.05fr_1.1fr] lg:items-center xl:gap-16">
          {/* ── Columna Izquierda: Copywriting & Propuesta de Valor ── */}
          <div className="max-w-2xl">
            <Fade delay={0.08}>
              <div className="inline-flex items-center gap-2 rounded-full border border-orange-500/30 bg-orange-500/10 px-3 py-1 sm:px-3.5 sm:py-1.5 text-[11px] sm:text-xs font-semibold text-orange-600 backdrop-blur-md shadow-[0_2px_10px_rgba(249,115,22,0.1)]">
                <span className="h-2 w-2 rounded-full bg-accent animate-pulse shrink-0" />
                <span className="tracking-wide uppercase font-bold truncate">Software de Fosa &amp; Taller Mecánico</span>
              </div>
            </Fade>

            <Fade delay={0.16}>
              <h1 className="t-hero mt-4 sm:mt-6 text-balance text-zinc-950 font-black tracking-tight">
                El control de tu taller, <br className="hidden sm:inline" />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-zinc-950 via-zinc-800 to-orange-600">
                  sin cuaderno de papel.
                </span>
              </h1>
            </Fade>

            <Fade delay={0.24}>
              <p className="mt-4 sm:mt-6 text-sm sm:text-base lg:text-xl leading-relaxed text-zinc-600">
                Diseñado para la fosa real argentina: órdenes de trabajo en 1 toque, fichas de cárter por
                patente (<strong className="text-zinc-900">Hilux, Amarok, Ranger, Fluence</strong>), stock de aceite sincronizado y avisos de WhatsApp con fotos para que el cliente no llame todo el día.
              </p>
            </Fade>

            {/* CTA Principal Button-in-Button */}
            <Fade delay={0.32} className="mt-7 sm:mt-9 flex flex-col sm:flex-row items-stretch sm:items-center gap-3.5 sm:gap-7">
              <Link
                href="/login"
                className="group relative inline-flex min-h-12 sm:min-h-14 items-center justify-center sm:justify-start gap-3 sm:gap-4 rounded-full bg-accent px-6 sm:pl-8 sm:pr-3.5 font-bold text-accent-foreground shadow-[0_10px_35px_rgba(249,115,22,0.3)] transition-all hover:bg-orange-500 hover:shadow-[0_15px_45px_rgba(249,115,22,0.4)] active:scale-[0.98] text-center text-xs sm:text-sm"
              >
                <span>Empezar prueba gratis de 7 días</span>
                <span className="flex h-8 w-8 sm:h-9 sm:w-9 items-center justify-center rounded-full bg-black/20 text-white transition-transform duration-300 group-hover:scale-110 group-hover:translate-x-0.5 shrink-0">
                  <ArrowRight className="h-4 w-4" />
                </span>
              </Link>

              <Link
                href="#patentes"
                className="inline-flex min-h-11 items-center justify-center sm:justify-start text-xs sm:text-sm font-semibold text-zinc-700 transition-colors hover:text-zinc-950 border-b border-zinc-300 hover:border-zinc-900 pb-0.5 text-center"
              >
                Ver ficha de cárter por patente →
              </Link>
            </Fade>

            {/* Micro badges de confianza de taller */}
            <Fade delay={0.4} className="mt-8 sm:mt-10 pt-5 sm:pt-6 border-t border-black/10 flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-6 text-xs text-zinc-500">
              <div className="flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-emerald-600 shrink-0" />
                <span>Datos protegidos por Postgres multi-taller</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-emerald-500 shrink-0" />
                <span>IA Gemini 3.0 para Cédula Verde y Diagnóstico</span>
              </div>
            </Fade>
          </div>

          {/* ── Columna Derecha: PLANO 2 (Terminal de Fosa) & PLANO 3 (Micro-HUD Flotante) ── */}
          <Fade delay={0.22} className="w-full relative min-w-0">
            {/* Micro-HUD Flotante Superior (Plano 3 - Paralaje rápido hacia arriba) */}
            <motion.div
              style={reduceMotion ? undefined : { y: yChipTop }}
              className="absolute -top-6 -right-2 sm:-right-4 z-20 hidden sm:flex items-center gap-2.5 rounded-2xl bg-white/95 border border-emerald-500/30 px-3.5 py-2 shadow-[0_10px_25px_rgba(0,0,0,0.08)] backdrop-blur-md"
            >
              <span className="flex h-2.5 w-2.5 rounded-full bg-emerald-500 animate-ping" />
              <div className="text-[11px] leading-tight">
                <span className="font-bold text-zinc-900 block">Cédula Verde Leída (IA)</span>
                <span className="font-mono text-emerald-600 font-semibold text-[10px]">LSJ 982 · Chasis OK</span>
              </div>
            </motion.div>

            {/* Micro-HUD Flotante Inferior (Plano 3 - Paralaje suave hacia abajo) */}
            <motion.div
              style={reduceMotion ? undefined : { y: yChipBottom }}
              className="absolute -bottom-6 -left-2 sm:-left-4 z-20 hidden sm:flex items-center gap-2.5 rounded-2xl bg-white/95 border border-orange-500/30 px-3.5 py-2 shadow-[0_10px_25px_rgba(0,0,0,0.08)] backdrop-blur-md"
            >
              <Droplets className="h-4 w-4 text-orange-500 shrink-0" />
              <div className="text-[11px] leading-tight">
                <span className="font-bold text-zinc-900 block">Stock Sincronizado</span>
                <span className="text-orange-600 text-[10px] font-semibold">-7.5L SAE 5W-30 en elevador</span>
              </div>
            </motion.div>

            {/* Terminal Interactiva en Plano Dimensional con leve perspectiva 3D */}
            <div className="relative transform-gpu lg:perspective-1000 w-full min-w-0">
              <div className="transition-transform duration-500 lg:rotate-y-[-2deg] lg:rotate-x-[1deg] hover:rotate-0 w-full min-w-0">
                <InteractiveHeroMockup />
              </div>
            </div>
          </Fade>
        </div>
      </motion.div>
    </section>
  );
}
