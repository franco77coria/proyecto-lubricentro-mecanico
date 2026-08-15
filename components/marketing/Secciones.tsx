"use client";

import {
  CalendarClock,
  Camera,
  ClipboardList,
  FileText,
  LineChart,
  Printer,
  ScanLine,
  Wrench,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
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
  "Órdenes en un cuaderno manchado de aceite",
  "“¿Cuándo cambió el filtro este auto?” — nadie sabe",
  "Presupuestos por WhatsApp que se pierden en el chat",
  "Te enterás de que faltaba aceite con el auto en la fosa",
  "Clientes llamando 10 veces al día preguntando si el auto está listo",
];

const DESPUES = [
  "Cada orden con su estado en vivo, en un tablero que ves de un vistazo",
  "Historial completo por patente con fichas técnicas y lubricantes exactos",
  "Presupuesto profesional en PDF con aprobación desde el celular",
  "Avisos automáticos de stock mínimo y lector de código de barras",
  "Live Tracker interactivo tipo Rappi/Mercado Libre con fotos en tiempo real",
];

export function AntesDespues() {
  return (
    <section className="seccion">
      <Encabezado eyebrow="El día a día" titulo="Lo que hoy te come el día" />

      <div className="mt-16 sm:mt-20 grid gap-12 md:grid-cols-2 md:gap-16 lg:gap-20">
        <Reveal delay={0.05}>
          <p className="t-eyebrow !text-muted-foreground">Hoy</p>
          <ul className="mt-6 sm:mt-8 space-y-5">
            {ANTES.map((t) => (
              <li
                key={t}
                className="border-t border-border pt-5 text-base sm:text-lg leading-relaxed text-muted-foreground flex items-start gap-3"
              >
                <span className="text-destructive font-black text-sm mt-0.5">✕</span>
                <span>{t}</span>
              </li>
            ))}
          </ul>
        </Reveal>

        <Reveal delay={0.12}>
          <p className="t-eyebrow !text-accent">Con Fierros</p>
          <ul className="mt-6 sm:mt-8 space-y-5">
            {DESPUES.map((t) => (
              <li
                key={t}
                className="border-t border-accent/30 pt-5 text-base sm:text-lg leading-relaxed text-foreground flex items-start gap-3"
              >
                <CheckCircle2 className="h-5 w-5 text-emerald-500 shrink-0 mt-0.5" />
                <span>{t}</span>
              </li>
            ))}
          </ul>
        </Reveal>
      </div>
    </section>
  );
}

/* ────────────────────────────────────────────────────────────────
   Funcionalidades
   ──────────────────────────────────────────────────────────────── */

const FEATURES = [
  {
    icon: ClipboardList,
    title: "Tablero Kanban de órdenes",
    body: "Cada OT con su estado en fosa, mecánico asignado y días en taller. Diseñado para verse en pantalla grande.",
  },
  {
    icon: ShieldCheck,
    title: "Live Tracker para clientes",
    body: "Tus clientes ven el avance paso a paso tipo delivery, fotos del trabajo y aprueban presupuestos desde el celular.",
  },
  {
    icon: Wrench,
    title: "Base técnica & Filtros",
    body: "Capacidades de cárter, especificación de viscosidad SAE y buscador de equivalencias cruzadas entre marcas.",
  },
  {
    icon: ScanLine,
    title: "Stock con lector de barras",
    body: "Escaneá el bidón o repuesto con la cámara del celular. Descuento automático y alertas de stock crítico.",
  },
  {
    icon: FileText,
    title: "Presupuestos en PDF",
    body: "Mano de obra y repuestos discriminados. Envío directo por WhatsApp en un toque.",
  },
  {
    icon: Camera,
    title: "Checklist de recepción & Daños",
    body: "Diagrama 2D de carrocería para marcar abolladuras y registro fotográfico de ingreso y entrega.",
  },
  {
    icon: Printer,
    title: "Comprobantes A4 y Ticket 80mm",
    body: "Imprimí en hoja membretada o tiras térmicas para ticketeras de mostrador (POS-80) con código de seguimiento.",
  },
  {
    icon: CalendarClock,
    title: "Turnos y agenda",
    body: "Planificá la semana sin huecos muertos en las fosas ni demoras en la recepción.",
  },
  {
    icon: LineChart,
    title: "Caja diaria y métricas",
    body: "Control de cobros en efectivo, transferencias, cierres de caja con timezone exacto y rentabilidad de servicios.",
  },
] as const;

