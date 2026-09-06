"use client";

import { useTransition, useOptimistic } from "react";
import { Clock, CheckCircle2, User, Phone, Plus, ArrowRight } from "lucide-react";
import Link from "next/link";
import { type Turno, cambiarEstadoTurno, type EstadoTurno } from "@/lib/actions/turnos";
import { useIsla } from "@/components/isla/IslaContext";
import { useFormato } from "@/lib/i18n/I18nContext";
import { PlacaPatente } from "@/components/ui/PlacaPatente";

const COLORES_ESTADO: Record<EstadoTurno, string> = {
  pendiente: "bg-amber-500/15 text-amber-400 border-amber-500/30",
  confirmado: "bg-blue-500/15 text-blue-400 border-blue-500/30",
  ingresado: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
  cancelado: "bg-rose-500/15 text-rose-400 border-rose-500/30",
  no_asistio: "bg-muted text-muted-foreground border-border",
};

export function TarjetaTurno({ turno }: { turno: Turno }) {
  const [isPending, startTransition] = useTransition();
  const { notificar } = useIsla();

  const [estadoOptimista, setEstadoOptimista] = useOptimistic<EstadoTurno, EstadoTurno>(
    turno.estado,
    (estado, nuevoEstado) => nuevoEstado,
  );

  const { locale } = useFormato();
  const fecha = new Date(turno.fecha_hora);
  const formatterHora = new Intl.DateTimeFormat(locale, { hour: "2-digit", minute: "2-digit" });
  const formatterDia = new Intl.DateTimeFormat(locale, { weekday: "short", day: "numeric", month: "short" });

  const cambiarEstado = (nuevoEstado: EstadoTurno) => {
    startTransition(async () => {
      setEstadoOptimista(nuevoEstado);
      const res = await cambiarEstadoTurno(turno.id, nuevoEstado);
      if (res.success) {
        notificar({ tipo: "exito", mensaje: `Turno marcado como ${nuevoEstado}` });
      } else {
        notificar({ tipo: "alerta", mensaje: res.error || "No se pudo actualizar el turno" });
      }
    });
  };

  const modeloNombre = [
    turno.vehiculo?.motorizacion?.modelo?.marca?.nombre,
    turno.vehiculo?.motorizacion?.modelo?.nombre,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div
      className={`relative flex flex-col gap-3 rounded-3xl border border-border/80 bg-card p-5 shadow-sm transition-all hover:border-accent/40 ${
        isPending ? "opacity-60" : ""
      }`}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-2 text-sm font-black text-foreground">
          <Clock className="h-4 w-4 text-accent" />
          <span className="font-mono text-base">{formatterHora.format(fecha)} hs</span>
          <span className="text-muted-foreground font-semibold text-xs ml-1 capitalize">
            {formatterDia.format(fecha)}
          </span>
        </div>
        <span
          className={`rounded-full border px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider ${COLORES_ESTADO[estadoOptimista]}`}
        >
          {estadoOptimista.replace("_", " ")}
        </span>
      </div>

      <div className="space-y-1">
        <h3 className="text-base font-black text-foreground leading-tight">{turno.motivo}</h3>
        {turno.notas && <p className="text-xs text-muted-foreground line-clamp-2">{turno.notas}</p>}
      </div>

      {/* Ficha Rápida de Vehículo y Cliente */}
      <div className="mt-auto flex flex-col gap-2 pt-3 border-t border-border/60 text-xs">
        {turno.vehiculo && (
          <div className="flex items-center justify-between gap-2">
            <PlacaPatente patente={turno.vehiculo.patente} size="sm" />
            <span className="font-bold text-foreground truncate text-right flex-1">
              {modeloNombre || "Vehículo sin modelo"}
            </span>
          </div>
        )}
        {turno.cliente && (
          <div className="flex items-center justify-between gap-2 text-muted-foreground pt-1 border-t border-border/40">
            <div className="flex items-center gap-1.5 min-w-0">
              <User className="h-3.5 w-3.5 shrink-0 text-accent" />
              <span className="truncate font-semibold text-foreground">{turno.cliente.nombre}</span>
            </div>
            {turno.cliente.telefono && (
              <a
                href={`tel:${turno.cliente.telefono.replace(/\D/g, "")}`}
                className="flex items-center gap-1 text-emerald-400 font-bold hover:underline shrink-0"
              >
                <Phone className="h-3 w-3" />
                <span>{turno.cliente.telefono}</span>
              </a>
            )}
          </div>
        )}
      </div>

      {/* Acciones de 1-Tap con botones mínimos de 48px */}
      {estadoOptimista === "pendiente" && (
        <div className="flex gap-2 pt-3 mt-1 border-t border-border/60">
          <button
            type="button"
            disabled={isPending}
            onClick={() => cambiarEstado("confirmado")}
            className="flex-1 min-h-12 rounded-xl bg-blue-500/15 text-blue-400 border border-blue-500/30 py-2 text-xs font-black hover:bg-blue-500/25 active:scale-95 transition-all"
          >
            Confirmar Turno
          </button>
          <button
            type="button"
            disabled={isPending}
            onClick={() => cambiarEstado("cancelado")}
            className="flex-1 min-h-12 rounded-xl bg-rose-500/15 text-rose-400 border border-rose-500/30 py-2 text-xs font-black hover:bg-rose-500/25 active:scale-95 transition-all"
          >
            Cancelar
          </button>
        </div>
      )}

      {estadoOptimista === "confirmado" && (
        <div className="flex gap-2 pt-3 mt-1 border-t border-border/60">
          <button
            type="button"
            disabled={isPending}
            onClick={() => cambiarEstado("ingresado")}
            className="flex-1 flex min-h-12 items-center justify-center gap-1.5 rounded-xl bg-emerald-500 text-black py-2 text-xs font-black hover:bg-emerald-400 active:scale-95 transition-all shadow-md shadow-emerald-500/20"
          >
            <CheckCircle2 className="h-4 w-4" /> Ingresó a Fosa
          </button>
          <button
            type="button"
            disabled={isPending}
            onClick={() => cambiarEstado("no_asistio")}
            className="min-h-12 px-4 rounded-xl bg-muted text-muted-foreground border border-border/80 text-xs font-bold hover:bg-muted/80 active:scale-95 transition-all"
          >
            No vino
          </button>
        </div>
      )}

      {estadoOptimista === "ingresado" && (
        <div className="pt-3 mt-1 border-t border-border/60">
          <Link
            href="/ot/nueva"
            className="flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-accent text-white py-2 text-xs font-black shadow-md shadow-orange-500/20 hover:brightness-110 active:scale-95 transition-all"
          >
            <Plus className="h-4 w-4 stroke-[3]" />
            <span>Abrir Orden de Trabajo (OT)</span>
            <ArrowRight className="h-3.5 w-3.5 ml-1" />
          </Link>
        </div>
      )}
    </div>
  );
}
