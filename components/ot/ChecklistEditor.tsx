"use client";

import { AlertOctagon, AlertTriangle, Check, Minus } from "lucide-react";
import { useState, useTransition } from "react";

import { actualizarItemChecklist } from "@/lib/actions/ot";

interface ItemChecklist {
  id: string;
  etiqueta_snapshot: string;
  estado: "ok" | "observado" | "critico" | "no_aplica" | null;
  nota?: string | null;
}

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
          className="flex flex-col gap-2 rounded-xl border border-border bg-card p-3.5 shadow-sm transition-all"
        >
          <div className="flex items-center justify-between gap-2">
            <span className="text-sm font-semibold text-foreground leading-tight">{item.etiqueta_snapshot}</span>
            <div className="flex items-center gap-1.5 shrink-0">
              <button
                type="button"
                onClick={() => handleEstado(item.id, "ok")}
                title="OK"
                className={`flex h-11 w-11 items-center justify-center rounded-xl border text-xs font-bold transition-transform active:scale-90 ${
                  item.estado === "ok"
                    ? "border-emerald-600 bg-emerald-600 text-white"
                    : "border-border bg-muted text-muted-foreground hover:bg-emerald-50 hover:text-emerald-600"
                }`}
              >
                <Check className="h-5 w-5" />
              </button>

              <button
                type="button"
                onClick={() => handleEstado(item.id, "observado")}
                title="Observado"
                className={`flex h-11 w-11 items-center justify-center rounded-xl border text-xs font-bold transition-transform active:scale-90 ${
                  item.estado === "observado"
                    ? "border-amber-600 bg-amber-600 text-white"
                    : "border-border bg-muted text-muted-foreground hover:bg-amber-50 hover:text-amber-600"
                }`}
              >
                <AlertTriangle className="h-5 w-5" />
              </button>

              <button
                type="button"
                onClick={() => handleEstado(item.id, "critico")}
                title="Crítico"
                className={`flex h-11 w-11 items-center justify-center rounded-xl border text-xs font-bold transition-transform active:scale-90 ${
                  item.estado === "critico"
                    ? "border-red-600 bg-red-600 text-white"
                    : "border-border bg-muted text-muted-foreground hover:bg-red-50 hover:text-red-600"
                }`}
              >
                <AlertOctagon className="h-5 w-5" />
              </button>

              <button
                type="button"
                onClick={() => handleEstado(item.id, "no_aplica")}
                title="No aplica"
                className={`flex h-11 w-11 items-center justify-center rounded-xl border text-xs font-bold transition-transform active:scale-90 ${
                  item.estado === "no_aplica"
                    ? "border-slate-500 bg-slate-600 text-white"
                    : "border-border bg-muted text-muted-foreground hover:bg-slate-100 hover:text-slate-600"
                }`}
              >
                <Minus className="h-5 w-5" />
              </button>
            </div>
          </div>

          {(item.estado === "observado" || item.estado === "critico" || item.nota) && (
            <input
              type="text"
              placeholder="Detalle o recomendación para el cliente..."
              value={item.nota || ""}
              onChange={(e) => handleNotaChange(item.id, e.target.value)}
              onBlur={() => handleNotaBlur(item.id)}
              className="min-h-10 w-full rounded-xl border border-border bg-muted/50 px-3 text-xs text-foreground placeholder:text-muted-foreground focus:border-accent focus:outline-none"
            />
          )}
        </div>
      ))}
    </div>
  );
}
