"use client";

import { FileText, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { useIsla } from "@/components/isla/IslaContext";
import { cambiarEstadoOT } from "@/lib/actions/ot";

export function BotonCrearPresupuesto({ otId, estadoActual }: { otId: string; estadoActual: string }) {
  const router = useRouter();
  const { notificar } = useIsla();
  const [pendiente, iniciar] = useTransition();
  const [error, setError] = useState<string | null>(null);

  // Solo mostramos el botón si la OT no está ya en presupuesto, reparacion, o listo
  if (estadoActual !== "recibido" && estadoActual !== "aprobado") {
    return null;
  }

  function crearPresupuesto() {
    setError(null);
    iniciar(async () => {
      try {
        const res = await cambiarEstadoOT(otId, "Presupuesto");
        if (res.error) {
          setError(res.error);
          return;
        }
        notificar({ tipo: "exito", mensaje: "Orden pasada a presupuesto" });
        router.refresh();
      } catch {
        setError("Error al crear presupuesto");
      }
    });
  }

  return (
    <div className="flex flex-col gap-1">
      <button
        type="button"
        onClick={crearPresupuesto}
        disabled={pendiente}
        className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-emerald-600 px-3.5 text-xs font-bold text-white shadow-sm transition-transform active:scale-95 hover:bg-emerald-500 disabled:pointer-events-none disabled:opacity-50"
      >
        {pendiente ? (
          <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
        ) : (
          <FileText className="h-4 w-4" aria-hidden />
        )}
        <span>Crear Presupuesto</span>
      </button>
      {error && <span className="text-[10px] text-destructive">{error}</span>}
    </div>
  );
}
