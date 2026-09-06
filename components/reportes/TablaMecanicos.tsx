"use client";

import { Award, Trophy, UserCheck, Wrench } from "lucide-react";
import type { RankingMecanico } from "@/lib/reportes-fechas";

interface TablaMecanicosProps {
  ranking: RankingMecanico[];
  formatearDinero: (monto: number) => string;
}

export function TablaMecanicos({
  ranking,
  formatearDinero,
}: TablaMecanicosProps) {
  if (ranking.length === 0) {
    return (
      <div className="rounded-3xl border border-border/80 bg-card/60 p-8 text-center text-xs font-semibold text-muted-foreground">
        No se encontraron órdenes cerradas asignadas a mecánicos en este período.
      </div>
    );
  }

  const lider = ranking.find((m) => m.esLider) || ranking[0];

  return (
    <div className="space-y-5">
      {/* Tarjeta Destacada: Mecánico que más órdenes cerró */}
      {lider && lider.ordenesCerradas > 0 && (
        <div className="relative overflow-hidden rounded-3xl border border-amber-500/40 bg-gradient-to-br from-amber-500/10 via-card to-card p-5 sm:p-6 shadow-lg shadow-amber-500/5">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3.5 min-w-0">
              <div className="relative grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-gradient-to-tr from-amber-500 to-orange-500 text-white shadow-md shadow-amber-500/30">
                <Trophy className="h-6 w-6 stroke-[2.5]" />
                <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-emerald-500 text-[9px] font-black text-white">
                  1°
                </span>
              </div>

              <div className="min-w-0">
                <span className="inline-flex items-center gap-1 text-[10px] font-black uppercase tracking-wider text-amber-500">
                  <Award className="h-3 w-3" />
                  Mecánico con más órdenes cerradas
                </span>
                <h3 className="truncate text-lg sm:text-xl font-black text-foreground">
                  {lider.nombre}
                </h3>
                <p className="text-xs font-semibold text-muted-foreground">
                  Completó {lider.ordenesCerradas} {lider.ordenesCerradas === 1 ? "vehículo" : "vehículos"} ({lider.porcentajeOrdenes}% del taller)
                </p>
              </div>
            </div>

            <div className="flex items-center gap-4 text-right">
              <div>
                <span className="block text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                  Mano de Obra Producida
                </span>
                <span className="block text-base sm:text-lg font-black text-amber-500">
                  {formatearDinero(lider.totalManoObra)}
                </span>
              </div>
              <div className="border-l border-border/60 pl-4">
                <span className="block text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                  Total Facturado
                </span>
                <span className="block text-base sm:text-lg font-black text-foreground">
                  {formatearDinero(lider.totalFacturado)}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Lista / Ranking de Todo el Equipo */}
      <div className="space-y-3">
        <h3 className="text-xs font-black uppercase tracking-wider text-muted-foreground px-1">
          Rendimiento por Operario en Fosa
        </h3>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {ranking.map((mec, index) => {
            return (
              <div
                key={mec.userId}
                className={`
                  rounded-3xl border bg-card p-4 sm:p-5 shadow-xs transition-all hover:border-accent/40
                  ${mec.esLider ? "border-amber-500/30" : "border-border/80"}
                `}
              >
                <div className="flex items-center justify-between gap-2 mb-3">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-muted text-xs font-black text-foreground border border-border">
                      {index + 1}°
                    </span>
                    <div className="min-w-0">
                      <p className="truncate text-xs font-black text-foreground">
                        {mec.nombre}
                      </p>
                      <p className="text-[10px] font-semibold text-muted-foreground capitalize">
                        {mec.rol}
                      </p>
                    </div>
                  </div>

                  <span className="shrink-0 rounded-full bg-accent/10 border border-accent/20 px-2 py-0.5 text-[11px] font-black text-accent">
                    {mec.ordenesCerradas} {mec.ordenesCerradas === 1 ? "auto" : "autos"}
                  </span>
                </div>

                {/* Métricas del Mecánico */}
                <div className="space-y-1.5 pt-2 border-t border-border/50 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground flex items-center gap-1 text-[11px]">
                      <Wrench className="h-3 w-3 text-amber-500" /> Mano de obra:
                    </span>
                    <span className="font-bold text-foreground tabular-nums">
                      {formatearDinero(mec.totalManoObra)}
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground flex items-center gap-1 text-[11px]">
                      <UserCheck className="h-3 w-3 text-sky-400" /> Facturación:
                    </span>
                    <span className="font-bold text-foreground tabular-nums">
                      {formatearDinero(mec.totalFacturado)}
                    </span>
                  </div>

                  {/* Barra de Productividad */}
                  <div className="pt-2">
                    <div className="flex items-center justify-between text-[10px] text-muted-foreground mb-1 font-semibold">
                      <span>Participación del taller</span>
                      <span className="font-bold text-foreground">{mec.porcentajeOrdenes}%</span>
                    </div>
                    <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                      <div
                        className={`h-full rounded-full ${
                          mec.esLider ? "bg-amber-500" : "bg-accent"
                        }`}
                        style={{ width: `${Math.max(5, mec.porcentajeOrdenes)}%` }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
