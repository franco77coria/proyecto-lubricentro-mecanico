"use client";

import { useState, useTransition } from "react";
import { Plus, X } from "lucide-react";

import { useIsla } from "@/components/isla/IslaContext";
import { agregarItemChecklist, quitarItemChecklist } from "@/lib/actions/config";

export interface ItemChecklist {
  id: string;
  etiqueta: string;
  categoria: string | null;
}

/**
 * Checklist configurable del taller.
 *
 * Es lo que hace que esto sea un producto y no la app de un taller: cada uno
 * revisa cosas distintas. La plantilla por defecto reproduce la planilla de
 * Excel, y desde acá se ajusta.
 */
export function EditorChecklist({
  plantillaId,
  items,
  editable,
}: {
  plantillaId: string;
  items: ItemChecklist[];
  editable: boolean;
}) {
  const { notificar } = useIsla();
  const [nuevo, setNuevo] = useState("");
  const [pendiente, iniciar] = useTransition();

  function agregar(e: React.FormEvent) {
    e.preventDefault();
    const etiqueta = nuevo.trim();
    if (!etiqueta) return;

    iniciar(async () => {
      const res = await agregarItemChecklist(plantillaId, etiqueta);
      if (res.error) notificar({ tipo: "error", mensaje: res.error });
      else setNuevo("");
    });
  }

  function quitar(id: string) {
    iniciar(async () => {
      const res = await quitarItemChecklist(id);
      if (res.error) notificar({ tipo: "error", mensaje: res.error });
    });
  }

  return (
    <section className="tarjeta space-y-4 p-4">
      <div>
        <h2 className="t-seccion">Checklist de inspección</h2>
        <p className="mt-1 text-caption text-muted-foreground">
          Los puntos que se revisan en cada orden. Sacar uno no cambia las
          órdenes ya cargadas.
        </p>
      </div>

      <ul className="flex flex-wrap gap-1.5">
        {items.map((i) => (
          <li
            key={i.id}
            className="flex items-center gap-1.5 rounded-full bg-muted py-1 pl-3 pr-1 text-sm text-foreground"
          >
            {i.etiqueta}
            {editable && (
              <button
                type="button"
                onClick={() => quitar(i.id)}
                disabled={pendiente}
                aria-label={`Quitar ${i.etiqueta}`}
                className="grid h-7 w-7 place-items-center rounded-full text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive disabled:opacity-50"
              >
                <X className="h-3.5 w-3.5" aria-hidden />
              </button>
            )}
          </li>
        ))}
        {items.length === 0 && (
          <li className="text-caption text-muted-foreground">
            No hay ítems. Agregá el primero abajo.
          </li>
        )}
      </ul>

      {editable && (
        <form onSubmit={agregar} className="flex gap-2">
          <input
            value={nuevo}
            onChange={(e) => setNuevo(e.target.value)}
            placeholder="Ej. Correa de distribución"
            maxLength={60}
            aria-label="Nuevo ítem del checklist"
            className="min-h-11 flex-1 rounded-[var(--radius-sm)] border border-border bg-card px-3 text-base text-foreground outline-none focus:border-accent"
          />
          <button
            type="submit"
            disabled={pendiente || !nuevo.trim()}
            className="flex min-h-11 items-center gap-1.5 rounded-[var(--radius-sm)] bg-accent px-3.5 text-sm font-semibold text-accent-foreground transition-transform active:scale-[0.98] disabled:opacity-50"
          >
            <Plus className="h-4 w-4" strokeWidth={2.5} aria-hidden />
            Agregar
          </button>
        </form>
      )}
    </section>
  );
}
