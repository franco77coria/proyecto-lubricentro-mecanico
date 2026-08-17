"use client";

import { AlertOctagon, AlertTriangle, Check, Minus } from "lucide-react";
import { useState, useTransition } from "react";

import { actualizarItemChecklist } from "@/lib/actions/ot";
import { BotonDictadoVoz } from "@/components/ui/BotonDictadoVoz";

interface ItemChecklist {
  id: string;
  etiqueta_snapshot: string;
  estado: "ok" | "observado" | "critico" | "no_aplica" | null;
  nota?: string | null;
}

const CHIPS_DIAGNOSTICO = [
  "Pastillas al 10%",
  "Fuelle roto",
  "Pérdida de aceite",
  "Juego en buje",
  "Líquido degradado",
  "Lámpara quemada",
] as const;

export function ChecklistEditor({ items: initialItems }: { items: ItemChecklist[] }) {
  const [items, setItems] = useState(initialItems);
  const [, startTransition] = useTransition();

  const handleEstado = (id: string, nuevoEstado: "ok" | "observado" | "critico" | "no_aplica") => {
    setItems((prev) =>
      prev.map((it) => (it.id === id ? { ...it, estado: it.estado === nuevoEstado ? null : nuevoEstado } : it)),
    );

    const actual = items.find((it) => it.id === id);
    const estadoFinal = actual?.estado === nuevoEstado ? null : nuevoEstado;

    startTransition(async () => {
      await actualizarItemChecklist(id, estadoFinal, actual?.nota);
    });
  };

  const handleToggleChip = (id: string, chip: string) => {
    const item = items.find((it) => it.id === id);
    if (!item) return;

    let nuevaNota = item.nota || "";
    const partes = nuevaNota
      .split(",")
      .map((p) => p.trim())
      .filter(Boolean);

    if (partes.includes(chip)) {
      nuevaNota = partes.filter((p) => p !== chip).join(", ");
    } else {
      nuevaNota = partes.length > 0 ? `${nuevaNota.trim()}, ${chip}` : chip;
    }

    setItems((prev) => prev.map((it) => (it.id === id ? { ...it, nota: nuevaNota } : it)));

    startTransition(async () => {
      await actualizarItemChecklist(id, item.estado, nuevaNota);
    });
  };

  const handleNotaChange = (id: string, nota: string) => {
    setItems((prev) => prev.map((it) => (it.id === id ? { ...it, nota } : it)));
  };

  const handleNotaBlur = (id: string) => {
    const item = items.find((it) => it.id === id);
    if (!item) return;
    startTransition(async () => {
      await actualizarItemChecklist(id, item.estado, item.nota);
    });
  };

  return (
    <div className="space-y-3">
      {items.map((item) => (
        <div
          key={item.id}
          className="flex flex-col gap-3 rounded-2xl border border-border bg-card p-3.5 shadow-sm transition-all"
        >
          <div className="flex flex-wrap items-center justify-between gap-3">
            <span className="text-sm font-semibold text-foreground leading-tight">{item.etiqueta_snapshot}</span>
            <div className="flex items-center gap-2.5 shrink-0">
              <button
                type="button"
                onClick={() => handleEstado(item.id, "ok")}
                title="OK"
                aria-label="Marcar OK"
                className={`flex h-12 w-12 items-center justify-center rounded-xl border text-xs font-bold transition-transform active:scale-90 touch-manipulation ${
                  item.estado === "ok"
                    ? "border-emerald-600 bg-emerald-600 text-white shadow-sm"
                    : "border-border bg-muted text-muted-foreground hover:bg-emerald-50 hover:text-emerald-600 dark:hover:bg-emerald-950/30"
                }`}
              >
                <Check className="h-5 w-5" />
              </button>

              <button
                type="button"
                onClick={() => handleEstado(item.id, "observado")}
                title="Observado"
                aria-label="Marcar Observado"
                className={`flex h-12 w-12 items-center justify-center rounded-xl border text-xs font-bold transition-transform active:scale-90 touch-manipulation ${
                  item.estado === "observado"
                    ? "border-amber-600 bg-amber-600 text-white shadow-sm"
                    : "border-border bg-muted text-muted-foreground hover:bg-amber-50 hover:text-amber-600 dark:hover:bg-amber-950/30"
                }`}
              >
                <AlertTriangle className="h-5 w-5" />
              </button>

              <button
                type="button"
                onClick={() => handleEstado(item.id, "critico")}
                title="Crítico"
                aria-label="Marcar Crítico"
                className={`flex h-12 w-12 items-center justify-center rounded-xl border text-xs font-bold transition-transform active:scale-90 touch-manipulation ${
                  item.estado === "critico"
                    ? "border-red-600 bg-red-600 text-white shadow-sm"
                    : "border-border bg-muted text-muted-foreground hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950/30"
                }`}
              >
                <AlertOctagon className="h-5 w-5" />
              </button>

              <button
                type="button"
                onClick={() => handleEstado(item.id, "no_aplica")}
                title="No aplica"
                aria-label="Marcar No aplica"
                className={`flex h-12 w-12 items-center justify-center rounded-xl border text-xs font-bold transition-transform active:scale-90 touch-manipulation ${
                  item.estado === "no_aplica"
                    ? "border-slate-500 bg-slate-600 text-white shadow-sm"
                    : "border-border bg-muted text-muted-foreground hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800"
                }`}
              >
                <Minus className="h-5 w-5" />
              </button>
            </div>
          </div>

          {(item.estado === "observado" || item.estado === "critico" || item.nota) && (
            <div className="space-y-2.5 pt-1 border-t border-border/60">
              {(item.estado === "observado" || item.estado === "critico") && (
                <div className="space-y-1.5">
                  <span className="text-[11px] font-semibold text-muted-foreground flex items-center gap-1">
                    Diagnóstico rápido (toque sin escribir):
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {CHIPS_DIAGNOSTICO.map((chip) => {
                      const seleccionado = item.nota ? item.nota.includes(chip) : false;
                      return (
                        <button
                          key={chip}
                          type="button"
                          onClick={() => handleToggleChip(item.id, chip)}
                          className={`min-h-9 rounded-lg border px-3 py-1.5 text-xs font-medium transition-all active:scale-95 touch-manipulation ${
                            seleccionado
                              ? item.estado === "critico"
                                ? "border-red-600 bg-red-600 text-white shadow-xs font-semibold"
                                : "border-amber-600 bg-amber-600 text-white shadow-xs font-semibold"
                              : "border-border bg-muted/70 text-foreground hover:bg-muted active:bg-muted/90"
                          }`}
                        >
                          {chip}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              <div className="flex items-center gap-2">
                <input
                  type="text"
                  placeholder="Detalle o recomendación para el cliente..."
                  value={item.nota || ""}
                  onChange={(e) => handleNotaChange(item.id, e.target.value)}
                  onBlur={() => handleNotaBlur(item.id)}
                  className="min-h-11 flex-1 rounded-xl border border-border bg-muted/50 px-3.5 text-xs text-foreground placeholder:text-muted-foreground focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
                />
                <BotonDictadoVoz
                  tamano="sm"
                  onTextoTranscrito={(texto) => {
                    const actual = item.nota ? `${item.nota} ${texto}` : texto;
                    handleNotaChange(item.id, actual);
                    startTransition(async () => {
                      await actualizarItemChecklist(item.id, item.estado, actual);
                    });
                  }}
                />
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

