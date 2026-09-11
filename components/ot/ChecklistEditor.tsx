"use client";

import {
  AlertTriangle,
  Check,
  Plus,
  RefreshCw,
  Trash2,
} from "lucide-react";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

import {
  actualizarItemChecklist,
  asegurarChecklistOT,
  agregarItemChecklistOT,
  eliminarItemChecklistOT,
} from "@/lib/actions/ot";
import { BotonDictadoVoz } from "@/components/ui/BotonDictadoVoz";
import { useIsla } from "@/components/isla/IslaContext";

export interface ItemChecklist {
  id: string;
  etiqueta_snapshot: string;
  estado: "ok" | "observado" | "critico" | "no_aplica" | null;
  nota?: string | null;
}

function sugerenciasParaItem(etiqueta: string): string[] {
  const norm = etiqueta.toLowerCase();
  if (
    norm.includes("refrigerante") ||
    norm.includes("frío") ||
    norm.includes("frio") ||
    norm.includes("grados")
  ) {
    return ["-25°C OK", "-30°C", "-15°C (bajo)", "Punto congelación OK", "Renovar líquido"];
  }
  if (
    norm.includes("freno") ||
    norm.includes("hidráulico") ||
    norm.includes("hidraulico")
  ) {
    return ["Humedad < 1% OK", "Humedad > 3% Crítico", "DOT 4 OK", "Pastillas al 15%", "Pérdida en circuito"];
  }
  if (norm.includes("aceite") || norm.includes("lubricación") || norm.includes("lubricacion")) {
    return ["Nivel Máximo OK", "Bajo nivel", "Degradado", "Pérdida por retén"];
  }
  if (norm.includes("filtro")) {
    return ["Reemplazado", "Saturado / Sucio", "Buen estado", "Sopeteado"];
  }
  if (norm.includes("neumático") || norm.includes("neumatico") || norm.includes("presión") || norm.includes("presion")) {
    return ["32 PSI parejo", "35 PSI", "Desgaste parejo", "Deformado / Cuarteado"];
  }
  if (norm.includes("tren") || norm.includes("suspensión") || norm.includes("suspension")) {
    return ["Juego en buje", "Extremo con juego", "Fuelle roto", "Amortiguador con fuga"];
  }
  if (norm.includes("luces") || norm.includes("batería") || norm.includes("bateria")) {
    return ["12.6V OK", "Carga alternador 14.2V", "Lámpara quemada", "Bornes limpios"];
  }
  return ["Todo en orden", "Requiere atención", "Buen estado general", "Observado"];
}

function placeholderParaItem(etiqueta: string): string {
  const norm = etiqueta.toLowerCase();
  if (
    norm.includes("refrigerante") ||
    norm.includes("frío") ||
    norm.includes("frio") ||
    norm.includes("grados")
  ) {
    return "Grados de protección / congelación (ej. -25°C, nivel correcto)...";
  }
  if (
    norm.includes("freno") ||
    norm.includes("hidráulico") ||
    norm.includes("hidraulico")
  ) {
    return "Estado del fluido hidráulico (ej. DOT 4 OK, humedad < 1%)...";
  }
  if (norm.includes("aceite") || norm.includes("lubricación")) {
    return "Nivel y color de aceite (ej. nivel máximo, limpio)...";
  }
  if (norm.includes("filtro")) {
    return "Estado del filtro (ej. reemplazado, buen estado)...";
  }
  if (norm.includes("neumático") || norm.includes("presión")) {
    return "Presión en libras y estado (ej. 32 PSI parejo)...";
  }
  if (norm.includes("otros")) {
    return "Descargo, medición o detalle adicional del vehículo...";
  }
  return "Descargo, medición o nota técnica...";
}

