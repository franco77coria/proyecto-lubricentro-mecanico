"use client";

import {
  Camera,
  ClipboardList,
  Printer,
  ScanLine,
  ArrowRight,
  CheckCircle2,
  Lock,
  Droplets,
} from "lucide-react";
import { motion } from "motion/react";
import Link from "next/link";
import { PlacaPatente } from "@/components/ui/PlacaPatente";

const EASE_BACK = [0.34, 1.36, 0.64, 1] as const;
const EASE_OUT = [0.23, 1, 0.32, 1] as const;

function Reveal({
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
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-10%" }}
      transition={{ duration: 0.5, delay, ease: EASE_OUT }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

function Encabezado({
  eyebrow,
  titulo,
  bajada,
}: {
  eyebrow: string;
  titulo: string;
  bajada?: string;
}) {
  return (
    <Reveal>
      <p className="t-eyebrow">{eyebrow}</p>
      <h2 className="t-titulo mt-6 max-w-3xl text-balance text-foreground">{titulo}</h2>
      {bajada && (
        <p className="mt-7 max-w-xl text-lg leading-relaxed text-muted-foreground">
          {bajada}
        </p>
      )}
    </Reveal>
  );
}

/* ────────────────────────────────────────────────────────────────
   Antes / Después
   ──────────────────────────────────────────────────────────────── */

const ANTES = [
  "Órdenes en un cuaderno manchado de grasa que nadie encuentra",
  "“¿Cuántos litros llevaba este motor?” — buscar en Google mientras el cliente espera",
  "Presupuestos informales por WhatsApp que se pierden en el chat",
  "Te enterás de que te quedaste sin aceite con el auto ya colgado en el elevador",
  "El teléfono sonando todo el día: “¿che, a qué hora está lista la camioneta?”",
];

const DESPUES = [
  "Tablero visual de fosas y elevadores con estados en tiempo real a 1 tap",
  "Ficha técnica instantánea por patente: cárter exacto, viscosidad y filtros equivalentes",
  "Presupuesto digital profesional con aprobación en 1 clic desde el celular del cliente",
  "Control de inventario sincronizado por Postgres: cada litro cargado descuenta solo",
  "Live Tracker con fotos y avance tipo delivery: el cliente sabe todo sin llamar",
];

export function AntesDespues() {
  return (
    <section className="seccion">
      <Encabezado eyebrow="El día a día" titulo="Lo que hoy te come el tiempo y la plata" />

      <div className="mt-16 sm:mt-20 grid gap-12 md:grid-cols-2 md:gap-16 lg:gap-20">
        <Reveal delay={0.05}>
          <div className="rounded-3xl bg-white/80 border border-black/[0.08] p-6 sm:p-8 shadow-sm">
            <p className="t-eyebrow !text-rose-600 flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-rose-500" />
              El taller tradicional
            </p>
            <ul className="mt-6 sm:mt-8 space-y-4">
              {ANTES.map((t) => (
                <li
                  key={t}
                  className="border-t border-black/[0.06] pt-4 text-base leading-relaxed text-zinc-600 flex items-start gap-3"
                >
                  <span className="text-rose-500 font-black text-sm mt-0.5 shrink-0">✕</span>
                  <span>{t}</span>
                </li>
              ))}
            </ul>
          </div>
        </Reveal>

        <Reveal delay={0.12}>
          <div className="rounded-3xl bg-orange-50/60 border border-orange-200 p-6 sm:p-8 shadow-[0_10px_30px_rgba(249,115,22,0.06)]">
            <p className="t-eyebrow !text-accent flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-accent animate-pulse" />
              Con Fierros
            </p>
            <ul className="mt-6 sm:mt-8 space-y-4">
              {DESPUES.map((t) => (
                <li
                  key={t}
                  className="border-t border-orange-200/60 pt-4 text-base leading-relaxed text-zinc-900 font-medium flex items-start gap-3"
                >
                  <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0 mt-0.5" />
                  <span>{t}</span>
                </li>
              ))}
            </ul>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

/* ────────────────────────────────────────────────────────────────
   Funcionalidades (Asymmetrical Bento Grid con Double-Bezel)
   ──────────────────────────────────────────────────────────────── */

export function Funcionalidades() {
  return (
    <section id="caracteristicas" className="seccion">
      <Encabezado
        eyebrow="Arquitectura de Taller"
        titulo="Herramientas fierreras. Cero burocracia."
        bajada="Construido para soportar la velocidad, las manos con grasa y la exigencia de un lubricentro o taller moderno."
      />

      <div className="mt-16 sm:mt-20 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {/* Bento 1: Tablero Kanban & Fosas (Span 2 cols) */}
        <Reveal delay={0.05} className="md:col-span-2">
          <div className="h-full rounded-[2rem] bg-white/70 p-2 border border-black/[0.08] shadow-sm backdrop-blur-xl">
            <div className="h-full rounded-[calc(2rem-0.375rem)] bg-white border border-black/[0.04] p-6 sm:p-8 flex flex-col justify-between shadow-xs">
              <div>
                <div className="flex items-center gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-accent/15 text-accent border border-accent/25">
                    <ClipboardList className="h-5 w-5" />
                  </div>
                  <span className="text-xs font-mono font-bold text-accent uppercase tracking-wider">
                    Control Visual
                  </span>
                </div>
                <h3 className="t-card mt-4 text-zinc-950 text-xl sm:text-2xl font-black">
                  Tablero Kanban &amp; Ocupación de Fosas en Vivo
                </h3>
                <p className="mt-2 text-sm sm:text-base leading-relaxed text-zinc-600 max-w-xl">
                  Mirá qué auto está en cada elevador, cuánto tiempo lleva, qué mecánico lo atiende
                  y qué órdenes esperan repuestos. Pensado para proyectar en una TV de taller o usar desde una tablet.
                </p>
              </div>

              {/* Preview visual mini del tablero */}
              <div className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="rounded-xl bg-slate-50 border border-black/[0.06] p-3">
                  <div className="flex items-center justify-between text-[11px] text-zinc-500 mb-1.5">
                    <span className="font-semibold">Fosa 1</span>
                    <span className="h-2 w-2 rounded-full bg-amber-500 animate-pulse" />
                  </div>
                  <p className="font-mono font-bold text-zinc-950 text-xs">AE 789 CD</p>
                  <p className="text-[11px] text-zinc-500 truncate">Hilux 2.8 · 18 min</p>
                </div>
                <div className="rounded-xl bg-slate-50 border border-black/[0.06] p-3">
                  <div className="flex items-center justify-between text-[11px] text-zinc-500 mb-1.5">
                    <span className="font-semibold">Elevador 2</span>
                    <span className="h-2 w-2 rounded-full bg-emerald-500" />
                  </div>
                  <p className="font-mono font-bold text-zinc-950 text-xs">AF 342 XP</p>
                  <p className="text-[11px] text-zinc-500 truncate">Amarok V6 · Listo</p>
                </div>
                <div className="rounded-xl bg-slate-50 border border-black/[0.06] p-3">
                  <div className="flex items-center justify-between text-[11px] text-zinc-500 mb-1.5">
                    <span className="font-semibold">Recepción</span>
                    <span className="h-2 w-2 rounded-full bg-blue-500" />
                  </div>
                  <p className="font-mono font-bold text-zinc-950 text-xs">AC 112 LK</p>
                  <p className="text-[11px] text-zinc-500 truncate">Cronos 1.3 · Turno 11hs</p>
                </div>
              </div>
            </div>
          </div>
        </Reveal>

        {/* Bento 2: Lector de Código de Barras Offline */}
        <Reveal delay={0.1} className="md:col-span-1">
          <div className="h-full rounded-[2rem] bg-white/70 p-2 border border-black/[0.08] shadow-sm backdrop-blur-xl">
            <div className="h-full rounded-[calc(2rem-0.375rem)] bg-white border border-black/[0.04] p-6 sm:p-8 flex flex-col justify-between shadow-xs">
              <div>
                <div className="flex items-center gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-orange-500/15 text-orange-600 border border-orange-500/25">
                    <ScanLine className="h-5 w-5" />
                  </div>
                  <span className="text-xs font-mono font-bold text-orange-600 uppercase tracking-wider">
                    Fosa sin señal
                  </span>
                </div>
                <h3 className="t-card mt-4 text-zinc-950 text-xl font-bold">
                  Lector de Código de Barras
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-zinc-600">
                  En la fosa o el galpón no siempre hay buena señal. Podés escanear el bidón de aceite o repuesto directamente con la cámara del celu y descuenta el stock al instante.
                </p>
              </div>
              <div className="mt-6 rounded-xl bg-emerald-50 border border-emerald-200 p-3 text-xs text-emerald-800 font-medium flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
                <span>Escaneo rápido con la cámara del celular</span>
              </div>
            </div>
          </div>
        </Reveal>

        {/* Bento 3: Ficha de Lubricación OEM */}
        <Reveal delay={0.15} className="md:col-span-1">
          <div className="h-full rounded-[2rem] bg-white/70 p-2 border border-black/[0.08] shadow-sm backdrop-blur-xl">
            <div className="h-full rounded-[calc(2rem-0.375rem)] bg-white border border-black/[0.04] p-6 sm:p-8 flex flex-col justify-between shadow-xs">
              <div>
                <div className="flex items-center gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-amber-500/15 text-amber-600 border border-amber-500/25">
                    <Droplets className="h-5 w-5" />
                  </div>
                  <span className="text-xs font-mono font-bold text-amber-600 uppercase tracking-wider">
                    Lubricación
                  </span>
                </div>
                <h3 className="t-card mt-4 text-zinc-950 text-xl font-bold">
                  Litros de Aceite &amp; Viscosidad
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-zinc-600">
                  Capacidades exactas de cárter en litros y viscosidad recomendada de fábrica (5W-30, 10W-40) para más de 950 modelos. Sabés cuántos litros exactos lleva cada motor antes de empezar.
                </p>
              </div>
              <div className="mt-6 rounded-xl bg-slate-50 border border-black/[0.06] p-3 text-xs text-zinc-700">
                <span className="text-[10px] uppercase tracking-wider font-bold text-zinc-400 block">Ficha de Fábrica</span>
                <span className="font-mono font-bold text-zinc-950">Toyota Hilux 2.8 D-4D → 7.5L SAE 5W-30</span>
              </div>
            </div>
          </div>
        </Reveal>

        {/* Bento 4: Permisos para Dueño y Mecánicos (Span 2 cols) */}
        <Reveal delay={0.2} className="md:col-span-2">
          <div className="h-full rounded-[2rem] bg-white/70 p-2 border border-black/[0.08] shadow-sm backdrop-blur-xl">
            <div className="h-full rounded-[calc(2rem-0.375rem)] bg-white border border-black/[0.04] p-6 sm:p-8 flex flex-col justify-between shadow-xs">
              <div>
                <div className="flex items-center gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-500/15 text-emerald-600 border border-emerald-500/25">
                    <Lock className="h-5 w-5" />
                  </div>
                  <span className="text-xs font-mono font-bold text-emerald-600 uppercase tracking-wider">
                    Seguridad &amp; Cuentas
                  </span>
                </div>
                <h3 className="t-card mt-4 text-zinc-950 text-xl sm:text-2xl font-black">
                  Cuentas Separadas para Dueño y Mecánicos
                </h3>
                <p className="mt-2 text-sm sm:text-base leading-relaxed text-zinc-600 max-w-xl">
                  Tus mecánicos ven solo lo que necesitan: tareas del día, repuestos a colocar y checklist de trabajo con botones grandes para usar con guantes.
                  <strong className="text-zinc-900 block mt-1">
                    Los precios que pagás a tus proveedores y las ganancias del taller están 100% protegidos y solo los ves vos desde tu cuenta.
                  </strong>
                </p>
              </div>

              <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="rounded-xl bg-slate-50 border border-black/[0.06] p-3">
                  <p className="text-xs font-bold text-accent">Pantalla del Mecánico</p>
                  <p className="text-[11px] text-zinc-500 mt-1">Botones grandes, semáforo de colores claro y orden de servicio en mano.</p>
                </div>
                <div className="rounded-xl bg-slate-50 border border-black/[0.06] p-3">
                  <p className="text-xs font-bold text-emerald-700">Pantalla del Dueño</p>
                  <p className="text-[11px] text-zinc-500 mt-1">Ganancia neta, plata en caja, compras a proveedores y control del equipo.</p>
                </div>
              </div>
            </div>
          </div>
        </Reveal>

        {/* Bento 5: Comprobantes Térmicos POS-80 & A4 */}
        <Reveal delay={0.25} className="md:col-span-1">
          <div className="h-full rounded-[2rem] bg-white/70 p-2 border border-black/[0.08] shadow-sm backdrop-blur-xl">
            <div className="h-full rounded-[calc(2rem-0.375rem)] bg-white border border-black/[0.04] p-6 sm:p-8 flex flex-col justify-between shadow-xs">
              <div>
                <div className="flex items-center gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-blue-500/15 text-blue-600 border border-blue-500/25">
                    <Printer className="h-5 w-5" />
                  </div>
                  <span className="text-xs font-mono font-bold text-blue-600 uppercase tracking-wider">
                    Impresión Rápida
                  </span>
                </div>
                <h3 className="t-card mt-4 text-zinc-950 text-xl font-bold">
                  Comprobante PDF &amp; Hoja A4
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-zinc-600">
                  Generás el comprobante formal en PDF con el membrete de tu taller, listo para mandar por WhatsApp o imprimir en hoja A4 estándar.
                </p>
              </div>
              <div className="mt-6 rounded-xl bg-slate-50 border border-black/[0.06] p-3 text-xs text-zinc-700 flex items-center justify-between">
                <span>Comprobante instantáneo</span>
                <span className="font-mono text-accent font-bold">1 toque</span>
              </div>
            </div>
          </div>
        </Reveal>

        {/* Bento 6: Peritaje Visual de Recepción */}
        <Reveal delay={0.3} className="md:col-span-2">
          <div className="h-full rounded-[2rem] bg-white/70 p-2 border border-black/[0.08] shadow-sm backdrop-blur-xl">
            <div className="h-full rounded-[calc(2rem-0.375rem)] bg-white border border-black/[0.04] p-6 sm:p-8 flex flex-col justify-between shadow-xs">
              <div>
                <div className="flex items-center gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-purple-500/15 text-purple-600 border border-purple-500/25">
                    <Camera className="h-5 w-5" />
                  </div>
                  <span className="text-xs font-mono font-bold text-purple-600 uppercase tracking-wider">
                    Respaldo Antifraude
                  </span>
                </div>
                <h3 className="t-card mt-4 text-zinc-950 text-xl sm:text-2xl font-black">
                  Inspección de Ingreso &amp; Daños Previos
                </h3>
                <p className="mt-2 text-sm sm:text-base leading-relaxed text-zinc-600 max-w-xl">
                  Marcá bollos, rayones o faltantes en el dibujo del auto y sacá fotos desde el teléfono antes de tocar el vehículo. Evitá los clásicos reclamos de “ese rayón no estaba”.
                </p>
              </div>

              <div className="mt-6 flex flex-wrap items-center gap-3">
                <span className="px-3 py-1.5 rounded-lg bg-slate-50 border border-black/[0.06] text-xs font-medium text-zinc-700">
                  📸 Fotos guardadas con la orden de trabajo
                </span>
                <span className="px-3 py-1.5 rounded-lg bg-slate-50 border border-black/[0.06] text-xs font-medium text-zinc-700">
                  🔍 Dibujo interactivo del auto para marcar golpes
                </span>
              </div>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

/* ────────────────────────────────────────────────────────────────
   Seguimiento en Vivo (Diferencial para clientes)
   ──────────────────────────────────────────────────────────────── */

export function Seguimiento() {
  return (
    <section id="seguimiento" className="seccion">
      <div className="grid gap-12 lg:grid-cols-[1.05fr_0.95fr] lg:items-center lg:gap-20">
        <div>
          <Encabezado
            eyebrow="Experiencia para tus clientes"
            titulo="Dejá de contestar “¿ya está listo mi auto?”"
            bajada="Le mandás un link por WhatsApp y el cliente ve el estado de su vehículo en tiempo real, fotos de la reparación y el presupuesto detallado. Sin apps pesadas ni cuentas: entra con 1 clic."
          />

          <div className="mt-8 flex flex-wrap items-center gap-4">
            <Link
              href="/seguimiento"
              className="inline-flex min-h-12 items-center gap-2 rounded-full bg-accent px-6 text-sm font-bold text-accent-foreground shadow-md transition-all hover:opacity-90 active:scale-95"
            >
              <span>Ver buscador de seguimiento público</span>
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>

        {/* Maqueta Interactiva del Live Tracker */}
        <Reveal delay={0.12}>
          <div className="relative rounded-[1.5rem] sm:rounded-[2rem] border border-black/[0.08] bg-white p-4 sm:p-8 shadow-xl backdrop-blur-2xl">
            {/* Header del Tracker */}
            <div className="flex items-center justify-between border-b border-black/[0.08] pb-3 sm:pb-4">
              <div className="flex items-center gap-2">
                <span className="h-2.5 w-2.5 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-xs font-mono font-bold text-emerald-700">EN VIVO</span>
              </div>
              <span className="text-xs font-mono text-zinc-400">OT #2026-084</span>
            </div>

            {/* Vehículo y Patente */}
            <div className="mt-5 sm:mt-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
              <div className="min-w-0 flex-1">
                <p className="text-xs uppercase tracking-wider text-zinc-400 font-semibold">
                  Vehículo en Fosa
                </p>
                <p className="text-base sm:text-lg font-black text-zinc-950 mt-0.5">Toyota Hilux 2.8 D-4D</p>
                <p className="text-xs text-zinc-500 mt-0.5">Service 50.000 km + 4 Filtros</p>
              </div>
              <div className="self-start sm:self-center shrink-0">
                <PlacaPatente patente="AE789CD" size="sm" className="sm:hidden" />
                <PlacaPatente patente="AE789CD" size="md" className="hidden sm:block" />
              </div>
            </div>

            {/* Stepper tipo Mercado Libre */}
            <div className="mt-8 space-y-4 rounded-2xl bg-slate-50 border border-black/[0.06] p-4">
              {[
                { label: "Ingreso & Inspección", status: "Completado 10:14", done: true },
                { label: "En elevador / Fosa", status: "En progreso ahora...", current: true },
                { label: "Control de Calidad", status: "Pendiente", done: false },
                { label: "Listo para retirar", status: "Pendiente", done: false },
              ].map((step, idx) => (
                <div key={step.label} className="flex items-center gap-3.5">
                  <div className="relative flex items-center justify-center">
                    <div
                      className={`h-7 w-7 rounded-full flex items-center justify-center text-xs font-bold ${
                        step.done
                          ? "bg-emerald-500 text-white"
                          : step.current
                            ? "bg-accent text-white ring-4 ring-accent/20 animate-pulse"
                            : "bg-slate-200 text-zinc-400"
                      }`}
                    >
                      {step.done ? "✓" : idx + 1}
                    </div>
                  </div>
                  <div className="min-w-0 flex-1">
                    <p
                      className={`text-sm font-bold truncate ${
                        step.current
                          ? "text-accent"
                          : step.done
                            ? "text-zinc-900"
                            : "text-zinc-400"
                      }`}
                    >
                      {step.label}
                    </p>
                    <p className="text-[11px] text-zinc-500 truncate">{step.status}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Telemetría Mini */}
            <div className="mt-4 grid grid-cols-2 gap-2 text-center text-xs font-medium">
              <div className="rounded-xl bg-slate-50 border border-black/[0.06] p-2.5">
                <span className="text-zinc-400 block text-[10px] uppercase font-bold">Aceite Cargado</span>
                <span className="text-accent font-black text-sm">7.5 Litros (5W-30)</span>
              </div>
              <div className="rounded-xl bg-slate-50 border border-black/[0.06] p-2.5">
                <span className="text-zinc-400 block text-[10px] uppercase font-bold">Fotos de Respaldo</span>
                <span className="text-zinc-900 font-black text-sm">3 imágenes</span>
              </div>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

/* ────────────────────────────────────────────────────────────────
   Cómo empezar
   ──────────────────────────────────────────────────────────────── */

const PASOS = [
  {
    n: "01",
    title: "Creás tu taller en 2 minutos",
    body: "Cargás el nombre de tu taller y ya tenés el tablero listo. Sin instalaciones ni tarjetas.",
  },
  {
    n: "02",
    title: "Sumás a tu equipo de mecánicos",
    body: "Invitás a los operarios por WhatsApp con un link. Cada uno con acceso ágil y sin ver costos de compra.",
  },
  {
    n: "03",
    title: "Cargás la primera patente",
    body: "Ingresás la chapa y listo. Desde ahí el historial, filtros y órdenes se guardan solos.",
  },
] as const;

export function ComoEmpezar() {
  return (
    <section id="empezar" className="seccion">
      <Encabezado eyebrow="Cómo empezar" titulo="Funcionando en tu taller hoy mismo" />

      <div className="mt-16 sm:mt-20 grid gap-12 md:grid-cols-3 md:gap-16">
        {PASOS.map((p, i) => (
          <Reveal key={p.n} delay={i * 0.08}>
            <div className="border-t border-black/10 pt-7">
              <motion.span
                initial={{ opacity: 0, y: 12 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-10%" }}
                transition={{ duration: 0.45, delay: i * 0.08 + 0.1, ease: EASE_BACK }}
                className="t-metrica block text-accent font-black"
              >
                {p.n}
              </motion.span>
              <h3 className="t-card mt-6 text-zinc-950 font-bold">{p.title}</h3>
              <p className="mt-2.5 text-sm sm:text-base leading-relaxed text-zinc-600">{p.body}</p>
            </div>
          </Reveal>
        ))}
      </div>
    </section>
  );
}

/* ────────────────────────────────────────────────────────────────
   FAQ
   ──────────────────────────────────────────────────────────────── */

const FAQS = [
  {
    q: "¿Necesito instalar algún programa o computadora especial?",
    a: "No. Fierros funciona directo desde internet en cualquier celular, tablet o computadora. Podés agregarlo a la pantalla de inicio de tu teléfono para abrirlo como una app con 1 toque.",
  },
  {
    q: "¿Cómo funciona el seguimiento para mis clientes?",
    a: "Cada orden genera un enlace para ver el trabajo. Con un toque en 'Enviar por WhatsApp', el cliente recibe el mensaje y puede ver las fotos del auto, el estado y el presupuesto detallado.",
  },
  {
    q: "¿Tiene datos de lubricación y litros para cada auto?",
    a: "Sí. Incluye las fichas de fábrica con la capacidad de cárter en litros y la viscosidad recomendada (5W-30, 10W-40) para más de 950 modelos de Argentina.",
  },
  {
    q: "¿Puedo enviar y descargar los comprobantes en PDF?",
    a: "Totalmente. Podés generar el comprobante digital en PDF con un toque para enviar por WhatsApp o imprimir directamente en hoja A4 formal con el logo de tu taller.",
  },
  {
    q: "¿Los mecánicos pueden ver mis costos de compra o la caja?",
    a: "No. El sistema separa por completo los perfiles. Los mecánicos ven únicamente las tareas a realizar y el checklist en la fosa, sin acceso a los costos de compra ni a la plata de la caja.",
  },
  {
    q: "¿Qué pasa si cambio de celular o de computadora?",
    a: "No perdés nada. Todo queda guardado de forma segura en tu cuenta. Entrás desde el celular o la máquina nueva y tenés todos tus clientes, autos y órdenes al día.",
  },
] as const;

export function Preguntas() {
  return (
    <section id="preguntas" className="seccion">
      <div className="grid gap-12 lg:grid-cols-[0.7fr_1.3fr] lg:gap-20">
        <Encabezado eyebrow="Preguntas frecuentes" titulo="Todo lo que necesitás saber" />

        <Reveal delay={0.08}>
          <div className="border-b border-black/10">
            {FAQS.map((f) => (
              <details key={f.q} className="group border-t border-black/10">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-6 py-6 text-base sm:text-lg font-bold text-zinc-900 marker:hidden select-none">
                  <span>{f.q}</span>
                  <span
                    aria-hidden
                    className="shrink-0 text-2xl font-light leading-none text-accent transition-transform duration-200 group-open:rotate-45"
                  >
                    +
                  </span>
                </summary>
                <p className="max-w-2xl pb-6 pr-6 text-sm sm:text-base leading-relaxed text-zinc-600">
                  {f.a}
                </p>
              </details>
            ))}
          </div>
        </Reveal>
      </div>
    </section>
  );
}
