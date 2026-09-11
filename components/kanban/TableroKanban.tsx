"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Car,
  Users,
  Wrench,
  Search,
  Clock,
  AlertCircle,
  ChevronDown,
  FileCheck2,
  LogIn,
  CheckCircle2,
} from "lucide-react";

import { MoverOT } from "@/components/kanban/MoverOT";
import { PlacaPatente } from "@/components/ui/PlacaPatente";
import { type EstadoDb } from "@/lib/estados-ot";

export interface OTKanban {
  id: string;
  numero: string;
  estado: EstadoDb;
  fecha_ingreso: string;
  total?: number | null;
  asignado_a?: string | null;
  vehiculo?: {
    patente: string;
    marca?: { nombre: string } | null;
    modelo?: { nombre: string } | null;
  } | null;
  cliente?: {
    nombre: string;
    apellido?: string | null;
  } | null;
  mecanico?: {
    nombre: string | null;
  } | null;
}

function diasEn(iso: string): number {
  const ms = Date.now() - new Date(iso).getTime();
  return Math.max(0, Math.floor(ms / 86_400_000));
}

interface EtapaConfig {
  id: string;
  titulo: string;
  subtitulo: string;
  estados: EstadoDb[];
  colorPill: string;
  colorBorde: string;
  colorIcono: string;
  icono: typeof FileCheck2;
}

const ETAPAS_FOSA: EtapaConfig[] = [
  {
    id: "presupuesto_aprobado",
    titulo: "Presupuesto aprobado",
    subtitulo: "Cotización aceptada y lista para recibir",
    estados: ["presupuesto", "aprobado"],
    colorPill: "bg-sky-500/15 text-sky-400 border border-sky-500/30",
    colorBorde: "hover:border-sky-500/40",
    colorIcono: "text-sky-400 bg-sky-500/10",
    icono: FileCheck2,
  },
  {
    id: "recibido",
    titulo: "Recibido en taller",
    subtitulo: "En espera de bahía o turno de inicio",
    estados: ["recibido"],
    colorPill: "bg-indigo-500/15 text-indigo-400 border border-indigo-500/30",
    colorBorde: "hover:border-indigo-500/40",
    colorIcono: "text-indigo-400 bg-indigo-500/10",
    icono: LogIn,
  },
  {
    id: "en_trabajo",
    titulo: "En trabajo / Fosa",
    subtitulo: "Vehículo en elevador, fosa o esperando repuestos",
    estados: ["en_trabajo", "esperando_repuesto"],
    colorPill: "bg-amber-500/15 text-amber-400 border border-amber-500/30",
    colorBorde: "hover:border-amber-500/40",
    colorIcono: "text-amber-400 bg-amber-500/10",
    icono: Wrench,
  },
  {
    id: "finalizado",
    titulo: "Finalizado / Para entregar",
    subtitulo: "Control de calidad listo y aviso a cliente",
    estados: ["listo"],
    colorPill: "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30",
    colorBorde: "hover:border-emerald-500/40",
    colorIcono: "text-emerald-400 bg-emerald-500/10",
    icono: CheckCircle2,
  },
];

