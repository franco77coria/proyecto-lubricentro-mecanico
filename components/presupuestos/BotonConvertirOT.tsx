"use client";

import { useTransition } from "react";
import { ArrowRight, CheckCircle2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { convertirPresupuestoAOT } from "@/lib/actions/presupuestos";
import { useIsla } from "@/components/isla/IslaContext";

export function BotonConvertirOT({ presupuestoId }: { presupuestoId: string }) {
  const [isPending, startTransition] = useTransition();
  const { notificar } = useIsla();
  const router = useRouter();

  const handleConvertir = () => {
    startTransition(async () => {
      const res = await convertirPresupuestoAOT(presupuestoId);
      if (res.error) {
        notificar({ tipo: "error", mensaje: res.error });
      } else {
        notificar({ tipo: "exito", mensaje: "¡Presupuesto aprobado y convertido a Orden de Trabajo!" });
        router.push(`/ot/${presupuestoId}`);
      }
    });
  };

  return (
    <button
      type="button"
      disabled={isPending}
      onClick={handleConvertir}
      className="flex min-h-12 w-full items-center justify-center gap-2 rounded-2xl bg-emerald-600 px-6 font-bold text-white shadow-lg hover:bg-emerald-500 active:scale-[0.98] transition-all disabled:opacity-50"
    >
      <CheckCircle2 className="h-5 w-5" />
      <span>{isPending ? "Aprobando..." : "Aprobar y Convertir a Orden de Trabajo"}</span>
      <ArrowRight className="h-4 w-4 ml-auto" />
    </button>
  );
}
