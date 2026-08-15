"use client";

import { ArrowRight } from "lucide-react";
import { motion, useReducedMotion, useScroll, useTransform } from "motion/react";
import Link from "next/link";
import { useRef } from "react";

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

/* Solo la copy: el video vive en VideoBackdrop, fijo detrás de toda la
   página. Esta sección es transparente y ocupa una pantalla. */
export function Hero() {
  const ref = useRef<HTMLDivElement>(null);
  const reduceMotion = useReducedMotion();

  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start start", "end start"],
  });

  const opacity = useTransform(scrollYProgress, [0, 0.75], [1, 0]);
  const y = useTransform(scrollYProgress, [0, 1], ["0%", "-30%"]);

  return (
    <section ref={ref} className="relative w-full min-h-[100svh] flex items-center">
      <motion.div
        style={reduceMotion ? undefined : { opacity, y }}
        className="w-full max-w-6xl mx-auto px-5 sm:px-8 lg:px-12 pt-28 pb-20 sm:py-24"
      >
        <div className="max-w-3xl">
          {/* Sin chip ni pastilla: en minimalismo el rótulo es tipografía
              suelta, no un badge con fondo. */}
          <Fade delay={0.1}>
            <p className="t-eyebrow">Lubricentro &amp; mecánica</p>
          </Fade>

          <Fade delay={0.18}>
            <h1 className="t-hero mt-7 text-balance text-white">
              Tu taller, en piloto automático
            </h1>
          </Fade>

          <Fade delay={0.26}>
            <p className="mt-8 max-w-md text-lg leading-relaxed text-white/70">
              Órdenes, turnos, stock e historial por patente. Todo en un solo
              lugar, listo cuando levantás la persiana.
            </p>
          </Fade>

          {/* Un solo CTA con peso: la segunda opción baja como link de texto
              para no competir con la acción principal. */}
          <Fade delay={0.34} className="mt-12 flex flex-wrap items-center gap-8">
            <Link
              href="/login"
              className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-accent px-8 font-semibold text-accent-foreground transition-opacity hover:opacity-90 active:scale-[0.98]"
            >
              Empezar prueba gratis
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="#caracteristicas"
              className="inline-flex min-h-12 items-center border-b border-white/25 text-white/80 transition-colors hover:border-white hover:text-white"
            >
              Ver qué incluye
            </Link>
          </Fade>
        </div>
      </motion.div>
    </section>
  );
}
