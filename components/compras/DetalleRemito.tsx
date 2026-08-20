"use client";

import { ChevronDown, Loader2, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { useIsla } from "@/components/isla/IslaContext";
import { GaleriaComprobantesCompra } from "@/components/compras/GaleriaComprobantesCompra";
import {
  borrarLineaRemito,
  obtenerDetalleCompra,
  type LineaRemito,
} from "@/lib/actions/compras";
import { useFormato } from "@/lib/i18n/I18nContext";

/* El formato de plata sale del taller (idioma + moneda), no de
   "es-AR"/"ARS" escritos a mano. */

/**
 * Abrir un remito para revisarlo línea por línea.
 *
 * El detalle se pide recién al abrirlo y no junto con la lista: en una pantalla
 * con sesenta remitos, traer todos los renglones de todos para mostrar uno es
 * pagar sesenta consultas de costos por una que se mira.
 *
 * Corregir es borrar el renglón y volver a cargarlo, no editarlo. El costo de
 * una compra registrada no se reescribe (lo bloquea un trigger, a propósito):
 * un costo editable después deja de ser evidencia de lo que se pagó.
 */
export function DetalleRemito({
  compraId,
  comprobante,
  puedeCorregir,
  tallerId,
}: {
  compraId: string;
  comprobante: string | null;
  puedeCorregir: boolean;
  tallerId?: string;
}) {
  const { money } = useFormato();
  const router = useRouter();
  const { notificar } = useIsla();
  const [abierto, setAbierto] = useState(false);
  const [lineas, setLineas] = useState<LineaRemito[] | null>(null);
  const [pendiente, iniciar] = useTransition();

  const etiqueta = comprobante ? `remito ${comprobante}` : "el remito";

  function alternar() {
    if (abierto) {
      setAbierto(false);
      return;
    }
    setAbierto(true);
    // Se pide una sola vez; reabrir usa lo que ya está en memoria.
    if (lineas) return;

    iniciar(async () => {
      const res = await obtenerDetalleCompra(compraId);
      if (res.error) {
        notificar({ tipo: "error", mensaje: res.error });
        setAbierto(false);
        return;
      }
      setLineas(res.lineas ?? []);
    });
  }

  function borrar(linea: LineaRemito) {
    setLineas((prev) => prev?.filter((l) => l.itemId !== linea.itemId) ?? null);
    iniciar(async () => {
      const res = await borrarLineaRemito(compraId, linea.itemId);
      if (res.error) {
        notificar({ tipo: "error", mensaje: res.error });
        // Se recarga para volver al estado real en vez de mentir con el
        // optimismo que acaba de fallar.
        router.refresh();
        return;
      }
      notificar({
        tipo: "exito",
        mensaje: `${linea.producto} salió del remito — el stock volvió atrás`,
      });
      router.refresh();
    });
  }

  return (
    <div className="mt-2 border-t border-border pt-2">
      <button
        type="button"
        onClick={alternar}
        aria-expanded={abierto}
        className="flex min-h-9 w-full items-center justify-center gap-1.5 rounded-[var(--radius-sm)] text-caption font-semibold text-accent hover:bg-accent/5"
      >
        {pendiente && !lineas ? (
          <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden />
        ) : (
          <ChevronDown
            className={`h-3.5 w-3.5 transition-transform ${abierto ? "rotate-180" : ""}`}
            aria-hidden
          />
        )}
        {abierto ? "Ocultar detalle" : `Ver ${etiqueta}`}
      </button>

      {abierto && lineas && (
        <div className="mt-3 space-y-3">
          {lineas.length === 0 ? (
            <p className="text-caption text-muted-foreground">
              Este remito quedó sin renglones. Cargalo de nuevo o borralo.
            </p>
          ) : (
            <ul className="divide-y divide-border">
              {lineas.map((l) => (
                <li key={l.itemId} className="flex items-center gap-2 py-1.5">
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-caption font-medium text-foreground">
                      {l.producto}
                    </span>
                    <span className="block text-caption text-muted-foreground">
                      {l.cantidad} {l.unidad} × {money(l.costoUnitario)}
                    </span>
                  </span>
                  <span className="tabular shrink-0 text-caption font-semibold text-foreground">
                    {money(l.subtotal)}
                  </span>
                  {puedeCorregir && (
                    <button
                      type="button"
                      onClick={() => borrar(l)}
                      disabled={pendiente}
                      aria-label={`Quitar ${l.producto} del remito`}
                      className="grid h-9 w-9 shrink-0 place-items-center rounded-[var(--radius-sm)] text-muted-foreground hover:bg-destructive/10 hover:text-destructive disabled:opacity-40"
                    >
                      <Trash2 className="h-3.5 w-3.5" aria-hidden />
                    </button>
                  )}
                </li>
              ))}
            </ul>
          )}

          {/* Galería y comprobantes físicos asociados a esta compra */}
          <div className="border-t border-border/70 pt-2.5">
            <GaleriaComprobantesCompra
              compraId={compraId}
              tallerId={tallerId}
              puedeEditar={puedeCorregir}
              compacto
            />
          </div>

          {puedeCorregir && lineas.length > 0 && (
            <p className="text-[11px] text-muted-foreground/80">
              Un costo mal cargado se corrige borrando el renglón y volviéndolo a
              cargar: el costo registrado no se reescribe.
            </p>
          )}
        </div>
      )}
    </div>
  );
}
