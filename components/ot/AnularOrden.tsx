"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Ban, TriangleAlert } from "lucide-react";

import { useIsla } from "@/components/isla/IslaContext";
import { Sheet } from "@/components/sheet/Sheet";
import { anularOrden } from "@/lib/actions/ot-anular";

const MOTIVOS = [
  "El cliente no autorizó el trabajo",
  "Se cargó por error",
  "El auto se retiró sin hacer el trabajo",
  "Duplicada",
];

export function AnularOrden({ otId, estadoActual }: { otId: string; estadoActual: string }) {
  const router = useRouter();
  const { notificar } = useIsla();
  const [abierto, setAbierto] = useState(false);
  const [motivo, setMotivo] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pendiente, iniciar] = useTransition();

  if (estadoActual === "anulado") return null;

  function anular(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    iniciar(async () => {
      const res = await anularOrden(otId, motivo);
      if (res.error) return setError(res.error);

      notificar({
        tipo: "exito",
        mensaje:
          res.devueltos && res.devueltos > 0
            ? `Orden anulada · ${res.devueltos} repuesto${res.devueltos === 1 ? "" : "s"} devuelto${res.devueltos === 1 ? "" : "s"} al stock`
            : "Orden anulada",
      });
      setAbierto(false);
      router.refresh();
    });
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setAbierto(true)}
        className="flex min-h-10 items-center gap-1.5 rounded-xl px-3 text-xs font-bold text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive active:scale-95"
      >
        <Ban className="h-4 w-4" aria-hidden />
        <span>Anular orden</span>
      </button>

      <Sheet
        abierto={abierto}
        onCerrar={() => setAbierto(false)}
        titulo="Anular Orden de Trabajo"
      >
        <form onSubmit={anular} className="space-y-4 p-5">
          <div className="flex gap-3 rounded-2xl bg-destructive/10 border border-destructive/20 p-4 text-xs text-destructive">
            <TriangleAlert className="h-5 w-5 shrink-0" aria-hidden />
            <p className="leading-relaxed">
              Esta acción no se puede deshacer. Los repuestos cargados volverán al stock automáticamente y la orden quedará marcada como anulada con el motivo.
            </p>
          </div>

          <label className="block space-y-1.5">
            <span className="text-caption font-semibold text-muted-foreground">Motivo de la anulación *</span>
            <div className="mb-2 flex flex-wrap gap-1.5">
              {MOTIVOS.map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => setMotivo(m)}
                  className="rounded-lg border border-border bg-card px-2.5 py-1 text-xs font-medium text-muted-foreground hover:bg-muted hover:text-foreground active:scale-95"
                >
                  {m}
                </button>
              ))}
            </div>
            <textarea
              rows={3}
              required
              value={motivo}
              onChange={(e) => setMotivo(e.target.value)}
              placeholder="Explicá por qué se anula esta orden..."
              className="min-h-24 w-full resize-none rounded-xl border border-border bg-card px-3.5 py-2.5 text-base text-foreground outline-none focus:border-accent"
            />
          </label>

          {error && (
            <p role="alert" className="text-caption font-bold text-destructive">
              {error}
            </p>
          )}

          <div className="flex gap-2 pt-2">
            <button
              type="button"
              onClick={() => setAbierto(false)}
              className="min-h-12 flex-1 rounded-2xl border border-border bg-card text-sm font-semibold text-muted-foreground hover:bg-muted"
            >
              Volver
            </button>
            <button
              type="submit"
              disabled={pendiente || !motivo.trim()}
              className="min-h-12 flex-1 rounded-2xl bg-destructive text-sm font-bold text-destructive-foreground shadow-md transition-transform active:scale-[0.98] disabled:opacity-60"
            >
              {pendiente ? "Anulando…" : "Confirmar anulación"}
            </button>
          </div>
        </form>
      </Sheet>
    </>
  );
}
