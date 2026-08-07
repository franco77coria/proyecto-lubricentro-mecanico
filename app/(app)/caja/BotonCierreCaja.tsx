"use client";

import { Lock } from "lucide-react";
import { useState, useTransition } from "react";

import { realizarCierreCaja } from "@/lib/actions/caja";

export function BotonCierreCaja() {
  const [isPending, startTransition] = useTransition();
  const [mensaje, setMensaje] = useState<string | null>(null);

  const handleCierre = () => {
    if (!confirm("¿Deseás realizar el cierre de caja de la jornada actual?")) return;

    startTransition(async () => {
      const res = await realizarCierreCaja();
      if (res.error) {
        setMensaje(res.error);
      } else {
        setMensaje("Cierre de caja registrado exitosamente.");
      }
    });
  };

  return (
    <div className="flex flex-col items-end gap-1">
      <button
        type="button"
        onClick={handleCierre}
        disabled={isPending}
        className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-slate-900 px-4 text-xs font-bold text-white shadow-md transition-transform active:scale-95 disabled:opacity-50"
      >
        <Lock className="h-4 w-4 text-accent" />
        <span>{isPending ? "Cerrando..." : "Cerrar Caja"}</span>
      </button>
      {mensaje && <span className="text-[10px] font-semibold text-accent">{mensaje}</span>}
    </div>
  );
}
