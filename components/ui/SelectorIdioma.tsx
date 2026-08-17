"use client";

import { useState, useRef, useEffect } from "react";
import { Check, ChevronDown } from "lucide-react";
import { useI18n } from "@/lib/i18n/I18nContext";
import { IDIOMAS_DISPONIBLES, MONEDAS_DISPONIBLES, type Idioma, type Moneda } from "@/lib/i18n";

export function SelectorIdioma({ className = "" }: { className?: string }) {
  const { idioma, moneda, cambiarIdioma, cambiarMoneda } = useI18n();
  const [abierto, setAbierto] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const idiomaActual = IDIOMAS_DISPONIBLES.find((i) => i.codigo === idioma) || IDIOMAS_DISPONIBLES[0];
  const monedaActual = MONEDAS_DISPONIBLES.find((m) => m.codigo === moneda) || MONEDAS_DISPONIBLES[0];

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setAbierto(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className={`relative ${className}`} ref={ref}>
      <button
        type="button"
        onClick={() => setAbierto(!abierto)}
        className="inline-flex h-6 items-center gap-1 rounded-full border border-border/60 bg-muted/40 px-2 text-[10px] font-bold text-foreground hover:bg-muted/80 transition-all active:scale-95"
        title="Cambiar idioma y moneda"
      >
        <span className="text-[11px] leading-none">{idiomaActual.bandera}</span>
        <span className="uppercase font-bold tracking-tight">{idiomaActual.codigo}</span>
        <span className="text-muted-foreground/50 text-[8px]">·</span>
        <span className="font-bold text-accent">{monedaActual.codigo}</span>
        <ChevronDown className={`h-2.5 w-2.5 text-muted-foreground transition-transform ${abierto ? "rotate-180" : ""}`} />
      </button>

      {abierto && (
        <div className="absolute right-0 top-full mt-1.5 w-52 rounded-2xl border border-border/80 bg-popover/95 p-2 shadow-xl backdrop-blur-xl z-50 animate-in fade-in-0 zoom-in-95 duration-100 ring-1 ring-black/5">
          <div className="mb-2">
            <span className="text-[9px] font-black uppercase tracking-wider text-muted-foreground block px-1.5 mb-1">
              Idioma
            </span>
            <div className="space-y-0.5">
              {IDIOMAS_DISPONIBLES.map((item) => {
                const activo = item.codigo === idioma;
                return (
                  <button
                    key={item.codigo}
                    type="button"
                    onClick={() => {
                      cambiarIdioma(item.codigo as Idioma);
                      setAbierto(false);
                    }}
                    className={`flex w-full items-center justify-between rounded-lg px-2 py-1 text-[11px] font-semibold transition-all ${
                      activo
                        ? "bg-accent/15 text-accent font-bold"
                        : "text-foreground hover:bg-muted"
                    }`}
                  >
                    <span className="flex items-center gap-1.5">
                      <span className="text-xs">{item.bandera}</span>
                      <span>{item.nombre}</span>
                    </span>
                    {activo && <Check className="h-3 w-3 stroke-[2.5]" />}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="pt-1.5 border-t border-border/60">
            <span className="text-[9px] font-black uppercase tracking-wider text-muted-foreground block px-1.5 mb-1">
              Moneda
            </span>
            <div className="grid grid-cols-2 gap-1">
              {MONEDAS_DISPONIBLES.map((m) => {
                const activo = m.codigo === moneda;
                return (
                  <button
                    key={m.codigo}
                    type="button"
                    onClick={() => {
                      cambiarMoneda(m.codigo as Moneda);
                      setAbierto(false);
                    }}
                    className={`flex items-center justify-between rounded-lg px-2 py-1 text-[10px] font-semibold transition-all ${
                      activo
                        ? "bg-accent/15 text-accent font-bold"
                        : "text-foreground hover:bg-muted"
                    }`}
                  >
                    <span>{m.codigo}</span>
                    <span className="text-[9px] text-muted-foreground font-mono">{m.simbolo}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
