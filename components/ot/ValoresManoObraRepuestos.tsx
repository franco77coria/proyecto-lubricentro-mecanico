"use client";

import { Wrench, Package, Save } from "lucide-react";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

import { agregarItemOT } from "@/lib/actions/ot";
import { useFormato } from "@/lib/i18n/I18nContext";
import { useIsla } from "@/components/isla/IslaContext";

/**
 * Carga rápida de los dos totales que se preguntan al cerrar la orden: cuánto
 * fue mano de obra y cuánto repuestos. Guarda cada uno como un ítem más de
 * `ot_item` (vía agregarItemOT) para que el total lo siga sumando el trigger
 * de la base, nunca un campo libre que pise total_mano_obra/total_repuestos.
 */
export function ValoresManoObraRepuestos({ otId }: { otId: string }) {
  const router = useRouter();
  const { notificar } = useIsla();
  const { money } = useFormato();
  const [manoObra, setManoObra] = useState("");
  const [repuestos, setRepuestos] = useState("");
  const [isPending, startTransition] = useTransition();
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleGuardar = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    const valorManoObra = Number(manoObra);
    const valorRepuestos = Number(repuestos);
    const cargaManoObra = manoObra.trim() !== "" && valorManoObra > 0;
    const cargaRepuestos = repuestos.trim() !== "" && valorRepuestos > 0;

    if (!cargaManoObra && !cargaRepuestos) {
      setErrorMsg("Ingresá al menos un valor mayor a 0.");
      return;
    }

    startTransition(async () => {
      const tareas: Promise<{ ok?: boolean; error?: string }>[] = [];
      if (cargaManoObra) {
        tareas.push(
          agregarItemOT(otId, {
            tipo: "mano_obra",
            descripcion: "Mano de obra",
            cantidad: 1,
            precioUnitario: valorManoObra,
          }),
        );
      }
      if (cargaRepuestos) {
        tareas.push(
          agregarItemOT(otId, {
            tipo: "repuesto",
            descripcion: "Repuestos",
            cantidad: 1,
            precioUnitario: valorRepuestos,
          }),
        );
      }

      const resultados = await Promise.all(tareas);
      const conError = resultados.find((r) => r.error);

      if (conError) {
        setErrorMsg(conError.error ?? "No se pudo guardar.");
        notificar({ tipo: "error", mensaje: conError.error ?? "No se pudo guardar." });
      } else {
        setManoObra("");
        setRepuestos("");
        notificar({ tipo: "exito", mensaje: "Valores cargados a la orden." });
        router.refresh();
      }
    });
  };

  return (
    <form
      onSubmit={handleGuardar}
      className="rounded-3xl border border-border/80 bg-card p-4 sm:p-5 shadow-sm space-y-3"
    >
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-black uppercase tracking-wider text-foreground">
          Valores para el cierre
        </h3>
        <span className="text-[10px] font-semibold text-muted-foreground">Se suman al total</span>
      </div>

      {errorMsg && (
        <div className="rounded-xl bg-rose-500/10 border border-rose-500/20 p-2.5 text-xs font-bold text-rose-400">
          {errorMsg}
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <label htmlFor="valor-mano-obra" className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
            <Wrench className="h-3.5 w-3.5" />
            Valor mano de obra
          </label>
          <input
            id="valor-mano-obra"
            type="number"
            inputMode="decimal"
            step="1"
            min="0"
            placeholder="0.00"
            value={manoObra}
            onChange={(e) => setManoObra(e.target.value)}
            className="min-h-12 w-full rounded-xl border border-border bg-background px-4 font-mono text-sm font-black text-foreground focus:border-accent focus:outline-none"
          />
        </div>

        <div className="space-y-1.5">
          <label htmlFor="valor-repuestos" className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
            <Package className="h-3.5 w-3.5" />
            Valor repuestos
          </label>
          <input
            id="valor-repuestos"
            type="number"
            inputMode="decimal"
            step="1"
            min="0"
            placeholder="0.00"
            value={repuestos}
            onChange={(e) => setRepuestos(e.target.value)}
            className="min-h-12 w-full rounded-xl border border-border bg-background px-4 font-mono text-sm font-black text-foreground focus:border-accent focus:outline-none"
          />
        </div>
      </div>

      <div className="flex items-center justify-between gap-3 pt-1">
        <p className="text-[11px] text-muted-foreground">
          {manoObra || repuestos
            ? `Se cargará ${[manoObra && money(Number(manoObra) || 0), repuestos && money(Number(repuestos) || 0)].filter(Boolean).join(" + ")} como ítems de la orden.`
            : "Cada valor se carga como un ítem más, junto a los del detalle."}
        </p>
        <button
          type="submit"
          disabled={isPending}
          className="flex min-h-11 shrink-0 items-center gap-2 rounded-xl bg-accent px-5 text-xs font-black text-white shadow-sm active:scale-95 disabled:opacity-50 hover:brightness-110 transition-all"
        >
          <Save className="h-4 w-4" />
          {isPending ? "Guardando..." : "Guardar"}
        </button>
      </div>
    </form>
  );
}
