"use client";

import { useState } from "react";
import {
  BarChart3,
  CalendarDays,
  CalendarRange,
  Clock,
  DollarSign,
  Package,
  Receipt,
  TrendingUp,
  Users,
  Wrench,
} from "lucide-react";
import type { DatosReporteCompleto } from "@/lib/reportes-fechas";
import { GraficoBarrasSemanas } from "./GraficoBarrasSemanas";
import { TablaMecanicos } from "./TablaMecanicos";
import { TablaVehiculosPeriodo } from "./TablaVehiculosPeriodo";

type VistaReporte = "resumen" | "semanas" | "meses" | "mecanicos" | "vehiculos";

interface PestanasReporteProps {
  datos: DatosReporteCompleto;
  formatearDinero: (monto: number) => string;
}

export function PestanasReporte({
  datos,
  formatearDinero,
}: PestanasReporteProps) {
  const [vistaActiva, setVistaActiva] = useState<VistaReporte>("resumen");

  const r = datos.resumen;
  const money = formatearDinero;

  const PESTANAS: { id: VistaReporte; etiqueta: string; icono: typeof BarChart3; badge?: string }[] = [
    { id: "resumen", etiqueta: "Resumen & Ganancias", icono: DollarSign },
    { id: "semanas", etiqueta: "Por Semana", icono: CalendarRange, badge: `${datos.semanas.length}` },
    { id: "meses", etiqueta: "Por Mes", icono: CalendarDays, badge: `${datos.meses.length}` },
    { id: "mecanicos", etiqueta: "Mecánicos", icono: Users, badge: `${datos.rankingMecanicos.length}` },
    { id: "vehiculos", etiqueta: "Vehículos", icono: Wrench, badge: `${datos.ultimosVehiculos.length}` },
  ];

  return (
    <div className="space-y-6">
      {/* Selector de Pestañas Moderno */}
      <div className="flex items-center gap-1.5 overflow-x-auto rounded-3xl border border-border/80 bg-card/80 p-1.5 shadow-xs backdrop-blur-xl scrollbar-none">
        {PESTANAS.map((p) => {
          const activo = vistaActiva === p.id;
          const Icono = p.icono;

          return (
            <button
              key={p.id}
              type="button"
              onClick={() => setVistaActiva(p.id)}
              className={`
                flex min-h-11 items-center gap-2 rounded-2xl px-4 py-2 text-xs font-bold whitespace-nowrap transition-all active:scale-95
                ${
                  activo
                    ? "bg-accent text-white shadow-md shadow-accent/25"
                    : "text-muted-foreground hover:bg-muted/70 hover:text-foreground"
                }
              `}
            >
              <Icono className={`h-4 w-4 ${activo ? "text-white" : "text-muted-foreground"}`} />
              <span>{p.etiqueta}</span>
              {p.badge && (
                <span
                  className={`rounded-full px-1.5 py-0.2 text-[10px] font-black ${
                    activo
                      ? "bg-black/20 text-white"
                      : "bg-muted text-muted-foreground"
                  }`}
                >
                  {p.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Contenido de la Pestaña Activa */}
      {vistaActiva === "resumen" && (
        <div className="space-y-6 animate-in fade-in duration-200">
          {/* Tarjetas Principales de Alto Impacto */}
          <section className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            {/* 1. Facturado Total */}
            <div className="rounded-3xl border border-emerald-500/30 bg-gradient-to-br from-emerald-500/10 via-card to-card p-4 sm:p-5 shadow-xs">
              <div className="flex items-center justify-between mb-2">
                <span className="grid h-10 w-10 place-items-center rounded-2xl bg-emerald-500/15 text-emerald-400 border border-emerald-500/25">
                  <Receipt className="h-5 w-5" />
                </span>
                <span className="text-[10px] font-mono font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full">
                  Total
                </span>
              </div>
              <span className="tabular block text-xl sm:text-2xl font-black text-foreground">
                {money(r.totalFacturado)}
              </span>
              <span className="block text-xs font-semibold text-muted-foreground mt-0.5">
                Facturación del período
              </span>
            </div>

            {/* 2. Ganancia Real */}
            <div className="rounded-3xl border border-amber-500/30 bg-gradient-to-br from-amber-500/10 via-card to-card p-4 sm:p-5 shadow-xs">
              <div className="flex items-center justify-between mb-2">
                <span className="grid h-10 w-10 place-items-center rounded-2xl bg-amber-500/15 text-amber-400 border border-amber-500/25">
                  <TrendingUp className="h-5 w-5" />
                </span>
                <span className="text-[10px] font-mono font-bold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-full">
                  {r.margenGananciaTotal}% margen
                </span>
              </div>
              <span className="tabular block text-xl sm:text-2xl font-black text-amber-500">
                {money(r.gananciaReal)}
              </span>
              <span className="block text-xs font-semibold text-muted-foreground mt-0.5">
                Ganancia real estimada
              </span>
            </div>

            {/* 3. Vehículos Atendidos */}
            <div className="rounded-3xl border border-sky-500/30 bg-gradient-to-br from-sky-500/10 via-card to-card p-4 sm:p-5 shadow-xs">
              <div className="flex items-center justify-between mb-2">
                <span className="grid h-10 w-10 place-items-center rounded-2xl bg-sky-500/15 text-sky-400 border border-sky-500/25">
                  <Wrench className="h-5 w-5" />
                </span>
                <span className="text-[10px] font-mono font-bold text-sky-400 bg-sky-500/10 px-2 py-0.5 rounded-full">
                  Cerradas
                </span>
              </div>
              <span className="tabular block text-xl sm:text-2xl font-black text-foreground">
                {r.vehiculosAtendidos}
              </span>
              <span className="block text-xs font-semibold text-muted-foreground mt-0.5">
                Vehículos despachados
              </span>
            </div>

            {/* 4. Ticket Promedio */}
            <div className="rounded-3xl border border-violet-500/30 bg-gradient-to-br from-violet-500/10 via-card to-card p-4 sm:p-5 shadow-xs">
              <div className="flex items-center justify-between mb-2">
                <span className="grid h-10 w-10 place-items-center rounded-2xl bg-violet-500/15 text-violet-400 border border-violet-500/25">
                  <Clock className="h-5 w-5" />
                </span>
                <span className="text-[10px] font-mono font-bold text-violet-400 bg-violet-500/10 px-2 py-0.5 rounded-full">
                  Promedio
                </span>
              </div>
              <span className="tabular block text-xl sm:text-2xl font-black text-foreground">
                {money(r.ticketPromedio)}
              </span>
              <span className="block text-xs font-semibold text-muted-foreground mt-0.5">
                Gasto promedio por auto
              </span>
            </div>
          </section>

          {/* Desglose Detallado: Mano de Obra vs Repuestos */}
          <div className="grid gap-6 lg:grid-cols-3">
            <section className="rounded-3xl border border-border/80 bg-card p-5 sm:p-6 shadow-xs lg:col-span-2 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-black uppercase tracking-wider text-foreground">
                  Composición de la Facturación
                </h3>
                <span className="text-xs font-semibold text-muted-foreground">
                  {datos.etiquetaPeriodo}
                </span>
              </div>

              {/* Comparativa Visual Grande */}
              <div className="space-y-4 pt-2">
                <div>
                  <div className="flex items-center justify-between text-xs font-bold mb-1.5">
                    <span className="flex items-center gap-1.5 text-amber-500">
                      <Wrench className="h-4 w-4" />
                      Mano de Obra (Trabajo realizado)
                    </span>
                    <span className="text-foreground font-black tabular-nums">
                      {money(r.totalManoObra)}{" "}
                      <span className="text-muted-foreground text-[11px] font-medium">({r.porcentajeManoObra}%)</span>
                    </span>
                  </div>
                  <div className="h-3 w-full overflow-hidden rounded-full bg-muted">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-amber-500 to-orange-500"
                      style={{ width: `${Math.max(5, r.porcentajeManoObra)}%` }}
                    />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between text-xs font-bold mb-1.5">
                    <span className="flex items-center gap-1.5 text-sky-400">
                      <Package className="h-4 w-4" />
                      Valor de Repuestos Cobrados
                    </span>
                    <span className="text-foreground font-black tabular-nums">
                      {money(r.totalRepuestos)}{" "}
                      <span className="text-muted-foreground text-[11px] font-medium">({r.porcentajeRepuestos}%)</span>
                    </span>
                  </div>
                  <div className="h-3 w-full overflow-hidden rounded-full bg-muted">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-sky-500 to-blue-500"
                      style={{ width: `${Math.max(5, r.porcentajeRepuestos)}%` }}
                    />
                  </div>
                </div>
              </div>

              {/* Métricas secundarias */}
              <div className="mt-6 pt-4 border-t border-border/50 grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
                <div className="rounded-2xl bg-muted/40 p-3 border border-border/40">
                  <span className="block text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                    Costo Repuestos Proveedor
                  </span>
                  <span className="block text-sm font-black text-foreground mt-0.5 tabular-nums">
                    {money(r.costoRepuestos)}
                  </span>
                </div>

                <div className="rounded-2xl bg-muted/40 p-3 border border-border/40">
                  <span className="block text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                    Margen Ganado en Repuestos
                  </span>
                  <span className="block text-sm font-black text-emerald-400 mt-0.5 tabular-nums">
                    {money(r.margenRepuestos)} ({r.porcentajeMargenRepuestos}%)
                  </span>
                </div>

                <div className="rounded-2xl bg-muted/40 p-3 border border-border/40 col-span-2 sm:col-span-1">
                  <span className="block text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                    Tiempo Promedio en Fosa
                  </span>
                  <span className="block text-sm font-black text-foreground mt-0.5 tabular-nums">
                    {r.horasPromedioTaller > 0 ? `${r.horasPromedioTaller} hs` : "Sin demoras"}
                  </span>
                </div>
              </div>
            </section>

            {/* Top Trabajos y Repuestos Más Vendidos */}
            <section className="rounded-3xl border border-border/80 bg-card p-5 sm:p-6 shadow-xs space-y-3">
              <h3 className="text-sm font-black uppercase tracking-wider text-foreground">
                Lo que más se hizo
              </h3>

              {datos.topTrabajos.length === 0 ? (
                <p className="py-6 text-center text-xs font-semibold text-muted-foreground">
                  Sin registros suficientes en este período.
                </p>
              ) : (
                <ul className="divide-y divide-border/50 overflow-hidden">
                  {datos.topTrabajos.map((t, i) => (
                    <li key={`${t.descripcion}-${i}`} className="flex items-center justify-between py-2.5 text-xs">
                      <div className="min-w-0 flex-1 pr-2">
                        <span className="block truncate font-bold text-foreground">
                          {t.descripcion}
                        </span>
                        <span className="block text-[10px] font-semibold text-muted-foreground">
                          {t.veces} {t.veces === 1 ? "vez" : "veces"} · {t.tipo}
                        </span>
                      </div>
                      <span className="shrink-0 font-black text-foreground tabular-nums">
                        {money(t.total)}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          </div>
        </div>
      )}

      {/* Vista por Semana */}
      {vistaActiva === "semanas" && (
        <div className="space-y-4 animate-in fade-in duration-200">
          <div className="flex items-center justify-between px-1">
            <h3 className="text-xs font-black uppercase tracking-wider text-muted-foreground">
              Desglose y Evolución Semana a Semana
            </h3>
          </div>
          <GraficoBarrasSemanas semanas={datos.semanas} formatearDinero={money} />
        </div>
      )}

      {/* Vista por Mes */}
      {vistaActiva === "meses" && (
        <div className="space-y-4 animate-in fade-in duration-200">
          <div className="flex items-center justify-between px-1">
            <h3 className="text-xs font-black uppercase tracking-wider text-muted-foreground">
              Desglose y Evolución Mensual
            </h3>
          </div>

          <div className="space-y-3">
            {datos.meses.map((m) => {
              const pctManoObra = m.facturado > 0 ? Math.round((m.manoObra / m.facturado) * 100) : 0;
              const pctRepuestos = m.facturado > 0 ? Math.round((m.repuestos / m.facturado) * 100) : 0;

              return (
                <div
                  key={m.mesKey}
                  className="rounded-3xl border border-border/80 bg-card p-4 sm:p-5 shadow-xs transition-all hover:border-accent/40"
                >
                  <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-border/50">
                    <div>
                      <span className="block text-sm font-black text-foreground">
                        {m.etiqueta}
                      </span>
                      <span className="block text-xs font-semibold text-muted-foreground">
                        {m.ordenes} {m.ordenes === 1 ? "vehículo atendido" : "vehículos atendidos"}
                      </span>
                    </div>

                    <div className="text-right">
                      <span className="block text-base sm:text-lg font-black text-foreground">
                        {money(m.facturado)}
                      </span>
                      <span className="text-[11px] font-bold text-emerald-400">
                        Ganancia aprox: {money(m.gananciaEstimada)}
                      </span>
                    </div>
                  </div>

                  <div className="mt-3 space-y-2">
                    <div className="flex items-center justify-between text-xs font-semibold">
                      <span className="text-amber-500">
                        Mano de obra: {money(m.manoObra)} ({pctManoObra}%)
                      </span>
                      <span className="text-sky-400">
                        Repuestos: {money(m.repuestos)} ({pctRepuestos}%)
                      </span>
                    </div>

                    <div className="h-3 w-full overflow-hidden rounded-full bg-muted/60 flex p-0.5 border border-border/50">
                      <div
                        className="h-full rounded-l-full bg-gradient-to-r from-amber-500 to-orange-500"
                        style={{ width: `${pctManoObra}%` }}
                      />
                      <div
                        className="h-full rounded-r-full bg-gradient-to-r from-sky-500 to-blue-500"
                        style={{ width: `${pctRepuestos}%` }}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Vista de Mecánicos */}
      {vistaActiva === "mecanicos" && (
        <div className="space-y-4 animate-in fade-in duration-200">
          <TablaMecanicos ranking={datos.rankingMecanicos} formatearDinero={money} />
        </div>
      )}

      {/* Vista de Vehículos */}
      {vistaActiva === "vehiculos" && (
        <div className="space-y-4 animate-in fade-in duration-200">
          <TablaVehiculosPeriodo ordenes={datos.ultimosVehiculos} formatearDinero={money} />
        </div>
      )}
    </div>
  );
}
