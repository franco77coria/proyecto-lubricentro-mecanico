"use client";

import { Check, Globe } from "lucide-react";
import { useI18n } from "@/lib/i18n/I18nContext";
import { IDIOMAS_DISPONIBLES, MONEDAS_DISPONIBLES, type Idioma, type Moneda } from "@/lib/i18n";

export function AjustesIdiomaMoneda({ editable = true }: { editable?: boolean }) {
  const { idioma, moneda, cambiarIdioma, cambiarMoneda } = useI18n();

  return (
    <section className="tarjeta p-5 space-y-4">
      <div className="flex items-center gap-2.5 border-b border-border/60 pb-3">
        <div className="grid h-8 w-8 place-items-center rounded-xl bg-accent/15 text-accent">
          <Globe className="h-4 w-4" />
        </div>
        <div>
          <h2 className="text-sm font-black text-foreground">Idioma &amp; Moneda Regional</h2>
          <p className="text-caption text-muted-foreground">
            Elegí el idioma de la plataforma y el formato monetario de las cotizaciones.
          </p>
        </div>
      </div>

      {/* Selector de Idioma */}
      <div className="space-y-2">
        <label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
          Idioma de la interfaz
        </label>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
          {IDIOMAS_DISPONIBLES.map((item) => {
            const activo = item.codigo === idioma;
            return (
              <button
                key={item.codigo}
                type="button"
                disabled={!editable}
                onClick={() => cambiarIdioma(item.codigo as Idioma)}
                className={`flex items-center justify-between rounded-xl border p-3 text-xs font-bold transition-all ${
                  activo
                    ? "border-accent bg-accent/10 text-accent shadow-xs"
                    : "border-border bg-card text-foreground hover:bg-muted/60"
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <span className="text-base">{item.bandera}</span>
                  <div className="text-left">
                    <span className="block font-black">{item.nombre}</span>
                    <span className="block text-[10px] text-muted-foreground uppercase">{item.codigo}</span>
                  </div>
                </div>
                {activo && <Check className="h-4 w-4 text-accent stroke-[3]" />}
              </button>
            );
          })}
        </div>
      </div>

      {/* Selector de Moneda */}
      <div className="space-y-2 pt-2 border-t border-border/50">
        <label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
          Moneda de cotización y reportes
        </label>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {MONEDAS_DISPONIBLES.map((m) => {
            const activo = m.codigo === moneda;
            return (
              <button
                key={m.codigo}
                type="button"
                disabled={!editable}
                onClick={() => cambiarMoneda(m.codigo as Moneda)}
                className={`flex items-center justify-between rounded-xl border p-2.5 text-xs font-bold transition-all ${
                  activo
                    ? "border-accent bg-accent/10 text-accent shadow-xs"
                    : "border-border bg-card text-foreground hover:bg-muted/60"
                }`}
              >
                <div className="text-left">
                  <span className="block font-black">{m.codigo}</span>
                  <span className="block text-[10px] text-muted-foreground">{m.nombre}</span>
                </div>
                <span className="text-xs font-mono text-muted-foreground">{m.simbolo}</span>
              </button>
            );
          })}
        </div>
      </div>
    </section>
  );
}
