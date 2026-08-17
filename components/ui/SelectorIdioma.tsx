"use client";

import { useState, useRef, useEffect } from "react";
import { Globe, Check } from "lucide-react";
import { useI18n } from "@/lib/i18n/I18nContext";
import { IDIOMAS_DISPONIBLES, MONEDAS_DISPONIBLES, type Idioma, type Moneda } from "@/lib/i18n";

export function SelectorIdioma() {
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
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setAbierto(!abierto)}
        className="flex items-center gap-1.5 rounded-xl border border-border/70 bg-card/80 px-2.5 py-1.5 text-xs font-semibold text-foreground hover:bg-muted transition-colors"
        title="Cambiar idioma y moneda"
      >
        <Globe className="h-3.5 w-3.5 text-accent" />
        <span>{idiomaActual.bandera}</span>
        <span className="uppercase text-[11px] font-bold">{idiomaActual.codigo}</span>
        <span className="text-muted-foreground text-[10px]">·</span>
        <span className="text-[11px] font-bold text-accent">{monedaActual.codigo}</span>
      </button>

      {abierto && (
        <div className="absolute right-0 top-full mt-2 w-56 rounded-2xl border border-border/80 bg-popover/95 p-3 shadow-xl backdrop-blur-xl z-50 animate-in fade-in-0 zoom-in-95 duration-100">
          <div className="mb-2">
            <span className="text-[10px] font-black uppercase tracking-wider text-muted-foreground block px-2 mb-1.5">
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
                    }}
                    className={`flex w-full items-center justify-between rounded-xl px-2.5 py-1.5 text-xs font-bold transition-colors ${
                      activo
                        ? "bg-accent/15 text-accent"
                        : "text-foreground hover:bg-muted"
                    }`}
                  >
                    <span className="flex items-center gap-2">
                      <span>{item.bandera}</span>
                      <span>{item.nombre}</span>
                    </span>
                    {activo && <Check className="h-3.5 w-3.5" />}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="pt-2 border-t border-border/60">
            <span className="text-[10px] font-black uppercase tracking-wider text-muted-foreground block px-2 mb-1.5">
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
                    }}
                    className={`flex items-center justify-between rounded-xl px-2 py-1.5 text-xs font-bold transition-colors ${
                      activo
                        ? "bg-accent/15 text-accent"
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
