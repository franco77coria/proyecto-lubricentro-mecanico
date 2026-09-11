import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, ShieldCheck } from "lucide-react";
import { LogoIcono } from "@/components/ui/Logo";
import { Footer } from "@/components/marketing/Footer";

export const metadata: Metadata = {
  title: {
    template: "%s — Fierros Legal & Cumplimiento",
    default: "Marco Legal y Privacidad — Fierros",
  },
  description:
    "Términos y condiciones, política de privacidad Ley 25.326, recolección y seguridad de datos, cookies y botón de baja/arrepentimiento para la plataforma Fierros.",
  robots: {
    index: true,
    follow: true,
  },
};

const ENLACES_LEGALES = [
  { href: "/legales/terminos", label: "Términos del Servicio" },
  { href: "/legales/privacidad", label: "Política de Privacidad (Ley 25.326)" },
  { href: "/legales/datos", label: "Recolección & Seguridad" },
  { href: "/legales/cookies", label: "Política de Cookies" },
  { href: "/legales/baja", label: "Botón de Baja" },
  { href: "/legales/arrepentimiento", label: "Botón de Arrepentimiento" },
] as const;

export default function LegalesLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[#f8fafc] text-zinc-950 flex flex-col font-[family-name:var(--font-inter)] selection:bg-orange-500/20">
      {/* Cabecera Legal Institucional */}
      <header className="sticky top-0 z-40 border-b border-black/[0.06] bg-white/90 backdrop-blur-xl">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 sm:px-6 py-3.5">
          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="inline-flex items-center gap-2 group transition-opacity hover:opacity-85"
            >
              <LogoIcono size="sm" />
              <span className="font-[family-name:var(--font-jakarta)] font-black text-lg tracking-tight text-zinc-950">
                FIERROS
              </span>
            </Link>
            <span className="hidden sm:inline-block text-zinc-300">/</span>
            <span className="hidden sm:inline-flex items-center gap-1.5 text-xs font-bold text-zinc-500 bg-zinc-100 border border-zinc-200/80 px-2.5 py-0.5 rounded-full">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              Marco Legal & Cumplimiento
            </span>
          </div>

          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-zinc-600 hover:text-zinc-950 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Volver al inicio</span>
          </Link>
        </div>

        {/* Barra de pestañas secundarias con scroll horizontal */}
        <div className="border-t border-black/[0.04] bg-zinc-50/50">
          <div className="mx-auto max-w-5xl px-4 sm:px-6">
            <nav
              className="flex items-center gap-1 sm:gap-2 overflow-x-auto py-2 scrollbar-none text-xs font-semibold text-zinc-600"
              aria-label="Pestañas de documentos legales"
            >
              {ENLACES_LEGALES.map((enlace) => (
                <Link
                  key={enlace.href}
                  href={enlace.href}
                  className="shrink-0 px-3 py-1.5 rounded-lg transition-colors hover:text-zinc-950 hover:bg-black/[0.04] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
                >
                  {enlace.label}
                </Link>
              ))}
            </nav>
          </div>
        </div>
      </header>

      {/* Contenido Principal */}
      <main className="flex-1 w-full max-w-4xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
        {children}
      </main>

      <Footer />
    </div>
  );
}
