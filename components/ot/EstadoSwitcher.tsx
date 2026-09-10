"use client";

import { CheckCircle, ChevronDown } from "lucide-react";
import { useState, useTransition, useEffect, useRef } from "react";

import { cambiarEstadoOT } from "@/lib/actions/ot";
import { ESTADOS_OT, EstadoOT } from "@/lib/schemas/ot";
import { useIsla } from "@/components/isla/IslaContext";

const DB_TO_LABEL: Record<string, EstadoOT> = {
  presupuesto: "Presupuesto",
  aprobado: "Aprobado",
  recibido: "Recibido",
  en_trabajo: "En trabajo",
  esperando_repuesto: "Esperando repuesto",
  listo: "Listo para entregar",
  entregado: "Entregado",
  cerrado: "Cerrado",
  anulado: "Anulado",
};

export function EstadoSwitcher({ otId, estadoActual }: { otId: string; estadoActual: string }) {
  const { notificar } = useIsla();
  const [isPending, startTransition] = useTransition();
  const [desplegado, setDesplegado] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const labelActual = DB_TO_LABEL[estadoActual] || estadoActual;

  // Cerrar al hacer click afuera
  useEffect(() => {
    if (!desplegado) return;
    const handleClickAfuera = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setDesplegado(false);
      }
    };
    document.addEventListener("mousedown", handleClickAfuera);
    return () => document.removeEventListener("mousedown", handleClickAfuera);
  }, [desplegado]);

  const handleCambiar = (nuevo: EstadoOT) => {
    setDesplegado(false);
    if (nuevo === labelActual) return;

    startTransition(async () => {
      const res = await cambiarEstadoOT(otId, nuevo);
      if (res?.error) {
        notificar({ tipo: "error", mensaje: res.error });
      } else {
        notificar({ tipo: "exito", mensaje: `Estado cambiado a: ${nuevo}` });
      }
    });
  };

  const getDotColor = (est: string) => {
    if (est === "Listo para entregar" || est === "Entregado" || est === "Cerrado") return "bg-emerald-500";
    if (est === "En trabajo" || est === "Recibido") return "bg-amber-500 animate-pulse";
    if (est === "Esperando repuesto") return "bg-violet-500";
    if (est === "Anulado") return "bg-rose-500";
    return "bg-sky-500";
  };

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => setDesplegado(!desplegado)}
        disabled={isPending}
        className="inline-flex min-h-12 items-center gap-2.5 rounded-2xl bg-card border border-border/80 px-4 text-xs font-black text-foreground shadow-sm transition-all hover:border-accent hover:bg-card-elevada active:scale-95 disabled:opacity-50"
      >
        <span className={`h-2.5 w-2.5 rounded-full ${getDotColor(labelActual)}`} />
        <span>{isPending ? "Guardando..." : `Estado: ${labelActual}`}</span>
        <ChevronDown className={`h-4 w-4 transition-transform duration-200 text-muted-foreground ${desplegado ? "rotate-180" : ""}`} />
      </button>

      {desplegado && (
        <div className="absolute right-0 top-14 z-50 w-60 rounded-2xl border border-border bg-card p-1.5 shadow-2xl backdrop-blur-2xl animate-in fade-in zoom-in-95 duration-150">
          <div className="px-3 py-1.5 text-[10px] font-mono font-bold uppercase tracking-wider text-muted-foreground border-b border-border/60 mb-1">
            Cambiar estado de la orden:
          </div>
          {ESTADOS_OT.map((est) => {
            const esSeleccionado = labelActual === est;
            return (
              <button
                key={est}
                type="button"
                onClick={() => handleCambiar(est)}
                className={`flex w-full min-h-11 items-center justify-between rounded-xl px-3 py-2 text-left text-xs font-bold transition-colors ${
                  esSeleccionado
                    ? "bg-accent/15 text-accent font-black"
                    : "text-foreground hover:bg-muted"
                }`}
              >
                <div className="flex items-center gap-2">
                  <span className={`h-2 w-2 rounded-full ${getDotColor(est)}`} />
                  <span>{est}</span>
                </div>
                {esSeleccionado && <CheckCircle className="h-4 w-4 text-accent" />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
