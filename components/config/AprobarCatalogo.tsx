"use client";

import { Check, ListChecks, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { useIsla } from "@/components/isla/IslaContext";
import {
  resolverPendiente,
  type PendienteCatalogo,
} from "@/lib/actions/catalogo-aprobacion";

const NOMBRE_NIVEL: Record<string, string> = {
  marca: "Marca",
  modelo: "Modelo",
  motorizacion: "Motor",
};

/**
 * Revisión de lo que el mostrador cargó con OTROS.
 *
 * Solo aparece cuando hay algo que revisar: una tarjeta permanente que dice
 * "no hay nada" es ruido en una pantalla de ajustes que ya tiene cinco
 * secciones.
 *
 * Rechazar no borra la fila (queda en estado `rechazado`) porque puede haber
 * vehículos ya cargados apuntando a ella. Borrarla los dejaría sin modelo.
 */
export function AprobarCatalogo({
  pendientes: iniciales,
  editable,
}: {
  pendientes: PendienteCatalogo[];
  editable: boolean;
}) {
  const router = useRouter();
  const { notificar } = useIsla();
  const [pendientes, setPendientes] = useState(iniciales);
  const [, iniciar] = useTransition();

  if (pendientes.length === 0) return null;

  function resolver(p: PendienteCatalogo, estado: "aprobado" | "rechazado") {
    setPendientes((prev) => prev.filter((x) => !(x.nivel === p.nivel && x.id === p.id)));
    iniciar(async () => {
      const res = await resolverPendiente(p.nivel, p.id, estado);
      if (res.error) {
        notificar({ tipo: "error", mensaje: res.error });
        return;
      }
      notificar({
        tipo: "exito",
        mensaje: estado === "aprobado" ? `${p.nombre} aprobado` : `${p.nombre} rechazado`,
      });
      router.refresh();
    });
  }

  return (
    <section className="tarjeta space-y-3 p-4">
      <h2 className="t-seccion flex items-center gap-1.5">
        <ListChecks className="h-3.5 w-3.5 text-accent" aria-hidden />
        Catálogo por revisar
        <span className="ml-auto rounded-full bg-accent/10 px-2 py-0.5 text-[0.6875rem] font-bold text-accent">
          {pendientes.length}
        </span>
      </h2>

      <p className="text-caption text-muted-foreground">
        Cargado desde una orden con la opción <strong>Otra…</strong>. Aprobalo si
        está bien escrito; rechazalo si es un duplicado o un error de tipeo.
      </p>

      <ul className="divide-y divide-border">
        {pendientes.map((p) => (
          <li key={`${p.nivel}-${p.id}`} className="flex items-center gap-2 py-2">
            <span className="min-w-0 flex-1">
              <span className="block truncate text-sm font-medium text-foreground">
                {p.nombre}
              </span>
              <span className="block truncate text-caption text-muted-foreground">
                {NOMBRE_NIVEL[p.nivel] ?? p.nivel}
                {p.contexto ? ` · ${p.contexto}` : ""}
              </span>
            </span>

            {editable ? (
              <>
                <button
                  type="button"
                  onClick={() => resolver(p, "aprobado")}
                  aria-label={`Aprobar ${p.nombre}`}
                  className="grid h-10 w-10 shrink-0 place-items-center rounded-[var(--radius-sm)] bg-emerald-600 text-white active:scale-95"
                >
                  <Check className="h-4 w-4" aria-hidden />
                </button>
                <button
                  type="button"
                  onClick={() => resolver(p, "rechazado")}
                  aria-label={`Rechazar ${p.nombre}`}
                  className="grid h-10 w-10 shrink-0 place-items-center rounded-[var(--radius-sm)] bg-muted text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                >
                  <X className="h-4 w-4" aria-hidden />
                </button>
              </>
            ) : (
              <span className="shrink-0 text-caption text-muted-foreground">Lo revisa el dueño</span>
            )}
          </li>
        ))}
      </ul>
    </section>
  );
}
