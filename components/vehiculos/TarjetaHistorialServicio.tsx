"use client";

import { useState } from "react";
import Link from "next/link";
import { ChevronDown, Wrench, CheckCircle2, Package, ArrowUpRight, Clock, FileText } from "lucide-react";
import { BotonPDFWhatsApp, type DatosOTPDF } from "@/components/ot/BotonPDFWhatsApp";
import { ESTADO_LABEL, ESTADO_TONO } from "@/lib/estados-ot";
import { formatearRol } from "@/lib/ot-usuarios";

export interface ItemHistorial {
  id: string;
  tipo: string;
  descripcion: string;
  cantidad: number;
  precio_unitario: number;
  subtotal: number;
}

export function TarjetaHistorialServicio({
  ot,
  fechaFormateada,
  fechaCierreFormateada,
  kmFormateado,
  totalFormateado,
  responsables,
  datosPdf,
  esDueno,
}: {
  ot: {
    id: string;
    numero: string;
    estado: string;
    fecha_ingreso: string;
    km_ingreso?: number | null;
    total?: number | null;
    items: ItemHistorial[];
  };
  fechaFormateada: string;
  fechaCierreFormateada?: string | null;
  kmFormateado?: string | null;
  totalFormateado?: string | null;
  responsables: {
    mecanicoNombre?: string | null;
    cerradoPorNombre?: string | null;
    cerradoPorRol?: string | null;
  };
  datosPdf: DatosOTPDF;
  esDueno: boolean;
}) {
  const [desplegado, setDesplegado] = useState(false);

  const tareas = ot.items.filter((it) => it.tipo === "mano_obra" || it.tipo === "servicio");
  const repuestos = ot.items.filter(
    (it) => it.tipo === "repuesto" || it.tipo === "insumo" || it.tipo === "tercero",
  );

  return (
    <article className="rounded-2xl border border-border/80 bg-card shadow-xs transition-all hover:border-accent/40 overflow-hidden">
      {/* Cabecera Principal de la Tarjeta */}
      <div className="p-4 space-y-3">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="font-mono text-sm font-black text-foreground">
                #{ot.numero}
              </span>
              <span
                className={`rounded-full px-2.5 py-0.5 text-[11px] font-bold ${
                  ESTADO_TONO[ot.estado] ?? "bg-muted text-muted-foreground"
                }`}
              >
                {ESTADO_LABEL[ot.estado] ?? ot.estado}
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-x-3 text-xs text-muted-foreground font-medium">
              <span className="flex items-center gap-1">
                <Clock className="h-3.5 w-3.5 text-muted-foreground/70" />
                <span>Ingreso: {fechaFormateada}</span>
              </span>
              {kmFormateado && <span>· {kmFormateado} km</span>}
              {fechaCierreFormateada && (
                <span className="text-emerald-500 font-semibold">
                  · Entregado: {fechaCierreFormateada}
                </span>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2">
            {esDueno && totalFormateado && (
              <span className="font-mono text-sm font-black text-foreground bg-muted/60 px-2.5 py-1 rounded-lg border border-border/60">
                {totalFormateado}
              </span>
            )}
            {/* Botón directo de Comprobante PDF */}
            <BotonPDFWhatsApp ot={datosPdf} />
          </div>
        </div>

        {/* Responsables: Mecánico asignado y Cerrado por */}
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs pt-1 border-t border-border/40">
          {responsables.mecanicoNombre ? (
            <span className="inline-flex items-center gap-1.5 text-foreground/90 font-medium">
              <Wrench className="h-3.5 w-3.5 text-accent shrink-0" aria-hidden />
              <span>
                Mecánico: <strong className="font-semibold text-foreground">{responsables.mecanicoNombre}</strong>
              </span>
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 text-muted-foreground">
              <Wrench className="h-3.5 w-3.5 text-muted-foreground/50 shrink-0" aria-hidden />
              <span>Sin mecánico asignado</span>
            </span>
          )}

          {responsables.cerradoPorNombre && (
            <span className="inline-flex items-center gap-1.5 text-emerald-500 font-medium">
              <CheckCircle2 className="h-3.5 w-3.5 shrink-0" aria-hidden />
              <span>
                Cerrado por: <strong className="font-semibold">{responsables.cerradoPorNombre}</strong>{" "}
                <span className="text-muted-foreground font-normal">
                  ({formatearRol(responsables.cerradoPorRol)})
                </span>
              </span>
            </span>
          )}
        </div>

        {/* Barra de acción: Ver tareas/repuestos & Abrir OT */}
        <div className="flex items-center justify-between gap-2 pt-2 border-t border-border/40">
          <button
            type="button"
            onClick={() => setDesplegado((v) => !v)}
            className="inline-flex items-center gap-1.5 text-xs font-bold text-accent hover:underline active:scale-95 transition-all"
          >
            <ChevronDown
              className={`h-4 w-4 transition-transform duration-200 ${desplegado ? "rotate-180" : ""}`}
            />
            <span>
              {desplegado
                ? "Ocultar desglose"
                : `Ver tareas y repuestos (${ot.items.length})`}
            </span>
          </button>

          <Link
            href={`/ot/${ot.id}`}
            className="inline-flex items-center gap-1 text-xs font-semibold text-muted-foreground hover:text-foreground active:scale-95 transition-all"
          >
            <span>Ver orden completa</span>
            <ArrowUpRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </div>

      {/* Desglose Colapsable de Tareas y Repuestos */}
      {desplegado && (
        <div className="border-t border-border/80 bg-muted/25 p-4 space-y-4 animate-in fade-in slide-in-from-top-2 duration-200">
          {ot.items.length === 0 ? (
            <p className="text-xs text-muted-foreground font-medium py-2 text-center">
              Esta orden no tiene ítems detallados cargados.
            </p>
          ) : (
            <div className="space-y-3">
              {/* Bloque Tareas de Mano de Obra */}
              {tareas.length > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-foreground uppercase tracking-wider">
                    <Wrench className="h-3.5 w-3.5 text-accent" />
                    <span>Mano de obra y servicios ({tareas.length})</span>
                  </div>
                  <div className="rounded-xl border border-border/70 bg-card overflow-hidden divide-y divide-border/50">
                    {tareas.map((t) => (
                      <div
                        key={t.id}
                        className="flex items-center justify-between p-2.5 text-xs"
                      >
                        <div className="min-w-0 pr-2">
                          <p className="font-semibold text-foreground truncate">{t.descripcion}</p>
                          <p className="text-[11px] text-muted-foreground">Cant: {t.cantidad}</p>
                        </div>
                        {esDueno && t.subtotal > 0 && (
                          <span className="font-mono font-bold text-foreground shrink-0">
                            ${t.subtotal.toLocaleString("es-AR")}
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Bloque Repuestos y Materiales */}
              {repuestos.length > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-foreground uppercase tracking-wider">
                    <Package className="h-3.5 w-3.5 text-accent" />
                    <span>Repuestos y materiales ({repuestos.length})</span>
                  </div>
                  <div className="rounded-xl border border-border/70 bg-card overflow-hidden divide-y divide-border/50">
                    {repuestos.map((r) => (
                      <div
                        key={r.id}
                        className="flex items-center justify-between p-2.5 text-xs"
                      >
                        <div className="min-w-0 pr-2">
                          <p className="font-semibold text-foreground truncate">{r.descripcion}</p>
                          <p className="text-[11px] text-muted-foreground">Cant: {r.cantidad}</p>
                        </div>
                        {esDueno && r.subtotal > 0 && (
                          <span className="font-mono font-bold text-foreground shrink-0">
                            ${r.subtotal.toLocaleString("es-AR")}
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </article>
  );
}