export function TableroKanban({
  ordenes,
  userId,
  rol,
}: {
  ordenes: OTKanban[];
  userId: string;
  rol: string;
}) {
  const [soloMios, setSoloMios] = useState(rol === "mecanico");
  const [busqueda, setBusqueda] = useState("");
  // Colapsados por defecto según requerimiento 2
  const [etapasAbiertas, setEtapasAbiertas] = useState<Set<string>>(new Set());

  const misOrdenesCount = ordenes.filter((o) => o.asignado_a === userId).length;

  const toggleEtapa = (id: string) => {
    setEtapasAbiertas((prev) => {
      const nuevo = new Set(prev);
      if (nuevo.has(id)) {
        nuevo.delete(id);
      } else {
        nuevo.add(id);
      }
      return nuevo;
    });
  };

  const expandirTodos = () => {
    setEtapasAbiertas(new Set(ETAPAS_FOSA.map((e) => e.id)));
  };

  const colapsarTodos = () => {
    setEtapasAbiertas(new Set());
  };

  const listaFiltrada = ordenes.filter((o) => {
    if (soloMios && o.asignado_a !== userId) return false;
    if (busqueda.trim()) {
      const q = busqueda.trim().toLowerCase();
      const patente = (o.vehiculo?.patente || "").toLowerCase();
      const num = (o.numero || "").toLowerCase();
      const modelo = `${o.vehiculo?.marca?.nombre || ""} ${o.vehiculo?.modelo?.nombre || ""}`.toLowerCase();
      const cliente = `${o.cliente?.nombre || ""} ${o.cliente?.apellido || ""}`.toLowerCase();
      return patente.includes(q) || num.includes(q) || modelo.includes(q) || cliente.includes(q);
    }
    return true;
  });

  const todosAbiertos = ETAPAS_FOSA.every((e) => etapasAbiertas.has(e.id));

  return (
    <div className="space-y-4">
      {/* Barra de Filtros y Búsqueda Instantánea en Fosa */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-card/80 border border-border/80 p-2.5 rounded-2xl backdrop-blur-md shadow-sm">
        <div className="flex flex-wrap items-center gap-1.5">
          <button
            type="button"
            onClick={() => setSoloMios(false)}
            className={`inline-flex min-h-11 items-center gap-1.5 px-4 py-1.5 rounded-xl text-xs font-black transition-all ${
              !soloMios
                ? "bg-accent text-white shadow-sm shadow-orange-500/20"
                : "text-muted-foreground hover:text-foreground hover:bg-white/[0.04]"
            }`}
          >
            <Users className="h-4 w-4" />
            <span>Todos ({ordenes.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setSoloMios(true)}
            className={`inline-flex min-h-11 items-center gap-1.5 px-4 py-1.5 rounded-xl text-xs font-black transition-all ${
              soloMios
                ? "bg-accent text-white shadow-sm shadow-orange-500/20"
                : "text-muted-foreground hover:text-foreground hover:bg-white/[0.04]"
            }`}
          >
            <Wrench className="h-4 w-4" />
            <span>Mis Asignados ({misOrdenesCount})</span>
          </button>
        </div>

        <div className="flex items-center gap-2">
          {/* Botón expandir/colapsar todos */}
          <button
            type="button"
            onClick={todosAbiertos ? colapsarTodos : expandirTodos}
            className="text-[11px] font-bold text-muted-foreground hover:text-foreground px-2.5 py-1 rounded-lg border border-border/60 bg-muted/30 whitespace-nowrap active:scale-95 transition-all"
          >
            {todosAbiertos ? "Colapsar todos" : "Abrir todos"}
          </button>

          {/* Buscador Rápido de Patente / OT */}
          <div className="relative flex-1 sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              value={busqueda}
              onChange={(e) => {
                setBusqueda(e.target.value);
                // Si está buscando activamente, expandir automáticamente todas las etapas con resultados
                if (e.target.value.trim().length > 0) {
                  setEtapasAbiertas(new Set(ETAPAS_FOSA.map((et) => et.id)));
                }
              }}
              placeholder="Filtrar por patente, modelo..."
              className="w-full min-h-11 pl-9 pr-3 rounded-xl bg-background/80 border border-border text-xs font-bold text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent transition-all"
            />
          </div>
        </div>
      </div>

      {listaFiltrada.length === 0 ? (
        <div className="tarjeta entrar flex flex-col items-center gap-3 px-6 py-16 text-center border-dashed">
          <span className="grid h-14 w-14 place-items-center rounded-2xl bg-accent/10 text-accent ring-8 ring-accent/5">
            <Car className="h-7 w-7" aria-hidden />
          </span>
          <p className="max-w-sm text-sm text-muted-foreground font-medium">
            {busqueda
              ? `No se encontraron vehículos que coincidan con "${busqueda}".`
              : soloMios
                ? "No tenés autos asignados actualmente en el taller."
                : "No hay autos en el circuito activo de taller."}
          </p>
        </div>
      ) : (
        /* Acordeones Verticales por Etapa */
        <div className="space-y-3">
          {ETAPAS_FOSA.map((etapa) => {
            const items = listaFiltrada.filter((o) => etapa.estados.includes(o.estado));
            const estaAbierto = etapasAbiertas.has(etapa.id);
            const IconoEtapa = etapa.icono;

            return (
              <div
                key={etapa.id}
                className="overflow-hidden rounded-2xl border border-border/80 bg-card shadow-sm transition-all"
              >
                {/* Cabecera del Acordeón (mínimo 48px táctil) */}
                <button
                  type="button"
                  onClick={() => toggleEtapa(etapa.id)}
                  aria-expanded={estaAbierto}
                  className="flex min-h-14 w-full items-center justify-between gap-3 px-4 py-3 text-left transition-colors hover:bg-muted/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className={`grid h-9 w-9 shrink-0 place-items-center rounded-xl ${etapa.colorIcono}`}
                    >
                      <IconoEtapa className="h-5 w-5" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <h2 className="text-sm font-black text-foreground truncate">
                          {etapa.titulo}
                        </h2>
                      </div>
                      <p className="text-[11px] text-muted-foreground truncate font-medium">
                        {etapa.subtitulo}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2.5 shrink-0">
                    <span
                      className={`rounded-full px-2.5 py-0.5 text-xs font-black ${etapa.colorPill}`}
                    >
                      {items.length} {items.length === 1 ? "vehículo" : "vehículos"}
                    </span>
                    <div
                      className={`grid h-7 w-7 place-items-center rounded-lg text-muted-foreground transition-transform duration-200 ${
                        estaAbierto ? "rotate-180 text-foreground" : ""
                      }`}
                    >
                      <ChevronDown className="h-4 w-4" />
                    </div>
                  </div>
                </button>

                {/* Contenido desplegable con las tarjetas de vehículos */}
                {estaAbierto && (
                  <div className="border-t border-border/60 bg-muted/20 p-3 sm:p-4 animate-in fade-in slide-in-from-top-2 duration-200">
                    {items.length === 0 ? (
                      <div className="rounded-xl border border-dashed border-border/80 py-8 text-center text-xs font-semibold text-muted-foreground">
                        No hay vehículos en {etapa.titulo.toLowerCase()} actualmente.
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                        {items.map((ot) => {
                          const dias = diasEn(ot.fecha_ingreso);
                          const mecanicoNombre = ot.mecanico?.nombre;

                          return (
                            <article
                              key={ot.id}
                              className="rounded-xl border border-border/80 bg-card p-3.5 shadow-xs space-y-3 hover:border-accent/50 hover:shadow-md transition-all flex flex-col justify-between"
                            >
                              <Link href={`/ot/${ot.id}`} className="block space-y-2">
                                <div className="flex items-center justify-between gap-2">
                                  {ot.vehiculo?.patente ? (
                                    <PlacaPatente patente={ot.vehiculo.patente} size="sm" />
                                  ) : (
                                    <span className="font-mono text-xs font-bold text-muted-foreground">
                                      #{ot.numero}
                                    </span>
                                  )}
                                  <span className="font-mono text-[11px] font-black text-accent bg-accent/10 px-2 py-0.5 rounded-md border border-accent/20">
                                    #{ot.numero}
                                  </span>
                                </div>

                                <div>
                                  <span className="block truncate text-xs font-black text-foreground">
                                    {[ot.vehiculo?.marca?.nombre, ot.vehiculo?.modelo?.nombre]
                                      .filter(Boolean)
                                      .join(" ") || "Sin modelo"}
                                  </span>
                                  {ot.cliente && (
                                    <span className="block truncate text-[11px] text-muted-foreground mt-0.5 font-medium">
                                      {ot.cliente.nombre} {ot.cliente.apellido || ""}
                                    </span>
                                  )}
                                </div>

                                {mecanicoNombre && (
                                  <div className="flex items-center gap-1 text-[10px] font-bold text-foreground/90 bg-muted border border-border/60 rounded-md px-2 py-0.5 w-fit">
                                    <Wrench className="h-3 w-3 text-accent shrink-0" />
                                    <span className="truncate">{mecanicoNombre}</span>
                                  </div>
                                )}
                              </Link>

                              {/* Control de Mover y Semáforo de Permanencia */}
                              <div className="flex items-center justify-between gap-2 border-t border-border/60 pt-2.5 mt-auto">
                                <div className="flex items-center gap-1.5 text-[11px] font-bold">
                                  {dias >= 4 ? (
                                    <span className="flex items-center gap-1 text-amber-500 font-black">
                                      <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                                      <span>{dias}d demorado</span>
                                    </span>
                                  ) : (
                                    <span className="flex items-center gap-1 text-muted-foreground">
                                      <Clock className="h-3.5 w-3.5" />
                                      <span>{dias === 0 ? "Hoy" : `${dias}d`}</span>
                                    </span>
                                  )}
                                </div>

                                <MoverOT
                                  otId={ot.id}
                                  estado={ot.estado}
                                  patente={ot.vehiculo?.patente ?? ot.numero}
                                />
                              </div>
                            </article>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
