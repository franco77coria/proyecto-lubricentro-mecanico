"use client";

import { useState, useRef, useEffect } from "react";
import { Globe, Check, ChevronDown } from "lucide-react";
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
        className="inline-flex h-8 items-center gap-1.5 rounded-xl border border-border/70 bg-card/80 px-2.5 text-[11px] font-bold text-foreground hover:bg-muted transition-all shadow-xs active:scale-95"
        title="Cambiar idioma y moneda"
      >
        <span className="text-xs">{idiomaActual.bandera}</span>
        <span className="uppercase tracking-tight font-black">{idiomaActual.codigo}</span>
        <span className="text-muted-foreground/60 text-[9px]">·</span>
        <span className="font-black text-accent">{monedaActual.codigo}</span>
        <ChevronDown className={`h-3 w-3 text-muted-foreground transition-transform ${abierto ? "rotate-180" : ""}`} />
      </button>

      {abierto && (
        <div className="absolute left-0 top-full mt-2 w-60 rounded-2xl border border-border/80 bg-popover p-3 shadow-2xl backdrop-blur-2xl z-50 animate-in fade-in-0 zoom-in-95 duration-100 ring-1 ring-black/5">
          <div className="mb-2.5">
            <span className="text-[10px] font-black uppercase tracking-wider text-muted-foreground block px-1.5 mb-1.5">
              Idioma / Language
            </span>
            <div className="space-y-1">
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
                    className={`flex w-full items-center justify-between rounded-xl px-2.5 py-1.5 text-xs font-bold transition-all ${
                      activo
                        ? "bg-accent/15 text-accent font-black shadow-xs"
                        : "text-foreground hover:bg-muted"
                    }`}
                  >
                    <span className="flex items-center gap-2">
                      <span className="text-sm">{item.bandera}</span>
                      <span>{item.nombre}</span>
                    </span>
                    {activo && <Check className="h-3.5 w-3.5 stroke-[2.5]" />}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="pt-2 border-t border-border/60">
            <span className="text-[10px] font-black uppercase tracking-wider text-muted-foreground block px-1.5 mb-1.5">
              Moneda / Currency
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
                    className={`flex items-center justify-between rounded-xl px-2.5 py-1.5 text-xs font-bold transition-all ${
                      activo
                        ? "bg-accent/15 text-accent font-black shadow-xs"
                        : "text-foreground hover:bg-muted"
                    }`}
                  >
                    <span>{m.codigo}</span>
                    <span className="text-[10px] text-muted-foreground font-mono">{m.simbolo}</span>
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