export function Funcionalidades() {
  return (
    <section id="caracteristicas" className="seccion">
      <Encabezado
        eyebrow="Todo en un solo lugar"
        titulo="El taller completo, sin vueltas"
        bajada="Cada módulo pensado para la velocidad de un taller real. Menos clics, más tiempo con las manos en el motor."
      />

      <div className="mt-16 sm:mt-20 grid gap-x-12 gap-y-12 sm:grid-cols-2 lg:grid-cols-3">
        {FEATURES.map((f, i) => (
          <Reveal key={f.title} delay={Math.min(i, 6) * 0.05}>
            <div className="border-t border-border/80 pt-6">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-accent/15 text-accent border border-accent/25">
                <f.icon className="h-5 w-5" strokeWidth={2} />
              </div>
              <h3 className="t-card mt-5 text-foreground">{f.title}</h3>
              <p className="mt-2 text-sm sm:text-base leading-relaxed text-muted-foreground">{f.body}</p>
            </div>
          </Reveal>
        ))}
      </div>
    </section>
  );
}

/* ────────────────────────────────────────────────────────────────
   Seguimiento en Vivo (Diferencial)
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
              <span>Ver buscador de seguimiento</span>
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>

        {/* Maqueta Interactiva del Live Tracker */}
        <Reveal delay={0.12}>
          <div className="relative rounded-[2rem] border border-border/80 bg-[#121216]/90 p-6 sm:p-8 shadow-2xl backdrop-blur-2xl">
            {/* Header del Tracker */}
            <div className="flex items-center justify-between border-b border-border/60 pb-4">
              <div className="flex items-center gap-2">
                <span className="h-2.5 w-2.5 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-xs font-mono font-bold text-emerald-400">EN VIVO</span>
              </div>
              <span className="text-xs font-mono text-muted-foreground">OT #1042</span>
            </div>

            {/* Vehículo y Patente */}
            <div className="mt-6 flex items-center justify-between gap-4">
              <div>
                <p className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">
                  Vehículo en Fosa
                </p>
                <p className="text-lg font-black text-foreground mt-0.5">Toyota Hilux 2.8 D-4D</p>
                <p className="text-xs text-muted-foreground mt-0.5">Service 50.000 km + Filtros</p>
              </div>
              <PlacaPatente patente="AE789CD" size="md" />
            </div>

            {/* Stepper tipo Mercado Libre */}
            <div className="mt-8 space-y-4 rounded-2xl bg-card/60 border border-border/60 p-4">
              {[
                { label: "Ingreso & Inspección", status: "Completado", done: true },
                { label: "En elevador / Fosa", status: "En progreso ahora...", current: true },
                { label: "Control de Calidad", status: "Pendiente", done: false },
                { label: "Listo para retirar", status: "Pendiente", done: false },
              ].map((step, idx) => (
                <div key={step.label} className="flex items-center gap-3.5">
                  <div className="relative flex items-center justify-center">
                    <div
                      className={`h-7 w-7 rounded-full flex items-center justify-center text-xs font-bold ${
                        step.done
                          ? "bg-emerald-500 text-black"
                          : step.current
                            ? "bg-accent text-white ring-4 ring-accent/20 animate-pulse"
                            : "bg-muted text-muted-foreground"
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
                            ? "text-foreground"
                            : "text-muted-foreground"
                      }`}
                    >
                      {step.label}
                    </p>
                    <p className="text-[11px] text-muted-foreground truncate">{step.status}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Telemetría Mini */}
            <div className="mt-4 grid grid-cols-2 gap-2 text-center text-xs font-medium">
              <div className="rounded-xl bg-muted/40 border border-border/40 p-2.5">
                <span className="text-muted-foreground block text-[10px] uppercase font-bold">Aceite Cargado</span>
                <span className="text-accent font-black text-sm">7.5 Litros (5W-30)</span>
              </div>
              <div className="rounded-xl bg-muted/40 border border-border/40 p-2.5">
                <span className="text-muted-foreground block text-[10px] uppercase font-bold">Fotos de Respaldo</span>
                <span className="text-foreground font-black text-sm">3 imágenes</span>
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
    body: "Cargás los datos de tu lubricentro o taller mecánico. Sin instalaciones complicadas.",
  },
  {
    n: "02",
    title: "Sumás a tu equipo de mecánicos",
    body: "Invitás a los operarios por WhatsApp con un link. Cada uno con su rol y permisos.",
  },
  {
    n: "03",
    title: "Cargás la primera patente",
    body: "Ponés la chapa y listo. Desde ahí el historial, filtros y órdenes se guardan solos.",
  },
] as const;

