"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { motion, useReducedMotion } from "motion/react";
import {
  AlertOctagon,
  AlertTriangle,
  Camera,
  Check,
  ChevronDown,
  Phone,
  Plus,
  X,
  FileText,
  MessageCircle,
  Wrench,
} from "lucide-react";

import { useIsla, type EstadoIsla } from "./IslaContext";
import { useSidebar } from "@/components/nav/SidebarContext";
import { etiquetaEstado } from "@/lib/estados-ot";
import { PlacaPatente } from "@/components/ui/PlacaPatente";

const SPRING = { type: "spring", bounce: 0, duration: 0.35 } as const;

function acento(estado: EstadoIsla) {
  switch (estado.tipo) {
    case "exito":
      return "text-emerald-400";
    case "alerta":
      return "text-amber-400";
    case "error":
      return "text-rose-400";
    default:
      return "text-foreground/80";
  }
}

function Icono({ estado }: { estado: EstadoIsla }) {
  const clase = `h-4 w-4 shrink-0 ${acento(estado)}`;
  switch (estado.tipo) {
    case "exito":
      return <Check className={clase} aria-hidden />;
    case "alerta":
      return <AlertTriangle className={clase} aria-hidden />;
    case "error":
      return <AlertOctagon className={clase} aria-hidden />;
    case "progreso":
      return <Camera className={clase} aria-hidden />;
    case "presupuesto":
      return <FileText className="h-4 w-4 shrink-0 text-sky-400" aria-hidden />;
    case "ot":
      return <Wrench className="h-4 w-4 shrink-0 text-amber-400" aria-hidden />;
    default:
      return <span className="h-2 w-2 shrink-0 rounded-full bg-zinc-400" aria-hidden />;
  }
}

function formatearNumeroCorto(numero: string): string {
  if (!numero) return "";
  const partes = numero.split("-");
  if (partes.length >= 4) {
    return `#${partes[partes.length - 1]}`;
  }
  return numero.startsWith("#") ? numero : `#${numero}`;
}

