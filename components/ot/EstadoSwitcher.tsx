"use client";

import { CheckCircle, ChevronDown } from "lucide-react";
import { useState, useTransition } from "react";

import { cambiarEstadoOT } from "@/lib/actions/ot";
import { ESTADOS_OT, EstadoOT } from "@/lib/schemas/ot";

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
  const [isPending, startTransition] = useTransition();
  const [desplegado, setDesplegado] = useState(false);
  const labelActual = DB_TO_LABEL[estadoActual] || estadoActual;

  const handleCambiar = (nuevo: EstadoOT) => {
    setDesplegado(false);
    if (nuevo === labelActual) return;

    startTransition(async () => {
      await cambiarEstadoOT(otId, nuevo);
    });
  };

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setDesplegado(!desplegado)}
        disabled={isPending}
        className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-slate-900 px-4 text-xs font-bold text-white shadow-sm transition-transform active:scale-95 disabled:opacity-50"
      >
        <span className="h-2 w-2 rounded-full bg-accent animate-pulse" />
        <span>{isPending ? "Actualizando..." : `Estado: ${labelActual}`}</span>
        <ChevronDown className={`h-4 w-4 transition-transform ${desplegado ? "rotate-180" : ""}`} />
      </button>

      {desplegado && (
        <div className="absolute right-0 top-12 z-40 w-56 rounded-xl border border-border bg-card p-1.5 shadow-2xl backdrop-blur-md">
          {ESTADOS_OT.map((est) => {
            const esSeleccionado = labelActual === est;
            return (
              <button
                key={est}
                type="button"
                onClick={() => handleCambiar(est)}
                className={`flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-xs font-semibold transition-colors ${
                  esSeleccionado
                    ? "bg-accent/10 text-accent font-bold"
                    : "text-foreground hover:bg-muted"
                }`}
              >
                <span>{est}</span>
                {esSeleccionado && <CheckCircle className="h-3.5 w-3.5 text-accent" />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