export function ComoEmpezar() {
  return (
    <section id="empezar" className="seccion">
      <Encabezado eyebrow="Cómo empezar" titulo="Funcionando en tu taller hoy mismo" />

      <div className="mt-16 sm:mt-20 grid gap-12 md:grid-cols-3 md:gap-16">
        {PASOS.map((p, i) => (
          <Reveal key={p.n} delay={i * 0.08}>
            <div className="border-t border-border pt-7">
              <motion.span
                initial={{ opacity: 0, y: 12 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-10%" }}
                transition={{ duration: 0.45, delay: i * 0.08 + 0.1, ease: EASE_BACK }}
                className="t-metrica block text-accent font-black"
              >
                {p.n}
              </motion.span>
              <h3 className="t-card mt-6 text-foreground font-bold">{p.title}</h3>
              <p className="mt-2.5 text-sm sm:text-base leading-relaxed text-muted-foreground">{p.body}</p>
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
    q: "¿Necesito instalar algún programa en la computadora?",
    a: "No. Funciona 100% en la nube desde cualquier navegador (Chrome, Safari, Edge), tanto en computadoras de escritorio como en tablets y celulares. Podés instalarlo como app en la pantalla de inicio.",
  },
  {
    q: "¿Cómo funciona el seguimiento para mis clientes?",
    a: "Cada orden de trabajo genera un enlace único de seguimiento. Con un clic en 'Enviar WhatsApp', el cliente recibe el link y puede ver el estado en vivo de su vehículo, fotos del trabajo y el comprobante.",
  },
  {
    q: "¿Tiene base de datos de filtros y lubricantes?",
    a: "Sí. Incluye base de especificaciones técnicas por motorización (litros de aceite, viscosidad SAE y códigos de filtros cruzados Fram, Mann, Mahle, Bosch, etc.).",
  },
  {
    q: "¿Puedo imprimir tickets en impresoras térmicas de 80mm?",
    a: "Sí. Podés alternar entre comprobante oficial A4 y formato ticket térmico de 80mm para ticketeras de mostrador (POS-58 / POS-80).",
  },
  {
    q: "¿Puedo usarlo con varios mecánicos y sueldos/comisiones?",
    a: "Sí. Podés invitar a todos los mecánicos de tu taller con su propio usuario y asignarles órdenes específicas para llevar el control de cada fosa.",
  },
  {
    q: "¿Qué pasa con los datos de mis clientes si cambio de computadora?",
    a: "Toda tu información está respaldada y encriptada en la nube de forma segura. Entrás con tu correo desde cualquier dispositivo y tenés todos tus historiales al instante.",
  },
] as const;

export function Preguntas() {
  return (
    <section id="preguntas" className="seccion">
      <div className="grid gap-12 lg:grid-cols-[0.7fr_1.3fr] lg:gap-20">
        <Encabezado eyebrow="Preguntas frecuentes" titulo="Todo lo que necesitás saber" />

        <Reveal delay={0.08}>
          <div className="border-b border-border">
            {FAQS.map((f) => (
              <details key={f.q} className="group border-t border-border">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-6 py-6 text-base sm:text-lg font-bold text-foreground marker:hidden select-none">
                  <span>{f.q}</span>
                  <span
                    aria-hidden
                    className="shrink-0 text-2xl font-light leading-none text-accent transition-transform duration-200 group-open:rotate-45"
                  >
                    +
                  </span>
                </summary>
                <p className="max-w-2xl pb-6 pr-6 text-sm sm:text-base leading-relaxed text-muted-foreground">
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
