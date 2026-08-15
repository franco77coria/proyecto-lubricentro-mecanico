import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Hero } from "@/components/marketing/Hero";
import { VideoBackdrop } from "@/components/marketing/VideoBackdrop";
import {
  AntesDespues,
  ComoEmpezar,
  Funcionalidades,
  Preguntas,
  Seguimiento,
} from "@/components/marketing/Secciones";

export default function MarketingPage() {
  return (
    // overflow-x-clip y no -hidden: `hidden` fuerza overflow-y:auto y crea un
    // contenedor de scroll, que rompe el posicionamiento fijo del fondo.
    // `clip` recorta igual sin generar ese contenedor.
    <div className="relative flex flex-col items-center overflow-x-clip">
      <VideoBackdrop />

      {/* Orden de conversión: enganche → dolor → solución → diferencial →
          fricción de arranque → objeciones → cierre. */}
      <Hero />
      <AntesDespues />
      <Funcionalidades />
      <Seguimiento />
      <ComoEmpezar />
      <Preguntas />

      {/* Cierre: tipografía a máxima escala y un solo CTA, sin caja de color
          que compita con el fondo. */}
      <section className="seccion text-center">
        <div className="regla" />
        <h2 className="t-titulo mx-auto mt-24 max-w-3xl text-balance text-foreground">
          ¿Listo para acelerar tu taller?
        </h2>
        <p className="mx-auto mt-8 max-w-md text-lg leading-relaxed text-muted-foreground">
          Probalo gratis. Sin tarjeta, sin instalar nada.
        </p>
        <Link
          href="/login"
          className="mt-12 inline-flex min-h-12 items-center gap-2 rounded-full bg-accent px-8 font-semibold text-accent-foreground transition-opacity hover:opacity-90 active:scale-[0.98]"
        >
          Empezar prueba gratis
          <ArrowRight className="h-4 w-4" />
        </Link>
      </section>
    </div>
  );
}