export function ChecklistEditor({
  items: initialItems,
  otId,
}: {
  items: ItemChecklist[];
  otId: string;
}) {
  const router = useRouter();
  const { notificar } = useIsla();
  const [items, setItems] = useState<ItemChecklist[]>(initialItems);
  const [, startTransition] = useTransition();
  const [sembrando, setSembrando] = useState(false);
  const [nuevoItemTexto, setNuevoItemTexto] = useState("");
  const [agregando, setAgregando] = useState(false);

  // Auto-seed: si no hay ítems, inicializar el checklist estándar
  const sembrarChecklist = () => {
    if (sembrando) return;
    setSembrando(true);
    startTransition(async () => {
      const res = await asegurarChecklistOT(otId);
      setSembrando(false);
      if (res.error) {
        notificar({ tipo: "error", mensaje: res.error });
      } else {
        router.refresh();
      }
    });
  };

  // 1 solo toque tipo check
  const handleToggleCheck = (id: string) => {
    const anterior = items.find((it) => it.id === id);
    if (!anterior) return;
    // Si estaba desmarcado -> se marca OK. Si ya estaba marcado -> se desmarca
    const nuevoEstado = anterior.estado ? null : "ok";

    setItems((prev) =>
      prev.map((it) => (it.id === id ? { ...it, estado: nuevoEstado } : it)),
    );

    startTransition(async () => {
      const res = await actualizarItemChecklist(id, nuevoEstado, anterior.nota);
      if (res.error) {
        setItems((prev) => prev.map((it) => (it.id === id ? anterior : it)));
        notificar({ tipo: "error", mensaje: res.error });
      }
    });
  };

  // Toggle de observación / alerta
  const handleToggleAlerta = (id: string) => {
    const anterior = items.find((it) => it.id === id);
    if (!anterior) return;
    const nuevoEstado = anterior.estado === "observado" ? "ok" : "observado";

    setItems((prev) =>
      prev.map((it) => (it.id === id ? { ...it, estado: nuevoEstado } : it)),
    );

    startTransition(async () => {
      const res = await actualizarItemChecklist(id, nuevoEstado, anterior.nota);
      if (res.error) {
        setItems((prev) => prev.map((it) => (it.id === id ? anterior : it)));
        notificar({ tipo: "error", mensaje: res.error });
      }
    });
  };

  // Toggle chips de diagnóstico
  const handleToggleChip = (id: string, chip: string) => {
    const anterior = items.find((it) => it.id === id);
    if (!anterior) return;

    let nuevaNota = anterior.nota || "";
    const partes = nuevaNota
      .split(",")
      .map((p) => p.trim())
      .filter(Boolean);

    if (partes.includes(chip)) {
      nuevaNota = partes.filter((p) => p !== chip).join(", ");
    } else {
      nuevaNota = partes.length > 0 ? `${nuevaNota.trim()}, ${chip}` : chip;
    }

    const nuevoEstado = anterior.estado || "ok";

    setItems((prev) =>
      prev.map((it) =>
        it.id === id ? { ...it, nota: nuevaNota, estado: nuevoEstado } : it,
      ),
    );

    startTransition(async () => {
      const res = await actualizarItemChecklist(id, nuevoEstado, nuevaNota);
      if (res.error) {
        setItems((prev) => prev.map((it) => (it.id === id ? anterior : it)));
        notificar({ tipo: "error", mensaje: res.error });
      }
    });
  };

  const handleNotaChange = (id: string, nota: string) => {
    setItems((prev) =>
      prev.map((it) => {
        if (it.id !== id) return it;
        // Si escribe algo y estaba desmarcado, autotildar como OK
        const estado = it.estado === null && nota.trim().length > 0 ? "ok" : it.estado;
        return { ...it, nota, estado };
      }),
    );
  };

  const handleNotaBlur = (id: string) => {
    const item = items.find((it) => it.id === id);
    if (!item) return;
    startTransition(async () => {
      const res = await actualizarItemChecklist(id, item.estado, item.nota);
      if (res.error) notificar({ tipo: "error", mensaje: res.error });
    });
  };

  const handleEliminarItem = (id: string) => {
    setItems((prev) => prev.filter((it) => it.id !== id));
    startTransition(async () => {
      const res = await eliminarItemChecklistOT(id, otId);
      if (res.error) {
        notificar({ tipo: "error", mensaje: res.error });
        router.refresh();
      }
    });
  };

  const handleAgregarNuevo = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nuevoItemTexto.trim() || agregando) return;
    setAgregando(true);
    const texto = nuevoItemTexto.trim();
    setNuevoItemTexto("");

    startTransition(async () => {
      const res = await agregarItemChecklistOT(otId, texto);
      setAgregando(false);
      if (res.error) {
        notificar({ tipo: "error", mensaje: res.error });
      } else if (res.item) {
        setItems((prev) => [...prev, res.item!]);
      }
    });
  };

  return (
    <div className="space-y-3">
      {items.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border bg-card p-8 text-center space-y-3">
          <RefreshCw className="mx-auto h-8 w-8 text-muted-foreground/50" />
          <div>
            <p className="text-sm font-semibold text-foreground">
              Checklist no inicializado
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Iniciá el checklist estándar con los puntos de revisión técnica, fluidos y grados de protección.
            </p>
          </div>
          <button
            type="button"
            onClick={sembrarChecklist}
            disabled={sembrando}
            className="inline-flex min-h-10 items-center gap-2 rounded-xl bg-accent px-5 text-xs font-bold text-white shadow-sm hover:brightness-110 active:scale-95 disabled:opacity-60 transition-all"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${sembrando ? "animate-spin" : ""}`} />
            {sembrando ? "Inicializando..." : "Cargar checklist estándar"}
          </button>
        </div>
      ) : (
        <>
          <div className="space-y-3">
            {items.map((item) => (
              <div
                key={item.id}
                className={`flex flex-col gap-2.5 rounded-2xl border p-3.5 shadow-sm transition-all ${
                  item.estado === "observado" || item.estado === "critico"
                    ? "border-amber-500/40 bg-amber-500/5 shadow-amber-500/5"
                    : item.estado === "ok"
                    ? "border-emerald-500/30 bg-card hover:border-emerald-500/50"
                    : "border-border/80 bg-card/70 opacity-95 hover:opacity-100"
                }`}
              >
                {/* Cabecera: Selector Tipo Check y Nombre del Ítem */}
                <div className="flex items-center justify-between gap-3">
                  <button
                    type="button"
                    onClick={() => handleToggleCheck(item.id)}
                    className="flex items-center gap-3 text-left group min-w-0 flex-1 touch-manipulation cursor-pointer"
                  >
                    {/* Botón Tipo Check */}
                    <span
                      className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-xl border transition-all ${
                        item.estado === "ok"
                          ? "border-emerald-600 bg-emerald-600 text-white shadow-sm"
                          : item.estado === "observado" || item.estado === "critico"
                          ? "border-amber-600 bg-amber-600 text-white shadow-sm"
                          : "border-border/90 bg-muted/60 text-transparent group-hover:border-accent"
                      }`}
                    >
                      <Check
                        className={`h-4 w-4 stroke-[3] transition-transform ${
                          item.estado ? "scale-100" : "scale-75 opacity-0"
                        }`}
                      />
                    </span>

                    <span className="min-w-0 flex-1">
                      <span
                        className={`block text-sm font-bold tracking-tight transition-colors ${
                          item.estado === "ok"
                            ? "text-foreground"
                            : item.estado === "observado" || item.estado === "critico"
                            ? "text-amber-500"
                            : "text-foreground/90"
                        }`}
                      >
                        {item.etiqueta_snapshot}
                      </span>
                    </span>
                  </button>

                  <div className="flex items-center gap-1.5 shrink-0">
                    {/* Toggle de Alerta / Observado */}
                    <button
                      type="button"
                      onClick={() => handleToggleAlerta(item.id)}
                      title={
                        item.estado === "observado"
                          ? "Quitar observación"
                          : "Marcar ítem observado"
                      }
                      className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg border text-xs font-semibold transition-all touch-manipulation ${
                        item.estado === "observado" || item.estado === "critico"
                          ? "border-amber-500 bg-amber-500/20 text-amber-400 font-bold"
                          : "border-transparent text-muted-foreground hover:bg-muted hover:text-foreground"
                      }`}
                    >
                      <AlertTriangle className="h-3.5 w-3.5" />
                      <span className="hidden sm:inline">
                        {item.estado === "observado" || item.estado === "critico"
                          ? "Observado"
                          : "Atención"}
                      </span>
                    </button>

                    {/* Eliminar ítem individual si no aplica */}
                    <button
                      type="button"
                      onClick={() => handleEliminarItem(item.id)}
                      title="Quitar punto del checklist"
                      className="grid h-8 w-8 place-items-center rounded-lg text-muted-foreground/40 hover:text-destructive hover:bg-destructive/10 transition-colors"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>

                {/* Campo para escribir el descargo / medición — SIEMPRE VISIBLE */}
                <div className="space-y-1.5 pt-1 border-t border-border/40">
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      placeholder={placeholderParaItem(item.etiqueta_snapshot)}
                      value={item.nota || ""}
                      onChange={(e) => handleNotaChange(item.id, e.target.value)}
                      onBlur={() => handleNotaBlur(item.id)}
                      className="min-h-10 flex-1 rounded-xl border border-border/80 bg-muted/40 px-3.5 text-xs text-foreground placeholder:text-muted-foreground/60 focus:border-accent focus:bg-background focus:outline-none focus:ring-1 focus:ring-accent transition-all"
                    />
                    <BotonDictadoVoz
                      tamano="sm"
                      onTextoTranscrito={(texto) => {
                        const actual = item.nota ? `${item.nota} ${texto}` : texto;
                        handleNotaChange(item.id, actual);
                        startTransition(async () => {
                          const estadoActual = item.estado || "ok";
                          const res = await actualizarItemChecklist(
                            item.id,
                            estadoActual,
                            actual,
                          );
                          if (res.error) notificar({ tipo: "error", mensaje: res.error });
                        });
                      }}
                    />
                  </div>

                  {/* Chips contextuales de 1 toque */}
                  <div className="flex flex-wrap gap-1.5 pt-0.5">
                    {sugerenciasParaItem(item.etiqueta_snapshot).map((chip) => {
                      const seleccionado = item.nota
                        ? item.nota.includes(chip)
                        : false;
                      return (
                        <button
                          key={chip}
                          type="button"
                          onClick={() => handleToggleChip(item.id, chip)}
                          className={`min-h-7 rounded-lg border px-2.5 py-0.5 text-[11px] font-medium transition-all active:scale-95 touch-manipulation ${
                            seleccionado
                              ? "border-accent bg-accent/15 text-accent font-bold shadow-xs"
                              : "border-border/60 bg-muted/40 text-muted-foreground hover:bg-muted hover:text-foreground"
                          }`}
                        >
                          {chip}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Formulario rápido para agregar nuevo ítem a la orden */}
          <form
            onSubmit={handleAgregarNuevo}
            className="flex items-center gap-2 pt-2"
          >
            <input
              type="text"
              placeholder="+ Agregar otro punto de control (ej. Batería, Correa, Fuga...)"
              value={nuevoItemTexto}
              onChange={(e) => setNuevoItemTexto(e.target.value)}
              className="min-h-11 flex-1 rounded-xl border border-border bg-card px-3.5 text-xs text-foreground placeholder:text-muted-foreground focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
            />
            <button
              type="submit"
              disabled={agregando || !nuevoItemTexto.trim()}
              className="flex min-h-11 items-center gap-1.5 rounded-xl bg-accent px-4 text-xs font-bold text-white shadow-sm hover:brightness-110 active:scale-95 disabled:opacity-50 transition-all"
            >
              <Plus className="h-4 w-4" />
              <span>Agregar</span>
            </button>
          </form>
        </>
      )}
    </div>
  );
}
