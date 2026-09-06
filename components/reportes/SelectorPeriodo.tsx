"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Calendar as CalendarIcon,
  CalendarRange,
  Check,
  ChevronDown,
  X,
} from "lucide-react";
import type { PeriodoPredefinido } from "@/lib/reportes-fechas";

interface SelectorPeriodoProps {
  periodoActual: PeriodoPredefinido;
  desdeActual: string;
  hastaActual: string;
  etiquetaActual: string;
}

const CHIPS: { id: PeriodoPredefinido; label: string }[] = [
  { id: "esta_semana", label: "Esta semana" },
  { id: "este_mes", label: "Este mes" },
  { id: "mes_anterior", label: "Mes anterior" },
  { id: "ultimos_30_dias", label: "Últimos 30 días" },
];

export function SelectorPeriodo({
  periodoActual,
  desdeActual,
  hastaActual,
  etiquetaActual,
}: SelectorPeriodoProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [panelAbierto, setPanelAbierto] = useState(false);
  const [desdeTemp, setDesdeTemp] = useState(desdeActual);
  const [hastaTemp, setHastaTemp] = useState(hastaActual);
  const [modoDiaEspecifico, setModoDiaEspecifico] = useState(
    periodoActual === "personalizado" && desdeActual === hastaActual,
  );

  const panelRef = useRef<HTMLDivElement>(null);

  // Cerrar al hacer click afuera
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setPanelAbierto(false);
      }
    }
    if (panelAbierto) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [panelAbierto]);

  function aplicarPeriodo(nuevoPeriodo: PeriodoPredefinido) {
    const params = new URLSearchParams(searchParams.toString());
    params.set("periodo", nuevoPeriodo);
    params.delete("desde");
    params.delete("hasta");
    router.push(`/reportes?${params.toString()}`);
    setPanelAbierto(false);
  }

  function aplicarFechasPersonalizadas() {
    if (!desdeTemp) return;
    const params = new URLSearchParams(searchParams.toString());
    params.set("periodo", "personalizado");
    params.set("desde", desdeTemp);
    params.set("hasta", modoDiaEspecifico ? desdeTemp : (hastaTemp || desdeTemp));
    router.push(`/reportes?${params.toString()}`);
    setPanelAbierto(false);
  }

  function aplicarPresetRapido(preset: "hoy" | "ayer" | "esta_semana" | "semana_anterior" | "este_mes" | "mes_anterior" | "ultimos_90_dias") {
    const hoy = new Date();
    const aISO = (d: Date) => {
      const y = d.getFullYear();
      const m = String(d.getMonth() + 1).padStart(2, "0");
      const dia = String(d.getDate()).padStart(2, "0");
      return `${y}-${m}-${dia}`;
    };

    let d1 = new Date(hoy);
    let d2 = new Date(hoy);

    if (preset === "hoy") {
      setDesdeTemp(aISO(d1));
      setHastaTemp(aISO(d1));
      setModoDiaEspecifico(true);
      return;
    }
    if (preset === "ayer") {
      d1.setDate(hoy.getDate() - 1);
      setDesdeTemp(aISO(d1));
      setHastaTemp(aISO(d1));
      setModoDiaEspecifico(true);
      return;
    }
    if (preset === "esta_semana") {
      const day = hoy.getDay();
      const diff = day === 0 ? -6 : 1 - day;
      d1.setDate(hoy.getDate() + diff);
      d2 = new Date(hoy);
      setModoDiaEspecifico(false);
      setDesdeTemp(aISO(d1));
      setHastaTemp(aISO(d2));
      return;
    }
    if (preset === "semana_anterior") {
      const day = hoy.getDay();
      const diff = day === 0 ? -6 : 1 - day;
      d1.setDate(hoy.getDate() + diff - 7);
      d2 = new Date(d1);
      d2.setDate(d1.getDate() + 6);
      setModoDiaEspecifico(false);
      setDesdeTemp(aISO(d1));
      setHastaTemp(aISO(d2));
      return;
    }
    if (preset === "este_mes") {
      d1.setDate(1);
      d2 = new Date(hoy);
      setModoDiaEspecifico(false);
      setDesdeTemp(aISO(d1));
      setHastaTemp(aISO(d2));
      return;
    }
    if (preset === "mes_anterior") {
      d1 = new Date(hoy.getFullYear(), hoy.getMonth() - 1, 1);
      d2 = new Date(hoy.getFullYear(), hoy.getMonth(), 0);
      setModoDiaEspecifico(false);
      setDesdeTemp(aISO(d1));
      setHastaTemp(aISO(d2));
      return;
    }
    if (preset === "ultimos_90_dias") {
      d1.setDate(hoy.getDate() - 90);
      d2 = new Date(hoy);
      setModoDiaEspecifico(false);
      setDesdeTemp(aISO(d1));
      setHastaTemp(aISO(d2));
      return;
    }
  }

  return (
    <div className="relative w-full" ref={panelRef}>
      {/* Barra de Filtros Rápidos (Chips & Botón Selector) */}
      <div className="flex flex-wrap items-center justify-between gap-2.5 rounded-3xl border border-border/80 bg-card/80 p-2 shadow-xs backdrop-blur-xl">
        {/* Segmented Chips */}
        <div className="flex flex-wrap items-center gap-1.5 min-w-0">
          {CHIPS.map((chip) => {
            const activo = periodoActual === chip.id;
            return (
              <button
                key={chip.id}
                type="button"
                onClick={() => aplicarPeriodo(chip.id)}
                className={`
                  min-h-10 rounded-2xl px-3.5 py-1.5 text-xs font-bold transition-all active:scale-95
                  ${
                    activo
                      ? "bg-accent text-white shadow-md shadow-accent/25"
                      : "text-muted-foreground hover:bg-muted/70 hover:text-foreground"
                  }
                `}
              >
                {chip.label}
              </button>
            );
          })}
        </div>

        {/* Botón Personalizado / Desplegable de Fechas */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setPanelAbierto((prev) => !prev)}
            className={`
              flex min-h-10 items-center gap-2 rounded-2xl border px-3.5 py-1.5 text-xs font-bold transition-all active:scale-95
              ${
                periodoActual === "personalizado" || panelAbierto
                  ? "border-accent/50 bg-accent/15 text-accent shadow-xs"
                  : "border-border/80 bg-muted/40 text-foreground hover:bg-muted/80 hover:border-border"
              }
            `}
          >
            <CalendarRange className="h-4 w-4 text-accent" />
            <span className="font-semibold">{etiquetaActual}</span>
            <ChevronDown
              className={`h-3.5 w-3.5 text-muted-foreground transition-transform ${
                panelAbierto ? "rotate-180 text-accent" : ""
              }`}
            />
          </button>
        </div>
      </div>

      {/* Popover Desplegable Moderno para Fechas Personalizadas */}
      {panelAbierto && (
        <div className="absolute right-0 top-full z-50 mt-2 w-full max-w-lg rounded-3xl border border-border/90 bg-card/95 p-4 sm:p-5 shadow-2xl backdrop-blur-2xl animate-in fade-in zoom-in-95 duration-150 ring-1 ring-black/10">
          <div className="flex items-center justify-between border-b border-border/60 pb-3 mb-4">
            <div className="flex items-center gap-2">
              <CalendarIcon className="h-4 w-4 text-accent" />
              <span className="text-xs font-black text-foreground uppercase tracking-wider">
                Filtro de Fechas del Taller
              </span>
            </div>
            <button
              type="button"
              onClick={() => setPanelAbierto(false)}
              className="grid h-7 w-7 place-items-center rounded-xl text-muted-foreground hover:bg-muted hover:text-foreground"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Atajos Rápidos */}
          <div className="mb-4">
            <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1.5">
              Atajos Rápidos:
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
              {[
                { id: "hoy", label: "Hoy" },
                { id: "ayer", label: "Ayer" },
                { id: "esta_semana", label: "Esta semana" },
                { id: "semana_anterior", label: "Semana pasada" },
                { id: "este_mes", label: "Este mes" },
                { id: "mes_anterior", label: "Mes pasado" },
                { id: "ultimos_90_dias", label: "Últimos 90 días" },
              ].map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => aplicarPresetRapido(p.id as never)}
                  className="rounded-xl border border-border/60 bg-muted/30 px-2.5 py-1.5 text-[11px] font-semibold text-foreground hover:bg-accent/15 hover:text-accent hover:border-accent/30 transition-all text-center"
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          {/* Selector de Modo: Rango vs Día Específico */}
          <div className="mb-4 flex items-center justify-between rounded-2xl bg-muted/40 p-1.5 border border-border/40">
            <button
              type="button"
              onClick={() => setModoDiaEspecifico(false)}
              className={`flex-1 rounded-xl py-1.5 text-xs font-bold transition-all ${
                !modoDiaEspecifico
                  ? "bg-card text-foreground shadow-xs"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Rango de Fechas (Desde - Hasta)
            </button>
            <button
              type="button"
              onClick={() => {
                setModoDiaEspecifico(true);
                setHastaTemp(desdeTemp);
              }}
              className={`flex-1 rounded-xl py-1.5 text-xs font-bold transition-all ${
                modoDiaEspecifico
                  ? "bg-card text-foreground shadow-xs"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Un Día en Específico
            </button>
          </div>

          {/* Campos de Entrada de Fecha */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-5">
            <div>
              <label
                htmlFor="filtro-desde"
                className="block text-[11px] font-bold text-muted-foreground mb-1"
              >
                {modoDiaEspecifico ? "Fecha del día:" : "Desde fecha:"}
              </label>
              <div className="relative flex items-center">
                <input
                  id="filtro-desde"
                  type="date"
                  value={desdeTemp}
                  onChange={(e) => {
                    setDesdeTemp(e.target.value);
                    if (modoDiaEspecifico) setHastaTemp(e.target.value);
                  }}
                  className="min-h-12 w-full rounded-2xl border border-border/80 bg-muted/50 px-3 py-2 text-xs font-bold text-foreground shadow-inner focus:border-accent focus:bg-card focus:outline-none transition-all"
                />
              </div>
            </div>

            {!modoDiaEspecifico && (
              <div>
                <label
                  htmlFor="filtro-hasta"
                  className="block text-[11px] font-bold text-muted-foreground mb-1"
                >
                  Hasta fecha:
                </label>
                <div className="relative flex items-center">
                  <input
                    id="filtro-hasta"
                    type="date"
                    value={hastaTemp}
                    onChange={(e) => setHastaTemp(e.target.value)}
                    className="min-h-12 w-full rounded-2xl border border-border/80 bg-muted/50 px-3 py-2 text-xs font-bold text-foreground shadow-inner focus:border-accent focus:bg-card focus:outline-none transition-all"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Botón Aplicar */}
          <div className="flex items-center gap-2 pt-2 border-t border-border/60">
            <button
              type="button"
              onClick={aplicarFechasPersonalizadas}
              className="flex min-h-12 flex-1 items-center justify-center gap-2 rounded-2xl bg-accent text-xs font-black text-white shadow-md shadow-accent/25 hover:brightness-110 active:scale-[0.98] transition-all"
            >
              <Check className="h-4 w-4 stroke-[3]" />
              <span>Ver números del período</span>
            </button>
            <button
              type="button"
              onClick={() => setPanelAbierto(false)}
              className="flex min-h-12 items-center justify-center rounded-2xl border border-border/80 bg-card px-4 text-xs font-bold text-muted-foreground hover:bg-muted hover:text-foreground active:scale-95 transition-all"
            >
              Cancelar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
