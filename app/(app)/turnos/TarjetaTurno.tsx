"use client";

import { useTransition, useOptimistic } from "react";
import { Clock, CheckCircle2, User, Car, Phone } from "lucide-react";
import { type Turno, cambiarEstadoTurno, type EstadoTurno } from "@/lib/actions/turnos";
import { useIsla } from "@/components/isla/IslaContext";

const COLORES_ESTADO: Record<EstadoTurno, string> = {
  pendiente: "bg-yellow-500/10 text-yellow-600 border-yellow-500/20",
  confirmado: "bg-blue-500/10 text-blue-600 border-blue-500/20",
  ingresado: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20",
  cancelado: "bg-destructive/10 text-destructive border-destructive/20",
  no_asistio: "bg-muted text-muted-foreground border-border",
};

export function TarjetaTurno({ turno }: { turno: Turno }) {
  const [isPending, startTransition] = useTransition();
  const { notificar } = useIsla();
  
  const [estadoOptimista, setEstadoOptimista] = useOptimistic<EstadoTurno, EstadoTurno>(
    turno.estado,
    (estado, nuevoEstado) => nuevoEstado
  );
  
  const fecha = new Date(turno.fecha_hora);
  const formatterHora = new Intl.DateTimeFormat("es-AR", { hour: "2-digit", minute: "2-digit" });
  const formatterDia = new Intl.DateTimeFormat("es-AR", { weekday: "short", day: "numeric", month: "short" });

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

  return (
    <div className={`relative flex flex-col gap-3 rounded-2xl border bg-card p-4 shadow-sm transition-opacity ${isPending ? 'opacity-50' : ''}`}>
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-2 text-sm font-bold text-foreground">
          <Clock className="h-4 w-4 text-accent" />
          <span>{formatterHora.format(fecha)}</span>
          <span className="text-muted-foreground font-normal ml-1">{formatterDia.format(fecha)}</span>
        </div>
        <span className={`rounded-md border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${COLORES_ESTADO[estadoOptimista]}`}>
          {estadoOptimista}
        </span>
      </div>

      <div className="space-y-1">
        <h3 className="text-sm font-bold leading-tight">{turno.motivo}</h3>
        {turno.notas && <p className="text-xs text-muted-foreground line-clamp-2">{turno.notas}</p>}
      </div>

      <div className="mt-auto flex flex-col gap-1.5 pt-3 border-t border-border/50 text-xs text-muted-foreground">
        {turno.vehiculo && (
          <div className="flex items-center gap-1.5">
            <Car className="h-3.5 w-3.5 shrink-0" />
            <span className="font-medium text-foreground">{turno.vehiculo.patente}</span>
            <span className="truncate">
              — {turno.vehiculo.motorizacion?.modelo?.marca?.nombre} {turno.vehiculo.motorizacion?.modelo?.nombre}
            </span>
          </div>
        )}
        {turno.cliente && (
          <div className="flex items-center gap-1.5">
            <User className="h-3.5 w-3.5 shrink-0" />
            <span className="truncate">{turno.cliente.nombre}</span>
            {turno.cliente.telefono && (
              <a href={`tel:${turno.cliente.telefono.replace(/\D/g, '')}`} className="flex items-center gap-1 ml-auto text-blue-600 hover:underline">
                <Phone className="h-3 w-3" />
                <span>{turno.cliente.telefono}</span>
              </a>
            )}
          </div>
        )}
      </div>

      {estadoOptimista === 'pendiente' && (
        <div className="flex gap-2 pt-3 mt-1">
          <button 
            disabled={isPending}
            onClick={() => cambiarEstado('confirmado')}
            className="flex-1 min-h-[44px] rounded-lg bg-blue-50 text-blue-600 py-1.5 text-xs font-bold hover:bg-blue-100"
          >
            Confirmar
          </button>
          <button 
            disabled={isPending}
            onClick={() => cambiarEstado('cancelado')}
            className="flex-1 min-h-[44px] rounded-lg bg-red-50 text-red-600 py-1.5 text-xs font-bold hover:bg-red-100"
          >
            Cancelar
          </button>
        </div>
      )}
      {estadoOptimista === 'confirmado' && (
        <div className="flex gap-2 pt-3 mt-1">
          <button 
            disabled={isPending}
            onClick={() => cambiarEstado('ingresado')}
            className="flex-1 flex min-h-[44px] items-center justify-center gap-1 rounded-lg bg-emerald-50 text-emerald-600 py-1.5 text-xs font-bold hover:bg-emerald-100"
          >
            <CheckCircle2 className="h-3.5 w-3.5" /> Ingresó
          </button>
          <button 
            disabled={isPending}
            onClick={() => cambiarEstado('no_asistio')}
            className="flex-1 min-h-[44px] rounded-lg bg-muted text-muted-foreground py-1.5 text-xs font-bold hover:bg-muted/80"
          >
            No vino
          </button>
        </div>
      )}
    </div>
  );
}
