"use client";

import { Lock } from "lucide-react";
import { useTransition } from "react";

import { useIsla } from "@/components/isla/IslaContext";
import { realizarCierreCaja } from "@/lib/actions/caja";

export function BotonCierreCaja() {
  const [isPending, startTransition] = useTransition();
  const { notificar } = useIsla();

  const handleCierre = () => {
    if (!confirm("¿Deseás realizar el cierre de caja de la jornada actual?")) return;

    startTransition(async () => {
      const res = await realizarCierreCaja();
      if (res.error) {
        notificar({ tipo: "error", mensaje: res.error });
      } else {
        notificar({ tipo: "exito", mensaje: "Cierre de caja registrado exitosamente" });
      }
    });
  };

  return (
    <button
      type="button"
      onClick={handleCierre}
      disabled={isPending}
      className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-border/80 bg-card px-4 text-xs font-semibold text-foreground shadow-sm transition-all hover:border-accent hover:text-accent active:scale-95 disabled:opacity-50"
    >
      <Lock className="h-4 w-4 text-accent" />
      <span>{isPending ? "Cerrando..." : "Cerrar Caja"}</span>
    </button>
  );
}
