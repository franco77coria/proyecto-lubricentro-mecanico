"use client";

import { useState } from "react";
import Link from "next/link";
import { Car, Filter, UserCheck, Users, Wrench } from "lucide-react";

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

  const misOrdenesCount = ordenes.filter((o) => o.asignado_a === userId).length;
  const listaFiltrada = soloMios ? ordenes.filter((o) => o.asignado_a === userId) : ordenes;

  const porEstado = (estado: EstadoDb) => listaFiltrada.filter((o) => o.estado === estado);

  return (
    <div className="space-y-4">
      {/* Selector de Filtro de Asignación */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-card/60 border border-border/70 p-2 rounded-2xl backdrop-blur-md">
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => setSoloMios(false)}
            className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-black transition-all ${
              !soloMios
                ? "bg-accent text-white shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Users className="h-3.5 w-3.5" />
            <span>Todos los autos ({ordenes.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setSoloMios(true)}
            className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-black transition-all ${
              soloMios
                ? "bg-accent text-white shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Wrench className="h-3.5 w-3.5" />
            <span>Mis asignados ({misOrdenesCount})</span>
          </button>
        </div>

        <span className="text-[11px] font-semibold text-muted-foreground px-2">
          {listaFiltrada.length} en fosa
        </span>
      </div>

      {listaFiltrada.length === 0 ? (
        <div className="tarjeta entrar flex flex-col items-center gap-3 px-6 py-14 text-center">
          <span className="grid h-12 w-12 place-items-center rounded-full bg-accent/10 text-accent">
            <Car className="h-6 w-6" aria-hidden />
          </span>
          <p className="max-w-sm text-sm text-muted-foreground">
            {soloMios
              ? "No tenés autos asignados actualmente en el taller."
              : "No hay autos en el taller. Las órdenes entregadas no aparecen acá."}
          </p>
        </div>
      ) : (
        <div className="-mx-4 overflow-x-auto px-4 pb-3">
          <div className="flex gap-3.5" style={{ minWidth: "min-content" }}>
            {COLUMNAS_KANBAN.map((estado) => {
              const items = porEstado(estado);
              return (
                <section key={estado} className="flex w-[18rem] shrink-0 flex-col gap-2.5">
                  <header className="flex items-center justify-between gap-2 px-1.5">
                    <h2 className="truncate text-caption font-black uppercase tracking-wider text-muted-foreground">
                      {etiquetaEstado(estado)}
                    </h2>
                    <span
                      className={`shrink-0 rounded-full px-2 py-0.5 text-[0.6875rem] font-black ${ESTADO_TONO[estado] ?? "bg-muted"}`}
                    >
                      {items.length}
                    </span>
                  </header>

                  <div className="flex flex-col gap-2.5">
                    {items.length === 0 && (
                      <p className="rounded-2xl border border-dashed border-border/80 px-3 py-6 text-center text-caption text-muted-foreground">
                        Vacío
                      </p>
                    )}

                    {items.map((ot) => {
                      const dias = diasEn(ot.fecha_ingreso);
                      const mecanicoNombre = ot.mecanico?.nombre;

                      return (
                        <article
                          key={ot.id}
                          className="rounded-2xl border border-border/80 bg-card p-3.5 shadow-sm space-y-2.5 hover:border-accent/40 transition-all"
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
                              <span className="font-mono text-[11px] text-muted-foreground font-semibold">
                                #{ot.numero}
                              </span>
                            </div>

                            <div>
                              <span className="block truncate text-xs font-bold text-foreground">
                                {[ot.vehiculo?.marca?.nombre, ot.vehiculo?.modelo?.nombre]
                                  .filter(Boolean)
                                  .join(" ") || "Sin modelo"}
                              </span>
                              {ot.cliente && (
                                <span className="block truncate text-[11px] text-muted-foreground mt-0.5">
                                  {ot.cliente.nombre} {ot.cliente.apellido}
                                </span>
                              )}
                            </div>

                            {mecanicoNombre && (
                              <div className="flex items-center gap-1 text-[11px] font-bold text-accent bg-accent/10 border border-accent/20 rounded-lg px-2 py-0.5 w-fit">
                                <Wrench className="h-3 w-3" />
                                <span className="truncate">{mecanicoNombre}</span>
                              </div>
                            )}
                          </Link>

                          <div className="flex items-center justify-between gap-2 border-t border-border/60 pt-2">
                            <span
                              className={`text-[11px] font-bold ${
                                dias >= 4 ? "text-amber-500 font-black" : "text-muted-foreground"
                              }`}
                            >
                              {dias === 0 ? "Hoy" : `${dias} día${dias === 1 ? "" : "s"}`}
                            </span>
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
