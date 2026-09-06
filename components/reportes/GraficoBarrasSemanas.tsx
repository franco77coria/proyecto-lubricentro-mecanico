"use client";

import { Car, Wrench, Package, TrendingUp, CalendarDays } from "lucide-react";
import type { DesgloseSemana } from "@/lib/reportes-fechas";

interface GraficoBarrasSemanasProps {
  semanas: DesgloseSemana[];
  formatearDinero: (monto: number) => string;
}

export function GraficoBarrasSemanas({
  semanas,
  formatearDinero,
}: GraficoBarrasSemanasProps) {
  if (semanas.length === 0) {
    return (
      <div className="rounded-3xl border border-border/80 bg-card/60 p-8 text-center text-xs font-semibold text-muted-foreground">
        No hay órdenes cerradas registradas para desglosar por semana en este período.
      </div>
    );
  }

  const totalVehiculos = semanas.reduce((acc, s) => acc + s.ordenes, 0);
  const promedioVehiculosSemana = Math.round(totalVehiculos / semanas.length);

  return (
    <div className="space-y-4">
      {/* HUD de Resumen Semanal */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="rounded-2xl border border-border/70 bg-card/70 p-3.5 backdrop-blur-md">
          <div className="flex items-center gap-2 text-[11px] font-bold text-muted-foreground mb-1">
            <CalendarDays className="h-3.5 w-3.5 text-accent" />
            <span>Semanas Analizadas</span>
          </div>
          <p className="text-xl font-black text-foreground">{semanas.length}</p>
        </div>

        <div className="rounded-2xl border border-border/70 bg-card/70 p-3.5 backdrop-blur-md">
          <div className="flex items-center gap-2 text-[11px] font-bold text-muted-foreground mb-1">
            <Car className="h-3.5 w-3.5 text-sky-400" />
            <span>Promedio de Autos / Semana</span>
          </div>
          <p className="text-xl font-black text-sky-400">
            {promedioVehiculosSemana} <span className="text-xs text-muted-foreground font-semibold">vehículos</span>
          </p>
        </div>

        <div className="rounded-2xl border border-border/70 bg-card/70 p-3.5 backdrop-blur-md">
          <div className="flex items-center gap-2 text-[11px] font-bold text-muted-foreground mb-1">
            <TrendingUp className="h-3.5 w-3.5 text-emerald-400" />
            <span>Total de Autos Atendidos</span>
          </div>
          <p className="text-xl font-black text-emerald-400">
            {totalVehiculos} <span className="text-xs text-muted-foreground font-semibold">órdenes</span>
          </p>
        </div>
      </div>

      {/* Tarjetas de Semanas con Barras de Desglose */}
      <div className="space-y-3">
        {semanas.map((sem) => {
          const pctManoObra = sem.facturado > 0 ? Math.round((sem.manoObra / sem.facturado) * 100) : 0;
          const pctRepuestos = sem.facturado > 0 ? Math.round((sem.repuestos / sem.facturado) * 100) : 0;

          return (
            <div
              key={sem.semanaKey}
              className="group rounded-3xl border border-border/80 bg-card p-4 sm:p-5 shadow-xs transition-all hover:border-accent/40 hover:shadow-md"
            >
              {/* Cabecera de la Semana */}
              <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-border/50">
                <div className="flex items-center gap-2.5">
                  <span className="grid h-8 w-8 place-items-center rounded-xl bg-accent/15 text-accent font-black text-xs">
                    <CalendarDays className="h-4 w-4" />
                  </span>
                  <div>
                    <span className="block text-xs font-black text-foreground capitalize">
                      {sem.etiqueta}
                    </span>
                    <span className="block text-[11px] font-semibold text-muted-foreground">
                      {sem.ordenes} {sem.ordenes === 1 ? "vehículo atendido" : "vehículos atendidos"}
                    </span>
                  </div>
                </div>

                <div className="text-right">
                  <span className="block text-base sm:text-lg font-black text-foreground">
                    {formatearDinero(sem.facturado)}
                  </span>
                  <span className="inline-flex items-center gap-1 rounded-md bg-emerald-500/10 px-2 py-0.5 text-[10px] font-bold text-emerald-400 border border-emerald-500/20">
                    Ganancia aprox: {formatearDinero(sem.gananciaEstimada)}
                  </span>
                </div>
              </div>

              {/* Barra Proporcional Mano de Obra vs Repuestos */}
              <div className="mt-3.5 space-y-2">
                <div className="flex items-center justify-between text-[11px] font-bold">
                  <span className="flex items-center gap-1.5 text-amber-500">
                    <Wrench className="h-3 w-3" />
                    <span>Mano de obra: {formatearDinero(sem.manoObra)} ({pctManoObra}%)</span>
                  </span>
                  <span className="flex items-center gap-1.5 text-sky-400">
                    <Package className="h-3 w-3" />
                    <span>Repuestos: {formatearDinero(sem.repuestos)} ({pctRepuestos}%)</span>
                  </span>
                </div>

                {/* Barra Bicolor */}
                <div className="h-3.5 w-full overflow-hidden rounded-full bg-muted/60 flex p-0.5 border border-border/50">
                  <div
                    className="h-full rounded-l-full bg-gradient-to-r from-amber-500 to-orange-500 transition-all duration-500"
                    style={{ width: `${pctManoObra}%` }}
                    title={`Mano de obra: ${pctManoObra}%`}
                  />
                  <div
                    className="h-full rounded-r-full bg-gradient-to-r from-sky-500 to-blue-500 transition-all duration-500"
                    style={{ width: `${pctRepuestos}%` }}
                    title={`Repuestos: ${pctRepuestos}%`}
                  />
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
