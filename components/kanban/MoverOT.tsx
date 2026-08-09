"use client";

import { ChevronLeft, ChevronRight, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { useIsla } from "@/components/isla/IslaContext";
import { cambiarEstadoOT } from "@/lib/actions/ot";
import { COLUMNAS_KANBAN, etiquetaEstado, type EstadoDb } from "@/lib/estados-ot";
import { ESTADOS_OT, type EstadoOT } from "@/lib/schemas/ot";

/** El label que espera `cambiarEstadoOT`, a partir del valor de la base. */
function aEtiquetaAccion(estado: EstadoDb): EstadoOT | null {
  const label = etiquetaEstado(estado);
  return (ESTADOS_OT as readonly string[]).includes(label) ? (label as EstadoOT) : null;
}

/**
 * Mover una orden de columna.
 *
 * Son dos botones y no arrastrar, a propósito. El tablero se usa en una tablet
 * apoyada en el taller y con las manos sucias: arrastrar una tarjeta a través
 * de un board que scrollea en horizontal exige precisión que ahí no hay, y si
 * se suelta en el lugar equivocado la orden cambia de estado sin que nadie lo
 * quiera. Dos objetivos grandes de 44px no fallan.
 *
 * El movimiento es optimista: la tarjeta cambia al toque y si el servidor
 * rechaza se avisa y se revierte. En el taller la conexión se corta seguido y
 * esperar la ida y vuelta hace sentir la app trabada.
 */
export function MoverOT({
  otId,
  estado,
  patente,
}: {
  otId: string;
  estado: EstadoDb;
  patente: string;
}) {
  const router = useRouter();
  const { notificar } = useIsla();
  const [pendiente, iniciar] = useTransition();
  const [optimista, setOptimista] = useState<EstadoDb | null>(null);

  const actual = optimista ?? estado;
  const i = COLUMNAS_KANBAN.indexOf(actual);
  const anterior = i > 0 ? COLUMNAS_KANBAN[i - 1] : null;
  const siguiente = i >= 0 && i < COLUMNAS_KANBAN.length - 1 ? COLUMNAS_KANBAN[i + 1] : null;

  function mover(destino: EstadoDb | null) {
    if (!destino) return;
    const etiqueta = aEtiquetaAccion(destino);
    if (!etiqueta) return;

    const previo = actual;
    setOptimista(destino);

    iniciar(async () => {
      const res = await cambiarEstadoOT(otId, etiqueta);
      if (res.error) {
        setOptimista(previo);
        notificar({ tipo: "error", mensaje: res.error });
        return;
      }
      notificar({ tipo: "exito", mensaje: `${patente} → ${etiquetaEstado(destino)}` });
      router.refresh();
    });
  }

  return (
    <div className="flex items-center gap-1">
      <button
        type="button"
        onClick={() => mover(anterior)}
        disabled={!anterior || pendiente}
        aria-label={anterior ? `Volver ${patente} a ${etiquetaEstado(anterior)}` : "No hay estado anterior"}
        className="grid h-11 w-11 place-items-center rounded-[var(--radius-sm)] bg-muted text-muted-foreground transition-transform active:scale-90 disabled:opacity-25"
      >
        <ChevronLeft className="h-4.5 w-4.5" aria-hidden />
      </button>
      <button
        type="button"
        onClick={() => mover(siguiente)}
        disabled={!siguiente || pendiente}
        aria-label={siguiente ? `Pasar ${patente} a ${etiquetaEstado(siguiente)}` : "Última columna"}
        className="grid h-11 w-11 place-items-center rounded-[var(--radius-sm)] bg-accent text-white transition-transform active:scale-90 disabled:opacity-25"
      >
        {pendiente ? (
          <Loader2 className="h-4.5 w-4.5 animate-spin" aria-hidden />
        ) : (
          <ChevronRight className="h-4.5 w-4.5" aria-hidden />
        )}
      </button>
    </div>
  );
}
