import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Hero } from "@/components/marketing/Hero";
import { VideoBackdrop } from "@/components/marketing/VideoBackdrop";
import { InteractivePlateLookup } from "@/components/marketing/InteractivePlateLookup";
import { InteractiveWhatsAppPreview } from "@/components/marketing/InteractiveWhatsAppPreview";
import { CalculadoraFugas } from "@/components/marketing/CalculadoraFugas";
import {
  AntesDespues,
  ComoEmpezar,
  Funcionalidades,
  Preguntas,
  Seguimiento,
} from "@/components/marketing/Secciones";

export default function MarketingPage() {
  return (
    <div className="relative flex flex-col items-center overflow-x-clip">
      <VideoBackdrop />

      {/* 1. Hero con Terminal Interactiva de Fosa */}
      <Hero />

      {/* 2. Antes vs Después: El dolor del taller analógico vs Fierros */}
      <AntesDespues />

      {/* 3. Buscador Interactivo de Patente & Ficha de Cárter en <1s */}
      <div id="patentes" className="w-full">
        <InteractivePlateLookup />
      </div>

      {/* 4. Bento Grid Asimétrico: Hardware Doppelrand & Fosas */}
      <Funcionalidades />

      {/* 5. Simulador de Avisos WhatsApp 1-Tap */}
      <InteractiveWhatsAppPreview />

      {/* 6. Calculadora de Fugas y Rentabilidad de Taller */}
      <CalculadoraFugas />

      {/* 7. Live Tracker para Clientes */}
      <Seguimiento />

      {/* 8. Cómo empezar en 3 pasos */}
      <ComoEmpezar />

      {/* 9. Preguntas Frecuentes */}
      <Preguntas />

      {/* 10. Cierre de Alta Conversión con Button-in-Button CTA */}
      <section className="seccion text-center">
        <div className="regla" />
        <h2 className="t-titulo mx-auto mt-24 max-w-3xl text-balance text-white">
          ¿Listo para acelerar tu taller?
        </h2>
        <p className="mx-auto mt-8 max-w-md text-lg leading-relaxed text-white/70">
          Probalo gratis en tu fosa hoy mismo. Sin tarjeta, sin contratos.
        </p>

        <div className="mt-12 flex justify-center">
          <Link
            href="/login"
            className="group inline-flex min-h-14 items-center gap-4 rounded-full bg-accent pl-8 pr-3 font-bold text-accent-foreground shadow-[0_10px_35px_rgba(249,115,22,0.4)] transition-all hover:bg-orange-500 hover:shadow-[0_15px_45px_rgba(249,115,22,0.5)] active:scale-[0.98]"
          >
            <span>Crear cuenta gratis</span>
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-black/20 text-white transition-transform duration-300 group-hover:scale-110 group-hover:translate-x-0.5">
              <ArrowRight className="h-4 w-4" />
            </span>
          </Link>
        </div>
      </section>
    </div>
  );
}
