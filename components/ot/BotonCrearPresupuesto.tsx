"use client";

import { FileText, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { useIsla } from "@/components/isla/IslaContext";

export function BotonCrearPresupuesto({ otId, estadoActual }: { otId: string, estadoActual: string }) {
  const router = useRouter();
  const { notificar } = useIsla();
  const [pendiente, iniciar] = useTransition();
  const [error, setError] = useState<string | null>(null);

  // Solo mostramos el botón si la OT no está ya en presupuesto, reparacion, o listo
  if (estadoActual !== "ingresado" && estadoActual !== "diagnostico") {
    return null;
  }

  function crearPresupuesto() {
    setError(null);
    iniciar(async () => {
      try {
        // En un caso real, aquí llamaríamos a un server action para cambiar el estado a "presupuesto"
        // y opcionalmente generar el link.
        // await cambiarEstadoOT(otId, "presupuesto");
        notificar({ tipo: "exito", mensaje: "Presupuesto creado con éxito (Demo)" });
        router.refresh();
      } catch (err) {
        setError("Error al crear presupuesto");
      }
    });
  }

  return (
    <div className="flex flex-col gap-1">
      <button
        onClick={crearPresupuesto}
        disabled={pendiente}
        className="inline-flex h-9 items-center justify-center gap-2 rounded-lg bg-emerald-600 px-4 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-emerald-700 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50"
      >
        {pendiente ? (
          <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
        ) : (
          <FileText className="h-4 w-4" aria-hidden />
        )}
        Crear Presupuesto
      </button>
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}
