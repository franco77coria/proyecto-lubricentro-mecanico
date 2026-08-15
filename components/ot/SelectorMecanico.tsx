"use client";

import { useTransition } from "react";
import { Wrench } from "lucide-react";
import { asignarMecanicoOT } from "@/lib/actions/ot";
import { useIsla } from "@/components/isla/IslaContext";

export interface MiembroEquipo {
  user_id: string;
  nombre: string | null;
  rol: string;
}

export function SelectorMecanico({
  otId,
  asignadoA,
  miembros,
}: {
  otId: string;
  asignadoA?: string | null;
  miembros: MiembroEquipo[];
}) {
  const [pendiente, iniciar] = useTransition();
  const { notificar } = useIsla();

  const handleCambio = (nuevoMecanicoId: string) => {
    iniciar(async () => {
      const res = await asignarMecanicoOT(otId, nuevoMecanicoId || null);
      if (res.error) {
        notificar({ tipo: "error", mensaje: res.error });
      } else {
        notificar({
          tipo: "exito",
          mensaje: nuevoMecanicoId ? "Mecánico asignado" : "Mecánico desasignado",
        });
      }
    });
  };

  return (
    <div className="flex items-center gap-2">
      <Wrench className="h-4 w-4 text-accent shrink-0" aria-hidden />
      <select
        value={asignadoA || ""}
        disabled={pendiente}
        onChange={(e) => handleCambio(e.target.value)}
        className="rounded-xl border border-border bg-card px-2.5 py-1.5 text-xs font-semibold text-foreground outline-none focus:border-accent disabled:opacity-50"
      >
        <option value="">Sin mecánico asignado</option>
        {miembros.map((m) => (
          <option key={m.user_id} value={m.user_id}>
            {m.nombre || "Mecánico"} ({m.rol})
          </option>
        ))}
      </select>
    </div>
  );
}
