import Link from "next/link";
import { ShieldCheck, ExternalLink, RefreshCw, XCircle } from "lucide-react";
import { LogoIcono } from "@/components/ui/Logo";

export function Footer() {
  const anio = new Date().getFullYear();

  return (
    <footer className="relative mt-16 px-3.5 sm:px-6 pb-8 w-full max-w-full overflow-x-hidden border-t border-black/[0.06] bg-white/80 backdrop-blur-xl">
      <div className="mx-auto w-full max-w-6xl pt-12 sm:pt-16 pb-8">
        {/* Grid de Columnas */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8 sm:gap-10">
          {/* Columna 1: Marca e Identidad */}
          <div className="lg:col-span-2 space-y-4">
            <Link href="/" className="inline-flex items-center gap-2.5">
              <LogoIcono size="md" />
              <span className="font-[family-name:var(--font-jakarta)] font-black text-2xl tracking-tight text-zinc-950">
                FIERROS
              </span>
            </Link>
            <p className="text-sm leading-relaxed text-zinc-600 max-w-sm">
              Plataforma integral de gestión de fosa, órdenes de trabajo, control de stock y fichas técnicas por patente homologadas para lubricentros y talleres mecánicos de la República Argentina.
            </p>
            <div className="flex flex-wrap items-center gap-2 pt-1 text-xs text-zinc-500">
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 font-bold text-emerald-800">
                <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />
                Ley 25.326 Cumplida
              </span>
              <span className="inline-flex items-center gap-1 rounded-full bg-zinc-100 border border-zinc-200 px-2.5 py-0.5 font-medium text-zinc-700">
                🇦🇷 Desarrollado en Argentina
              </span>
            </div>
          </div>

          {/* Columna 2: Producto */}
          <div className="space-y-3">
            <p className="text-xs font-black uppercase tracking-wider text-zinc-950">
              Producto
            </p>
            <ul className="space-y-2 text-sm text-zinc-600">
              <li>
                <Link href="/#patentes" className="hover:text-zinc-950 transition-colors">
                  Fichas por Patente
                </Link>
              </li>
              <li>
                <Link href="/#caracteristicas" className="hover:text-zinc-950 transition-colors">
                  Órdenes de Fosa
                </Link>
              </li>
              <li>
                <Link href="/#caracteristicas" className="hover:text-zinc-950 transition-colors">
                  Control de Cárter & Stock
                </Link>
              </li>
              <li>
                <Link href="/#seguimiento" className="hover:text-zinc-950 transition-colors">
                  Live Tracker de Clientes
                </Link>
              </li>
              <li>
                <Link href="/login" className="hover:text-zinc-950 transition-colors font-medium text-accent">
                  Acceso al Taller →
                </Link>
              </li>
            </ul>
          </div>

          {/* Columna 3: Legal & Seguridad */}
          <div className="space-y-3">
            <p className="text-xs font-black uppercase tracking-wider text-zinc-950">
              Legal & Privacidad
            </p>
            <ul className="space-y-2 text-sm text-zinc-600">
              <li>
                <Link href="/legales/terminos" className="hover:text-zinc-950 transition-colors">
                  Términos y Condiciones
                </Link>
              </li>
              <li>
                <Link href="/legales/privacidad" className="hover:text-zinc-950 transition-colors">
                  Política de Privacidad
                </Link>
              </li>
              <li>
                <Link href="/legales/datos" className="hover:text-zinc-950 transition-colors">
                  Recolección & Seguridad
                </Link>
              </li>
              <li>
                <Link href="/legales/cookies" className="hover:text-zinc-950 transition-colors">
                  Política de Cookies
                </Link>
              </li>
            </ul>
          </div>

          {/* Columna 4: Defensa del Consumidor (Obligatorio en Argentina) */}
          <div className="space-y-3">
            <p className="text-xs font-black uppercase tracking-wider text-zinc-950">
              Defensa del Consumidor
            </p>
            <p className="text-xs text-zinc-500 leading-relaxed">
              Ley N° 24.240 y Resoluciones 271/2020 y 424/2020 de la Secretaría de Comercio Interior.
            </p>

            <div className="flex flex-col gap-2 pt-1">
              {/* Botón de Baja */}
              <Link
                href="/legales/baja"
                className="inline-flex items-center justify-between gap-2 px-3 py-2 rounded-xl bg-red-50/80 border border-red-200 text-xs font-bold text-red-700 hover:bg-red-100/90 transition-colors group"
                id="boton-de-baja"
              >
                <span className="flex items-center gap-1.5">
                  <XCircle className="w-3.5 h-3.5 text-red-600" />
                  Botón de Baja
                </span>
                <span className="text-[10px] text-red-500 font-mono group-hover:translate-x-0.5 transition-transform">
                  Cancelar →
                </span>
              </Link>

              {/* Botón de Arrepentimiento */}
              <Link
                href="/legales/arrepentimiento"
                className="inline-flex items-center justify-between gap-2 px-3 py-2 rounded-xl bg-amber-50/80 border border-amber-200 text-xs font-bold text-amber-800 hover:bg-amber-100/90 transition-colors group"
                id="boton-de-arrepentimiento"
              >
                <span className="flex items-center gap-1.5">
                  <RefreshCw className="w-3.5 h-3.5 text-amber-600" />
                  Botón de Arrepentimiento
                </span>
                <span className="text-[10px] text-amber-600 font-mono group-hover:translate-x-0.5 transition-transform">
                  10 días →
                </span>
              </Link>

              <a
                href="https://www.argentina.gob.ar/produccion/defensadelconsumidor/formulario"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-[11px] text-zinc-500 hover:text-zinc-800 transition-colors pt-1"
              >
                <span>Ventanilla Única Federal</span>
                <ExternalLink className="w-2.5 h-2.5" />
              </a>
            </div>
          </div>
        </div>

        {/* Separador */}
        <div className="mt-12 pt-8 border-t border-black/[0.06] space-y-4">
          {/* Leyenda legal obligatoria de la AAIP */}
          <div className="rounded-xl bg-zinc-50 border border-zinc-200/70 p-3.5 text-[11px] text-zinc-500 leading-relaxed">
            <p>
              <strong className="text-zinc-700 font-semibold">Agencia de Acceso a la Información Pública (AAIP):</strong>{" "}
              El titular de los datos personales tiene la facultad de ejercer el derecho de acceso a los mismos en forma gratuita a intervalos no inferiores a seis meses, salvo que se acredite un interés legítimo al efecto conforme lo establecido en el artículo 14, inciso 3 de la Ley Nº 25.326. La AGENCIA DE ACCESO A LA INFORMACIÓN PÚBLICA, en su carácter de Órgano de Control de la Ley N° 25.326, tiene la atribución de atender las denuncias y reclamos que interpongan quienes resulten afectados en sus derechos por incumplimiento de las normas vigentes en materia de protección de datos personales.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-zinc-500 text-center sm:text-left">
            <p>© {anio} Fierros Software. Todos los derechos reservados.</p>
            <p className="text-[11px]">
              Fierros opera como plataforma SaaS automotriz. Los pagos son procesados de forma segura mediante Mercado Pago (PCI-DSS Compliant).
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
