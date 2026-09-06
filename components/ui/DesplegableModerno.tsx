"use client";

import { useState, useRef, useEffect } from "react";
import { Check, ChevronDown, type LucideIcon } from "lucide-react";

export interface OpcionDesplegable {
  valor: string;
  etiqueta: string;
  icono?: LucideIcon;
  descripcion?: string;
  badge?: string;
}

export interface DesplegableModernoProps {
  valor: string;
  onChange: (nuevoValor: string) => void;
  opciones: readonly OpcionDesplegable[] | OpcionDesplegable[];
  etiquetaLabel?: string;
  placeholder?: string;
  className?: string;
  botonClassName?: string;
  alineacion?: "izquierda" | "derecha";
  disabled?: boolean;
}

export function DesplegableModerno({
  valor,
  onChange,
  opciones,
  etiquetaLabel,
  placeholder = "Seleccionar...",
  className = "",
  botonClassName = "",
  alineacion = "izquierda",
  disabled = false,
}: DesplegableModernoProps) {
  const [abierto, setAbierto] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const seleccionada = opciones.find((o) => o.valor === valor);
  const IconoSeleccionado = seleccionada?.icono;

  // Cerrar al hacer click afuera o presionar Escape
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setAbierto(false);
      }
    }
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") setAbierto(false);
    }
    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  return (
    <div className={`relative inline-block ${className}`} ref={ref}>
      {etiquetaLabel && (
        <label className="block text-caption font-semibold text-muted-foreground mb-1">
          {etiquetaLabel}
        </label>
      )}

      <button
        type="button"
        disabled={disabled}
        onClick={() => setAbierto((prev) => !prev)}
        className={`
          inline-flex min-h-11 w-full items-center justify-between gap-3 rounded-2xl border border-border/80 bg-card/90 px-3.5 py-2 text-xs font-bold text-foreground
          shadow-xs backdrop-blur-md transition-all hover:bg-muted/70 hover:border-accent/40 active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none
          focus:outline-none focus:ring-2 focus:ring-accent/30
          ${botonClassName}
        `}
        aria-haspopup="listbox"
        aria-expanded={abierto}
      >
        <div className="flex items-center gap-2.5 min-w-0">
          {IconoSeleccionado && (
            <IconoSeleccionado className="h-4 w-4 shrink-0 text-accent" />
          )}
          <span className="truncate">
            {seleccionada ? seleccionada.etiqueta : placeholder}
          </span>
          {seleccionada?.badge && (
            <span className="shrink-0 rounded-md bg-accent/15 px-1.5 py-0.5 text-[10px] font-bold text-accent">
              {seleccionada.badge}
            </span>
          )}
        </div>

        <ChevronDown
          className={`h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-200 ${
            abierto ? "rotate-180 text-accent" : ""
          }`}
        />
      </button>

      {/* Menú Desplegable Moderno */}
      {abierto && (
        <div
          role="listbox"
          className={`
            absolute top-full z-50 mt-1.5 min-w-[200px] w-full max-w-xs rounded-2xl border border-border/80 bg-card/95 p-1.5 shadow-2xl backdrop-blur-2xl
            animate-in fade-in zoom-in-95 duration-150 overflow-hidden ring-1 ring-black/10
            ${alineacion === "derecha" ? "right-0" : "left-0"}
          `}
        >
          <div className="max-h-64 space-y-1 overflow-y-auto overscroll-contain p-0.5 scrollbar-thin">
            {opciones.map((op) => {
              const activo = op.valor === valor;
              const Icono = op.icono;

              return (
                <button
                  key={op.valor}
                  type="button"
                  role="option"
                  aria-selected={activo}
                  onClick={() => {
                    onChange(op.valor);
                    setAbierto(false);
                  }}
                  className={`
                    flex w-full items-center justify-between gap-3 rounded-xl px-3 py-2.5 text-left text-xs transition-all active:scale-[0.98]
                    ${
                      activo
                        ? "bg-accent/15 font-black text-accent shadow-xs border border-accent/20"
                        : "font-semibold text-foreground hover:bg-muted/80 hover:text-foreground"
                    }
                  `}
                >
                  <div className="flex items-center gap-2.5 min-w-0 flex-1">
                    {Icono && (
                      <Icono
                        className={`h-4 w-4 shrink-0 ${
                          activo ? "text-accent" : "text-muted-foreground"
                        }`}
                      />
                    )}
                    <div className="min-w-0 flex-1">
                      <span className="block truncate">{op.etiqueta}</span>
                      {op.descripcion && (
                        <span className="block text-[10px] font-normal text-muted-foreground/80 truncate">
                          {op.descripcion}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    {op.badge && (
                      <span className="rounded-md bg-muted px-1.5 py-0.5 text-[9px] font-bold text-muted-foreground">
                        {op.badge}
                      </span>
                    )}
                    {activo && (
                      <Check className="h-4 w-4 stroke-[3] text-accent" />
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
