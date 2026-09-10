"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Trash2, AlertTriangle, Loader2 } from "lucide-react";

import { useIsla } from "@/components/isla/IslaContext";
import { Sheet } from "@/components/sheet/Sheet";
import { archivarCliente } from "@/lib/actions/clientes";

export function DialogEliminarCliente({
  clienteId,
  clienteNombre,
}: {
  clienteId: string;
  clienteNombre: string;
}) {
  const router = useRouter();
  const { notificar } = useIsla();
  const [abierto, setAbierto] = useState(false);
  const [pendiente, iniciar] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function confirmarEliminar() {
    setError(null);
    iniciar(async () => {
      const res = await archivarCliente(clienteId);
      if (res.error) {
        setError(res.error);
        return;
      }
      notificar({ tipo: "exito", mensaje: `Cliente ${clienteNombre} eliminado.` });
      setAbierto(false);
      router.push("/clientes");
    });
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setAbierto(true)}
        className="flex min-h-10 items-center gap-1.5 rounded-xl px-3 text-xs font-bold text-muted-foreground transition-colors hover:bg-rose-500/10 hover:text-rose-500 active:scale-95"
      >
        <Trash2 className="h-4 w-4" aria-hidden />
        <span>Eliminar</span>
      </button>

      <Sheet
        abierto={abierto}
        onCerrar={() => setAbierto(false)}
        titulo="Eliminar Cliente"
      >
        <div className="space-y-4 p-5">
          <div className="flex gap-3 rounded-2xl bg-destructive/10 border border-destructive/20 p-4 text-xs text-destructive">
            <AlertTriangle className="h-5 w-5 shrink-0" aria-hidden />
            <p className="leading-relaxed">
              ¿Estás seguro de que querés eliminar a <strong>{clienteNombre}</strong>?
              El cliente dejará de aparecer en la lista general de clientes pero el historial de órdenes y vehículos previos se preservará íntegramente.
            </p>
          </div>

          {error && (
            <p role="alert" className="text-caption font-bold text-destructive">
              {error}
            </p>
          )}

          <div className="flex gap-2 pt-2">
            <button
              type="button"
              onClick={() => setAbierto(false)}
              className="min-h-12 flex-1 rounded-2xl border border-border bg-card text-sm font-semibold text-muted-foreground hover:bg-muted active:scale-[0.98] transition-all"
            >
              Cancelar
            </button>
            <button
              type="button"
              disabled={pendiente}
              onClick={confirmarEliminar}
              className="min-h-12 flex-1 rounded-2xl bg-destructive text-sm font-bold text-destructive-foreground shadow-md transition-transform active:scale-[0.98] disabled:opacity-60 flex items-center justify-center gap-2"
            >
              {pendiente ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Eliminando…</span>
                </>
              ) : (
                "Confirmar"
              )}
            </button>
          </div>
        </div>
      </Sheet>
    </>
  );
}
