"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Menu, X, ArrowRight } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

const LINKS = [
  { href: "#caracteristicas", label: "Funciones" },
  { href: "#seguimiento", label: "Seguimiento" },
  { href: "#empezar", label: "Cómo empezar" },
  { href: "#preguntas", label: "Preguntas" },
] as const;

export function Navbar({ isLoggedIn }: { isLoggedIn: boolean }) {
  const [scrolled, setScrolled] = useState(false);
  const [activo, setActivo] = useState<string | null>(null);
  const [menuAbierto, setMenuAbierto] = useState(false);

  useEffect(() => {
    const secciones = LINKS.map((l) => document.querySelector<HTMLElement>(l.href)).filter(
      (el): el is HTMLElement => !!el,
    );

    const onScroll = () => {
      setScrolled(window.scrollY > 24);

      const linea = window.innerHeight * 0.35;
      let actual: string | null = null;
      for (const s of secciones) {
        if (s.getBoundingClientRect().top <= linea) actual = `#${s.id}`;
      }
      setActivo(actual);
    };

    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, []);

  // Cerrar menú mobile al cambiar hash o clickear
  const cerrarMenu = () => setMenuAbierto(false);

  return (
    <>
      <header className="pointer-events-none fixed inset-x-0 top-0 z-50 flex justify-center px-4 pt-4 pt-safe-top">
        <div
          className={`pointer-events-auto flex w-full max-w-5xl items-center justify-between gap-4 rounded-full pl-5 sm:pl-6 pr-2 transition-all duration-300 ${
            scrolled || menuAbierto
              ? "border border-white/10 bg-[#0a0a0a]/85 py-2 backdrop-blur-xl"
              : "border border-transparent bg-transparent py-3"
          }`}
        >
          {/* Marca sola */}
          <Link
            href="/"
            onClick={cerrarMenu}
            className="flex min-h-11 items-center text-[1.125rem] font-bold tracking-[-0.04em] text-white"
          >
            Fierros
          </Link>

          {/* Enlaces Desktop */}
          <nav className="hidden items-center gap-1 md:flex">
            {LINKS.map((l) => {
              const on = activo === l.href;
              return (
                <Link
                  key={l.href}
                  href={l.href}
                  aria-current={on ? "true" : undefined}
                  className={`inline-flex min-h-11 items-center rounded-full px-3.5 text-sm font-medium transition-colors ${
                    on ? "text-white" : "text-white/60 hover:text-white"
                  }`}
                >
                  {l.label}
                </Link>
              );
            })}
          </nav>

          {/* Botones / CTA y Toggle Mobile */}
          <div className="flex items-center gap-2">
            {!isLoggedIn && (
              <Link
                href="/login"
                className="hidden min-h-11 items-center px-3 text-sm font-medium text-white/70 transition-colors hover:text-white sm:inline-flex"
              >
                Ingresar
              </Link>
            )}
            <Link
              href={isLoggedIn ? "/tablero" : "/login"}
              className="inline-flex min-h-11 items-center rounded-full bg-accent px-4 sm:px-5 text-xs sm:text-sm font-bold text-accent-foreground shadow-sm transition-opacity hover:opacity-90 active:scale-95"
            >
              {isLoggedIn ? "Ir al tablero" : "Empezar ahora"}
            </Link>

            {/* Botón Hamburguesa para celulares */}
            <button
              type="button"
              onClick={() => setMenuAbierto((v) => !v)}
              aria-expanded={menuAbierto}
              aria-label="Abrir menú de navegación"
              className="flex md:hidden min-h-11 min-w-11 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/15 active:scale-95 transition-colors"
            >
              {menuAbierto ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>
      </header>

      {/* Menú Desplegable Mobile */}
      <AnimatePresence>
        {menuAbierto && (
          <motion.div
            initial={{ opacity: 0, y: -15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.25, ease: "easeOut" }}
            className="fixed inset-x-4 top-20 z-40 md:hidden rounded-3xl border border-white/15 bg-[#0e0e11]/95 p-6 shadow-2xl backdrop-blur-2xl"
          >
            <nav className="flex flex-col gap-2">
              {LINKS.map((l) => (
                <Link
                  key={l.href}
                  href={l.href}
                  onClick={cerrarMenu}
                  className="flex min-h-12 items-center justify-between rounded-2xl px-4 text-base font-bold text-white hover:bg-white/10 active:bg-white/15 transition-colors"
                >
                  <span>{l.label}</span>
                  <ArrowRight className="h-4 w-4 text-accent" />
                </Link>
              ))}

              <div className="mt-4 pt-4 border-t border-white/10 flex flex-col gap-2">
                {!isLoggedIn && (
                  <Link
                    href="/login"
                    onClick={cerrarMenu}
                    className="flex min-h-12 items-center justify-center rounded-2xl bg-white/5 text-sm font-bold text-white hover:bg-white/10 transition-colors"
                  >
                    Ingresar a mi cuenta
                  </Link>
                )}
                <Link
                  href={isLoggedIn ? "/tablero" : "/login"}
                  onClick={cerrarMenu}
                  className="flex min-h-12 items-center justify-center gap-2 rounded-2xl bg-accent text-sm font-bold text-accent-foreground hover:opacity-90 transition-opacity"
                >
                  <span>{isLoggedIn ? "Ir al Tablero del Taller" : "Probar Gratis 14 Días"}</span>
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </nav>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