export function Isla() {
  const { estado, descartar, limpiarActivo } = useIsla();
  const { sidebarVisible } = useSidebar();
  const [quiereExpandir, setExpandida] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const reducirMovimiento = useReducedMotion();
  const pathname = usePathname();

  const estaEnEstaPagina =
    (estado.tipo === "ot" && (pathname === `/ot/${estado.otId}` || pathname?.startsWith(`/ot/${estado.otId}/`))) ||
    (estado.tipo === "presupuesto" &&
      (pathname === `/presupuestos/${estado.presupuestoId}` ||
        pathname?.startsWith(`/presupuestos/${estado.presupuestoId}/`)));

  const puedeExpandir = estado.tipo === "ot" || estado.tipo === "presupuesto";
  const expandida = quiereExpandir && puedeExpandir;

  useEffect(() => {
    if (!expandida) return;
    const fuera = (e: PointerEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setExpandida(false);
    };
    const escape = (e: KeyboardEvent) => e.key === "Escape" && setExpandida(false);
    document.addEventListener("pointerdown", fuera);
    document.addEventListener("keydown", escape);
    return () => {
      document.removeEventListener("pointerdown", fuera);
      document.removeEventListener("keydown", escape);
    };
  }, [expandida]);

  if (estado.tipo === "oculta" || estaEnEstaPagina) return null;

  const transicion = reducirMovimiento ? { duration: 0 } : SPRING;

  return (
    <div
      className={`pointer-events-none fixed inset-x-0 lg:right-0 top-0 z-40 flex justify-center px-3 pt-[calc(var(--safe-top)+0.5rem)] transition-all duration-300 ${
        sidebarVisible ? "lg:left-[var(--sidebar-ancho)]" : "lg:left-0"
      }`}
      aria-live={estado.tipo === "error" ? "assertive" : "polite"}
    >
      <motion.div
        ref={ref}
        layout
        transition={transicion}
        style={{ borderRadius: expandida ? 22 : 999 }}
        className="pointer-events-auto w-full max-w-[28rem] overflow-hidden border border-border/80 bg-card/95 text-foreground shadow-xl shadow-black/25 backdrop-blur-2xl transition-colors"
      >
        {/* --- Píldora Principal --- */}
        <motion.button
          layout="position"
          type="button"
          disabled={!puedeExpandir && estado.tipo !== "error"}
          onClick={() => {
            if (puedeExpandir) setExpandida((v) => !v);
            else if (estado.tipo === "error") descartar();
          }}
          aria-label={estado.tipo === "error" ? "Descartar el error" : undefined}
          aria-expanded={puedeExpandir ? expandida : undefined}
          className="flex w-full items-center justify-between gap-2.5 px-3.5 py-2 text-left transition-[opacity] active:opacity-75 disabled:cursor-default"
        >
          <div className="flex items-center gap-2 min-w-0 flex-1">
            <Icono estado={estado} />

            {/* Contenido según tipo de elemento */}
            {estado.tipo === "ot" ? (
              <div className="flex items-center gap-2 min-w-0 flex-1">
                {/* Pastilla Central Normalizada: Badge OT */}
                <span className="inline-flex items-center gap-1 rounded-md bg-zinc-800 px-2 py-0.5 text-[11px] font-mono font-bold tracking-tight text-zinc-100 border border-zinc-700/80 shadow-xs shrink-0">
                  <span className="font-black text-amber-400">OT</span>
                  <span>{formatearNumeroCorto(estado.numero)}</span>
                </span>

                {estado.patente && <PlacaPatente patente={estado.patente} size="sm" />}

                <span className="truncate text-xs font-semibold text-muted-foreground hidden sm:inline">
                  {etiquetaEstado(estado.estado)}
                </span>
              </div>
            ) : estado.tipo === "presupuesto" ? (
              <div className="flex items-center gap-2 min-w-0 flex-1">
                {/* Pastilla Central Normalizada: Badge PR */}
                <span className="inline-flex items-center gap-1 rounded-md bg-zinc-800 px-2 py-0.5 text-[11px] font-mono font-bold tracking-tight text-zinc-100 border border-zinc-700/80 shadow-xs shrink-0">
                  <span className="font-black text-sky-400">PR</span>
                  <span>{formatearNumeroCorto(estado.numero)}</span>
                </span>

                {estado.patente && <PlacaPatente patente={estado.patente} size="sm" />}

                <span className="truncate text-xs font-semibold text-muted-foreground hidden sm:inline">
                  Presupuesto
                </span>
              </div>
            ) : estado.tipo === "progreso" ? (
              <span className="truncate text-xs font-semibold">
                {estado.mensaje} <span className="font-mono">{estado.actual}</span>/
                <span className="font-mono">{estado.total}</span>
              </span>
            ) : (
              <span className="truncate text-xs font-semibold">{estado.mensaje}</span>
            )}
          </div>

          {puedeExpandir && (
            <motion.span
              animate={{ rotate: expandida ? 180 : 0 }}
              transition={transicion}
              className="grid h-6 w-6 shrink-0 place-items-center rounded-full text-muted-foreground hover:text-foreground"
            >
              <ChevronDown className="h-4 w-4" aria-hidden />
            </motion.span>
          )}

          {estado.tipo === "error" && (
            <X className="h-4 w-4 text-muted-foreground shrink-0" aria-hidden />
          )}
        </motion.button>

        {/* Barra de progreso */}
        {estado.tipo === "progreso" && (
          <div className="h-0.5 w-full bg-muted">
            <motion.div
              className="h-full bg-accent"
              initial={false}
              animate={{ width: `${(estado.actual / Math.max(estado.total, 1)) * 100}%` }}
              transition={transicion}
            />
          </div>
        )}

        {/* --- Acciones Rápidas Expandidas (OT y Presupuesto) --- */}
        {expandida && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={transicion}
            className="border-t border-border/80 bg-muted/20 px-3.5 pt-3 pb-3 space-y-2.5"
          >
            {/* Cabecera contextual */}
            <div className="flex items-center justify-between text-xs border-b border-border/50 pb-2">
              <div className="min-w-0">
                <p className="font-bold text-foreground truncate">
                  {estado.patente} {estado.vehiculoModelo ? `· ${estado.vehiculoModelo}` : ""}
                </p>
                {estado.clienteNombre && (
                  <p className="text-[11px] text-muted-foreground truncate">{estado.clienteNombre}</p>
                )}
              </div>
              <span className="font-mono text-[11px] font-bold text-muted-foreground shrink-0">
                {estado.numero}
              </span>
            </div>

            {/* Accesos directos táctiles según tipo */}
            {estado.tipo === "ot" ? (
              <div className="grid grid-cols-2 gap-2">
                <Link
                  href={`/ot/${estado.otId}#fotos`}
                  onClick={() => setExpandida(false)}
                  className="flex min-h-11 items-center gap-2 rounded-xl bg-card border border-border/70 px-3 py-2 text-xs font-bold text-foreground transition-transform active:scale-[0.97] hover:border-accent/40"
                >
                  <Camera className="h-4 w-4 shrink-0 text-amber-400" aria-hidden />
                  <span className="truncate">Fotos & Daños</span>
                </Link>

                <Link
                  href={`/ot/${estado.otId}#items`}
                  onClick={() => setExpandida(false)}
                  className="flex min-h-11 items-center gap-2 rounded-xl bg-card border border-border/70 px-3 py-2 text-xs font-bold text-foreground transition-transform active:scale-[0.97] hover:border-accent/40"
                >
                  <Plus className="h-4 w-4 shrink-0 text-amber-400" aria-hidden />
                  <span className="truncate">Cargar ítem</span>
                </Link>

                <Link
                  href={`/ot/${estado.otId}`}
                  onClick={() => setExpandida(false)}
                  className="flex min-h-11 items-center gap-2 rounded-xl bg-card border border-border/70 px-3 py-2 text-xs font-bold text-foreground transition-transform active:scale-[0.97] hover:border-accent/40"
                >
                  <Check className="h-4 w-4 shrink-0 text-amber-400" aria-hidden />
                  <span className="truncate">Estado</span>
                </Link>

                {estado.telefonoCliente ? (
                  <a
                    href={`https://wa.me/${estado.telefonoCliente.replace(/\D/g, "")}`}
                    target="_blank"
                    rel="noreferrer"
                    className="flex min-h-11 items-center gap-2 rounded-xl bg-card border border-border/70 px-3 py-2 text-xs font-bold text-emerald-400 transition-transform active:scale-[0.97] hover:border-emerald-500/40"
                  >
                    <MessageCircle className="h-4 w-4 shrink-0 text-emerald-400" aria-hidden />
                    <span className="truncate">WhatsApp</span>
                  </a>
                ) : (
                  <div className="flex min-h-11 items-center gap-2 rounded-xl bg-card/40 border border-border/40 px-3 py-2 text-xs font-medium text-muted-foreground opacity-50">
                    <Phone className="h-4 w-4 shrink-0" aria-hidden />
                    <span className="truncate">Sin teléfono</span>
                  </div>
                )}
              </div>
            ) : (
              /* Presupuesto */
              <div className="grid grid-cols-2 gap-2">
                <Link
                  href={`/presupuestos/${estado.presupuestoId}`}
                  onClick={() => setExpandida(false)}
                  className="flex min-h-11 items-center gap-2 rounded-xl bg-card border border-border/70 px-3 py-2 text-xs font-bold text-foreground transition-transform active:scale-[0.97] hover:border-sky-500/40"
                >
                  <FileText className="h-4 w-4 shrink-0 text-sky-400" aria-hidden />
                  <span className="truncate">Ver cotización</span>
                </Link>

                <Link
                  href={`/presupuestos/${estado.presupuestoId}#items`}
                  onClick={() => setExpandida(false)}
                  className="flex min-h-11 items-center gap-2 rounded-xl bg-card border border-border/70 px-3 py-2 text-xs font-bold text-foreground transition-transform active:scale-[0.97] hover:border-sky-500/40"
                >
                  <Plus className="h-4 w-4 shrink-0 text-sky-400" aria-hidden />
                  <span className="truncate">Editar ítems</span>
                </Link>

                {estado.telefonoCliente ? (
                  <a
                    href={`https://wa.me/${estado.telefonoCliente.replace(/\D/g, "")}`}
                    target="_blank"
                    rel="noreferrer"
                    className="flex min-h-11 items-center gap-2 rounded-xl bg-card border border-border/70 px-3 py-2 text-xs font-bold text-emerald-400 transition-transform active:scale-[0.97] hover:border-emerald-500/40"
                  >
                    <MessageCircle className="h-4 w-4 shrink-0 text-emerald-400" aria-hidden />
                    <span className="truncate">WhatsApp</span>
                  </a>
                ) : (
                  <div className="flex min-h-11 items-center gap-2 rounded-xl bg-card/40 border border-border/40 px-3 py-2 text-xs font-medium text-muted-foreground opacity-50">
                    <Phone className="h-4 w-4 shrink-0" aria-hidden />
                    <span className="truncate">Sin teléfono</span>
                  </div>
                )}

                {estado.telefonoCliente && (
                  <a
                    href={`tel:${estado.telefonoCliente.replace(/\D/g, "")}`}
                    className="flex min-h-11 items-center gap-2 rounded-xl bg-card border border-border/70 px-3 py-2 text-xs font-bold text-foreground transition-transform active:scale-[0.97] hover:border-accent/40"
                  >
                    <Phone className="h-4 w-4 shrink-0 text-accent" aria-hidden />
                    <span className="truncate">Llamar</span>
                  </a>
                )}
              </div>
            )}

            {/* Barra inferior de navegación y descarte */}
            <div className="mt-1 flex items-center gap-2 pt-1">
              <Link
                href={estado.tipo === "ot" ? `/ot/${estado.otId}` : `/presupuestos/${estado.presupuestoId}`}
                onClick={() => setExpandida(false)}
                className="flex min-h-11 flex-1 items-center justify-center rounded-xl bg-foreground/10 px-3 text-xs font-bold text-foreground hover:bg-foreground/15 transition-colors border border-border/60"
              >
                {estado.tipo === "ot" ? "Ir a la orden de trabajo" : "Ir al presupuesto"}
              </Link>
              <button
                type="button"
                onClick={() => {
                  setExpandida(false);
                  limpiarActivo();
                }}
                className="flex min-h-11 items-center justify-center rounded-xl bg-card px-3.5 text-xs font-semibold text-muted-foreground hover:text-foreground hover:bg-muted transition-colors border border-border/60"
                title="Quitar de la isla"
              >
                Quitar
              </button>
            </div>
          </motion.div>
        )}
      </motion.div>
    </div>
  );
}
