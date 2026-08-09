"use client";

import { Check, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { aprobarPresupuestoPublico } from "@/lib/actions/seguimiento";

/**
 * Aprobación del presupuesto por el cliente.
 *
 * Pide una confirmación explícita antes de mandar. No es burocracia: es la
 * autorización para que el taller gaste plata en repuestos, y un toque
 * accidental mientras se scrollea en el celular no puede valer como firma.
 */
export function BotonAprobar({ token }: { token: string }) {
  const router = useRouter();
  const [confirmando, setConfirmando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pendiente, iniciar] = useTransition();

  function aprobar() {
    setError(null);
    iniciar(async () => {
      const res = await aprobarPresupuestoPublico(token);
      if (!res.ok) {
        setError(
          res.motivo === "estado_no_permite"
            ? "El taller ya avanzó con esta orden. Llamalos para confirmar."
            : "No se pudo registrar la aprobación. Probá de nuevo o llamá al taller.",
        );
        return;
      }
      router.refresh();
    });
  }

  if (!confirmando) {
    return (
      <div className="space-y-2">
        <button
          type="button"
          onClick={() => setConfirmando(true)}
          className="flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-accent text-sm font-bold text-white shadow-lg transition-transform active:scale-[0.98]"
        >
          <Check className="h-4 w-4" aria-hidden />
          Aprobar el presupuesto
        </button>
        {error && (
          <p role="alert" className="text-caption font-semibold text-destructive">
            {error}
          </p>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <p className="text-sm font-semibold text-foreground">
        ¿Confirmás que autorizás estos trabajos?
      </p>
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => setConfirmando(false)}
          className="min-h-12 flex-1 rounded-xl bg-muted text-sm font-semibold text-foreground active:scale-[0.98]"
        >
          Todavía no
        </button>
        <button
          type="button"
          onClick={aprobar}
          disabled={pendiente}
          className="flex min-h-12 flex-1 items-center justify-center gap-2 rounded-xl bg-emerald-600 text-sm font-bold text-white shadow-lg active:scale-[0.98] disabled:opacity-60"
        >
          {pendiente ? (
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
          ) : (
            <Check className="h-4 w-4" aria-hidden />
          )}
          Sí, aprobar
        </button>
      </div>
      {error && (
        <p role="alert" className="text-caption font-semibold text-destructive">
          {error}
        </p>
      )}
    </div>
  );
}
