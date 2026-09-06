"use client";

import Link from "next/link";
import { ArrowUpRight, User, Wrench } from "lucide-react";
import { PlacaPatente } from "@/components/ui/PlacaPatente";
import type { OrdenDetalleReporte } from "@/lib/reportes-fechas";

interface TablaVehiculosPeriodoProps {
  ordenes: OrdenDetalleReporte[];
  formatearDinero: (monto: number) => string;
}

export function TablaVehiculosPeriodo({
  ordenes,
  formatearDinero,
}: TablaVehiculosPeriodoProps) {
  if (ordenes.length === 0) {
    return (
      <div className="rounded-3xl border border-border/80 bg-card/60 p-8 text-center text-xs font-semibold text-muted-foreground">
        No se registraron vehículos entregados en este período.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between px-1">
        <h3 className="text-xs font-black uppercase tracking-wider text-muted-foreground">
          Vehículos Atendidos ({ordenes.length})
        </h3>
      </div>

      <div className="space-y-2.5">
        {ordenes.map((ot) => {
          return (
            <div
              key={ot.id}
              className="flex flex-wrap items-center justify-between gap-3.5 rounded-3xl border border-border/80 bg-card p-3.5 sm:p-4 shadow-xs transition-all hover:border-accent/40 hover:shadow-md"
            >
              {/* Patente y Vehículo */}
              <div className="flex items-center gap-3 min-w-0">
                <div className="shrink-0">
                  <PlacaPatente patente={ot.patente || "PROV123"} size="sm" />
                </div>

                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-black text-foreground truncate">
                      {ot.vehiculoInfo}
                    </span>
                    <Link
                      href={`/ot/${ot.id}`}
                      className="inline-flex items-center gap-0.5 rounded-md bg-muted px-1.5 py-0.5 text-[10px] font-mono font-bold text-muted-foreground hover:bg-accent/15 hover:text-accent transition-colors"
                    >
                      <span>OT #{ot.numero}</span>
                      <ArrowUpRight className="h-3 w-3" />
                    </Link>
                  </div>

                  <div className="flex flex-wrap items-center gap-3 text-[11px] text-muted-foreground mt-0.5">
                    <span className="flex items-center gap-1">
                      <User className="h-3 w-3" />
                      <span>{ot.clienteInfo}</span>
                    </span>
                    <span className="flex items-center gap-1 text-accent font-medium">
                      <Wrench className="h-3 w-3" />
                      <span>{ot.mecanicoNombre}</span>
                    </span>
                  </div>
                </div>
              </div>

              {/* Desglose Económico */}
              <div className="flex items-center gap-4 text-right">
                <div className="hidden sm:block">
                  <span className="block text-[10px] font-semibold text-muted-foreground">
                    Mano de obra: {formatearDinero(ot.manoObra)}
                  </span>
                  <span className="block text-[10px] font-semibold text-muted-foreground">
                    Repuestos: {formatearDinero(ot.repuestos)}
                  </span>
                </div>

                <div className="sm:border-l sm:border-border/60 sm:pl-4">
                  <span className="block text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                    Total
                  </span>
                  <span className="block text-sm sm:text-base font-black text-foreground tabular-nums">
                    {formatearDinero(ot.total)}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
