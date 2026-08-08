"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Ban, TriangleAlert, X } from "lucide-react";

import { useIsla } from "@/components/isla/IslaContext";
import { anularOrden } from "@/lib/actions/ot-anular";

const MOTIVOS = [
  "El cliente no autorizó el trabajo",
  "Se cargó por error",
  "El auto se retiró sin hacer el trabajo",
  "Duplicada",
];

/**
 * Anulación de una orden.
 *
 * Pide un motivo escrito porque una orden anulada sin explicación es un
 * agujero en el historial: al mes siguiente nadie recuerda por qué ese auto
 * entró y no se le hizo nada.
 */
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
        className="flex min-h-10 items-center gap-1.5 rounded-[var(--radius-sm)] px-3 text-caption font-medium text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
      >
        <Ban className="h-3.5 w-3.5" aria-hidden />
        Anular orden
      </button>

      {abierto && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-slate-900/50 sm:items-center sm:p-4"
          role="dialog"
          aria-modal="true"
          aria-label="Anular orden"
        >
          <div className="w-full rounded-t-[var(--radius-lg)] bg-card p-5 pb-[calc(var(--safe-bottom)+1.25rem)] shadow-[var(--sombra-alta)] sm:max-w-md sm:rounded-[var(--radius-lg)] sm:pb-5">
            <div className="mb-4 flex items-start justify-between gap-3">
              <div className="flex items-start gap-2.5">
                <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-destructive/10 text-destructive">
                  <TriangleAlert className="h-4.5 w-4.5" aria-hidden />
                </span>
                <div>
                  <h3 className="text-base font-semibold text-foreground">Anular la orden</h3>
                  <p className="text-caption text-muted-foreground">
                    Los repuestos cargados vuelven al stock.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setAbierto(false)}
                aria-label="Cerrar"
                className="grid h-9 w-9 shrink-0 place-items-center rounded-full text-muted-foreground hover:bg-muted"
              >
                <X className="h-4.5 w-4.5" aria-hidden />
              </button>
            </div>

            <form onSubmit={anular} className="space-y-3">
              <label className="block space-y-1.5">
                <span className="text-caption font-medium text-muted-foreground">
                  ¿Por qué se anula?
                </span>
                <input
                  value={motivo}
                  onChange={(e) => setMotivo(e.target.value)}
                  required
                  minLength={4}
                  maxLength={200}
                  autoFocus
                  placeholder="Escribí el motivo"
                  className="min-h-11 w-full rounded-[var(--radius-sm)] border border-border bg-card px-3 text-base text-foreground outline-none focus:border-accent"
                />
              </label>

              <div className="flex flex-wrap gap-1.5">
                {MOTIVOS.map((m) => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => setMotivo(m)}
                    className="rounded-full bg-muted px-3 py-1.5 text-caption text-foreground transition-colors hover:bg-accent-suave hover:text-accent"
                  >
                    {m}
                  </button>
                ))}
              </div>

              <p className="text-caption text-muted-foreground">
                Queda registrada como anulada, con el motivo. No se borra: el auto
                pasó por el taller y eso es parte de su historial.
              </p>

              {error && (
                <p role="alert" className="flex items-start gap-2 text-caption text-destructive">
                  <TriangleAlert className="mt-px h-3.5 w-3.5 shrink-0" aria-hidden />
                  {error}
                </p>
              )}

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setAbierto(false)}
                  className="min-h-11 flex-1 rounded-[var(--radius-sm)] bg-muted text-sm font-medium text-foreground"
                >
                  Volver
                </button>
                <button
                  type="submit"
                  disabled={pendiente || motivo.trim().length < 4}
                  className="min-h-11 flex-[2] rounded-[var(--radius-sm)] bg-destructive text-sm font-semibold text-destructive-foreground transition-transform active:scale-[0.98] disabled:opacity-50"
                >
                  {pendiente ? "Anulando…" : "Anular la orden"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
