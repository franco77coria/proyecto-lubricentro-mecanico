"use client";

import { ChevronLeft, ChevronRight, Loader2, Check } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition, useEffect, useRef } from "react";

import { useIsla } from "@/components/isla/IslaContext";
import { cambiarEstadoOT } from "@/lib/actions/ot";
import { COLUMNAS_KANBAN, etiquetaEstado, type EstadoDb } from "@/lib/estados-ot";
import { ESTADOS_OT, type EstadoOT } from "@/lib/schemas/ot";

/** El label que espera `cambiarEstadoOT`, a partir del valor de la base. */
function aEtiquetaAccion(estado: EstadoDb): EstadoOT | null {
  const label = etiquetaEstado(estado);
  return (ESTADOS_OT as readonly string[]).includes(label) ? (label as EstadoOT) : null;
}

/**
 * Mover una orden de columna en el Kanban con ergonomía de taller.
 *
 * Áreas táctiles de mínimo 48px para operar cómodamente con guantes o dedos con grasa.
 * Incluye avance/retroceso rápido y selector directo para saltar sin pasos intermedios.
 */
export function MoverOT({
  otId,
  estado,
  patente,
}: {
  otId: string;
  estado: EstadoDb;
  patente: string;
}) {
  const router = useRouter();
  const { notificar } = useIsla();
  const [pendiente, iniciar] = useTransition();
  const [optimista, setOptimista] = useState<{ destino: EstadoDb; base: EstadoDb } | null>(null);
  const [menuAbierto, setMenuAbierto] = useState(false);
  const contenedorRef = useRef<HTMLDivElement>(null);

  // Cerrar menú al hacer clic afuera o presionar Escape
  useEffect(() => {
    if (!menuAbierto) return;
    function handleClickOutside(e: MouseEvent) {
      if (contenedorRef.current && !contenedorRef.current.contains(e.target as Node)) {
        setMenuAbierto(false);
      }
    }
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") setMenuAbierto(false);
    }
    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [menuAbierto]);

  const actual = optimista && optimista.base === estado ? optimista.destino : estado;
  const i = COLUMNAS_KANBAN.indexOf(actual);
  const anterior = i > 0 ? COLUMNAS_KANBAN[i - 1] : null;
  const siguiente = i >= 0 && i < COLUMNAS_KANBAN.length - 1 ? COLUMNAS_KANBAN[i + 1] : null;

  function mover(destino: EstadoDb | null) {
    if (!destino || destino === actual) {
      setMenuAbierto(false);
      return;
    }
    const etiqueta = aEtiquetaAccion(destino);
    if (!etiqueta) return;

    setOptimista({ destino, base: estado });
    setMenuAbierto(false);

    iniciar(async () => {
      const res = await cambiarEstadoOT(otId, etiqueta);
      if (res.error) {
        setOptimista(null);
        notificar({ tipo: "error", mensaje: res.error });
        return;
      }
      notificar({ tipo: "exito", mensaje: `${patente} → ${etiquetaEstado(destino)}` });
      router.refresh();
    });
  }

  return (
    <div ref={contenedorRef} className="relative flex items-center gap-1.5">
      {/* Botón Retroceder (Mínimo 48px de contacto) */}
      <button
        type="button"
        onClick={() => mover(anterior)}
        disabled={!anterior || pendiente}
        aria-label={anterior ? `Volver ${patente} a ${etiquetaEstado(anterior)}` : "Sin estado anterior"}
        className="grid min-h-12 min-w-12 place-items-center rounded-xl bg-white/[0.06] text-white/70 border border-white/[0.08] transition-transform active:scale-90 disabled:opacity-25 hover:bg-white/[0.12] hover:text-white"
      >
        <ChevronLeft className="h-5 w-5" aria-hidden />
      </button>

      {/* Botón Selector Rápido 1-Tap (Salto directo sin pasos) */}
      <button
        type="button"
        onClick={() => setMenuAbierto((v) => !v)}
        disabled={pendiente}
        aria-label="Cambio rápido de estado"
        className="min-h-12 px-2.5 rounded-xl bg-white/[0.04] border border-white/[0.08] text-[11px] font-black uppercase tracking-wider text-white/80 hover:bg-white/[0.08] hover:text-white transition-colors disabled:opacity-40"
      >
        {etiquetaEstado(actual).slice(0, 8)}
      </button>

      {/* Botón Avanzar (Mínimo 48px de contacto) */}
      <button
        type="button"
        onClick={() => mover(siguiente)}
        disabled={!siguiente || pendiente}
        aria-label={siguiente ? `Pasar ${patente} a ${etiquetaEstado(siguiente)}` : "Última columna"}
        className="grid min-h-12 min-w-12 place-items-center rounded-xl bg-accent text-white shadow-md shadow-orange-500/20 transition-transform active:scale-90 disabled:opacity-25 hover:brightness-110"
      >
        {pendiente ? (
          <Loader2 className="h-5 w-5 animate-spin" aria-hidden />
        ) : (
          <ChevronRight className="h-5 w-5 stroke-[2.5]" aria-hidden />
        )}
      </button>

      {/* Menú de Salto Directo para Operario */}
      {menuAbierto && (
        <div className="absolute right-0 bottom-full mb-2 z-50 w-56 rounded-2xl bg-[#141417] border border-white/10 shadow-[0_15px_40px_rgba(0,0,0,0.8)] p-1.5 backdrop-blur-xl animate-in fade-in zoom-in-95 duration-150">
          <div className="px-3 py-1.5 text-[10px] font-mono font-bold uppercase tracking-wider text-white/40 border-b border-white/[0.06] mb-1">
            Saltar directo a:
          </div>
          {COLUMNAS_KANBAN.map((col) => {
            const isSelected = col === actual;
            return (
              <button
                key={col}
                type="button"
                onClick={() => mover(col)}
                className={`w-full min-h-11 px-3 rounded-xl flex items-center justify-between text-xs font-bold transition-colors ${
                  isSelected
                    ? "bg-accent/20 text-accent font-black"
                    : "text-white/80 hover:bg-white/[0.06] hover:text-white"
                }`}
              >
                <span>{etiquetaEstado(col)}</span>
                {isSelected && <Check className="h-4 w-4 text-accent" />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
