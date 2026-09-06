"use client";

import { useState } from "react";
import Link from "next/link";
import { Car, Users, Wrench, Search, Clock, AlertCircle } from "lucide-react";

import { MoverOT } from "@/components/kanban/MoverOT";
import { PlacaPatente } from "@/components/ui/PlacaPatente";
import { COLUMNAS_KANBAN, ESTADO_TONO, etiquetaEstado, type EstadoDb } from "@/lib/estados-ot";

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

  const misOrdenesCount = ordenes.filter((o) => o.asignado_a === userId).length;

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

  const porEstado = (estado: EstadoDb) => listaFiltrada.filter((o) => o.estado === estado);

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

        {/* Buscador Rápido de Patente / OT */}
        <div className="relative flex-1 sm:max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            placeholder="Filtrar por patente, modelo o número..."
            className="w-full min-h-11 pl-9 pr-3 rounded-xl bg-background/80 border border-border text-xs font-bold text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent transition-all"
          />
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
        <div className="-mx-4 overflow-x-auto px-4 pb-4 scrollbar-thin">
          <div className="flex gap-4" style={{ minWidth: "min-content" }}>
            {COLUMNAS_KANBAN.map((estado) => {
              const items = porEstado(estado);
              return (
                <section key={estado} className="flex w-[20rem] shrink-0 flex-col gap-3">
                  <header className="flex items-center justify-between gap-2 px-2 py-1 rounded-xl bg-card/60 border border-border/50">
                    <h2 className="truncate text-xs font-black uppercase tracking-wider text-muted-foreground">
                      {etiquetaEstado(estado)}
                    </h2>
                    <span
                      className={`shrink-0 rounded-full px-2.5 py-0.5 text-[11px] font-black ${
                        ESTADO_TONO[estado] ?? "bg-muted"
                      }`}
                    >
                      {items.length}
                    </span>
                  </header>

                  <div className="flex flex-col gap-3 min-h-[200px]">
                    {items.length === 0 && (
                      <div className="rounded-2xl border border-dashed border-border/60 p-8 text-center text-xs text-muted-foreground/60">
                        Sin vehículos
                      </div>
                    )}

                    {items.map((ot) => {
                      const dias = diasEn(ot.fecha_ingreso);
                      const mecanicoNombre = ot.mecanico?.nombre;

                      return (
                        <article
                          key={ot.id}
                          className="rounded-2xl border border-border/80 bg-card p-4 shadow-sm space-y-3 hover:border-accent/50 hover:shadow-md transition-all"
                        >
                          <Link href={`/ot/${ot.id}`} className="block space-y-2.5">
                            <div className="flex items-center justify-between gap-2">
                              {ot.vehiculo?.patente ? (
                                <PlacaPatente patente={ot.vehiculo.patente} size="sm" />
                              ) : (
                                <span className="font-mono text-xs font-bold text-muted-foreground">
                                  #{ot.numero}
                                </span>
                              )}
                              <span className="font-mono text-xs font-black text-accent bg-accent/10 px-2 py-0.5 rounded-md border border-accent/20">
                                #{ot.numero}
                              </span>
                            </div>

                            <div>
                              <span className="block truncate text-sm font-black text-foreground">
                                {[ot.vehiculo?.marca?.nombre, ot.vehiculo?.modelo?.nombre]
                                  .filter(Boolean)
                                  .join(" ") || "Sin modelo"}
                              </span>
                              {ot.cliente && (
                                <span className="block truncate text-xs text-muted-foreground mt-0.5 font-medium">
                                  {ot.cliente.nombre} {ot.cliente.apellido || ""}
                                </span>
                              )}
                            </div>

                            {mecanicoNombre && (
                              <div className="flex items-center gap-1 text-[11px] font-bold text-white/90 bg-white/[0.04] border border-white/[0.08] rounded-lg px-2.5 py-1 w-fit">
                                <Wrench className="h-3.5 w-3.5 text-accent shrink-0" />
                                <span className="truncate">{mecanicoNombre}</span>
                              </div>
                            )}
                          </Link>

                          {/* Control de Mover y Semáforo de Permanencia */}
                          <div className="flex items-center justify-between gap-2 border-t border-border/60 pt-3">
                            <div className="flex items-center gap-1.5 text-xs font-bold">
                              {dias >= 4 ? (
                                <span className="flex items-center gap-1 text-amber-500 font-black">
                                  <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                                  <span>{dias}d demorado</span>
                                </span>
                              ) : (
                                <span className="flex items-center gap-1 text-muted-foreground">
                                  <Clock className="h-3.5 w-3.5" />
                                  <span>{dias === 0 ? "Ingresó hoy" : `${dias}d`}</span>
                                </span>
                              )}
                            </div>

                            <MoverOT
                              otId={ot.id}
                              estado={estado}
                              patente={ot.vehiculo?.patente ?? ot.numero}
                            />
                          </div>
                        </article>
                      );
                    })}
                  </div>
                </section>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
