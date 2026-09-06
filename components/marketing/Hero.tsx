"use client";

import { ArrowRight, ShieldCheck } from "lucide-react";
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

  const opacity = useTransform(scrollYProgress, [0, 0.85], [1, 0]);
  const y = useTransform(scrollYProgress, [0, 1], ["0%", "-18%"]);

  return (
    <section ref={ref} className="relative w-full min-h-[100svh] flex items-center pt-24 pb-16">
      <motion.div
        style={reduceMotion ? undefined : { opacity, y }}
        className="w-full max-w-7xl mx-auto px-5 sm:px-8 lg:px-12 py-12 sm:py-16"
      >
        <div className="grid gap-12 lg:grid-cols-[1.05fr_1.1fr] lg:items-center xl:gap-16">
          {/* Columna Izquierda: Copywriting & CTAs de alta tensión */}
          <div className="max-w-2xl">
            <Fade delay={0.1}>
              <div className="inline-flex items-center gap-2 rounded-full border border-orange-500/30 bg-orange-500/10 px-3.5 py-1 text-xs font-semibold text-orange-400 backdrop-blur-md">
                <span className="h-1.5 w-1.5 rounded-full bg-accent animate-pulse" />
                <span>LUBRICENTRO &amp; MECÁNICA DE PRECISIÓN</span>
              </div>
            </Fade>

            <Fade delay={0.18}>
              <h1 className="t-hero mt-6 text-balance text-white">
                Tu taller, en piloto automático
              </h1>
            </Fade>

            <Fade delay={0.26}>
              <p className="mt-6 text-base sm:text-lg lg:text-xl leading-relaxed text-white/70">
                Órdenes de trabajo con 1 toque, fichas de aceite por patente, stock que descuenta en el
                momento y seguimiento por WhatsApp para tus clientes.
                <strong className="text-white block mt-2">
                  Dejá el cuaderno con grasa en el pasado.
                </strong>
              </p>
            </Fade>

            {/* CTA Button-in-Button Architecture */}
            <Fade delay={0.34} className="mt-10 flex flex-wrap items-center gap-6 sm:gap-8">
              <Link
                href="/login"
                className="group relative inline-flex min-h-14 items-center gap-4 rounded-full bg-accent pl-8 pr-3 font-bold text-accent-foreground shadow-[0_10px_30px_rgba(249,115,22,0.35)] transition-all hover:bg-orange-500 hover:shadow-[0_15px_40px_rgba(249,115,22,0.45)] active:scale-[0.98]"
              >
                <span>Empezar prueba gratis</span>
                <span className="flex h-9 w-9 items-center justify-center rounded-full bg-black/20 text-white transition-transform duration-300 group-hover:scale-110 group-hover:translate-x-0.5">
                  <ArrowRight className="h-4 w-4" />
                </span>
              </Link>

              <Link
                href="#patentes"
                className="inline-flex min-h-12 items-center text-sm font-semibold text-white/80 transition-colors hover:text-white border-b border-white/20 hover:border-white pb-0.5"
              >
                Ver cómo funciona en fosa →
              </Link>
            </Fade>

            {/* Micro badges de confianza */}
            <Fade delay={0.42} className="mt-12 pt-6 border-t border-white/10 flex flex-wrap items-center gap-6 text-xs text-white/60">
              <div className="flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-emerald-400" />
                <span>Datos 100% seguros y privados</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                <span>Funciona rápido y sin demoras en la fosa</span>
              </div>
            </Fade>
          </div>

          {/* Columna Derecha: Mockup Interactivo Vivo */}
          <Fade delay={0.25} className="w-full">
            <InteractiveHeroMockup />
          </Fade>
        </div>
      </motion.div>
    </section>
  );
}
