"use client";

import { useState } from "react";
import { Check, TriangleAlert } from "lucide-react";

import { ayudaPatente, detectarFormato, nombreFormato, normalizarPatente } from "@/lib/patente";

export function PatenteInput({
  defaultValue = "",
  value: valueProp,
  onChange,
  onCambio,
  formatoEspecial: especialProp,
  onFormatoEspecialChange,
}: {
  defaultValue?: string;
  value?: string;
  onChange?: (patente: string) => void;
  onCambio?: (patente: string) => void;
  formatoEspecial?: boolean;
  onFormatoEspecialChange?: (especial: boolean) => void;
}) {
  const [internalValor, setInternalValor] = useState(normalizarPatente(defaultValue));
  const [internalEspecial, setInternalEspecial] = useState(false);

  const valor = valueProp !== undefined ? valueProp : internalValor;
  const especial = especialProp !== undefined ? especialProp : internalEspecial;

  const formato = detectarFormato(valor);
  const ayuda = especial ? null : ayudaPatente(valor);

  const handleTextChange = (val: string) => {
    const limpio = normalizarPatente(val).slice(0, 10);
    if (valueProp === undefined) {
      setInternalValor(limpio);
    }
    onChange?.(limpio);
    onCambio?.(limpio);
  };

  const handleEspecialChange = (esp: boolean) => {
    if (especialProp === undefined) {
      setInternalEspecial(esp);
    }
    onFormatoEspecialChange?.(esp);
  };

  return (
    <div className="space-y-2">
      <label className="block space-y-1.5">
        <span className="text-caption font-medium text-muted-foreground">Patente</span>
        <input
          name="patente"
          required
          value={valor}
          onChange={(e) => handleTextChange(e.target.value)}
          autoCapitalize="characters"
          autoCorrect="off"
          spellCheck={false}
          inputMode="text"
          placeholder="AB123CD"
          aria-describedby="ayuda-patente"
          aria-invalid={ayuda ? true : undefined}
          className={`text-display min-h-14 w-full rounded-[var(--radius-sm)] border bg-card px-3 text-2xl tracking-[0.08em] text-foreground outline-none transition-shadow placeholder:text-muted-foreground/50 focus:shadow-[0_0_0_3px_color-mix(in_srgb,var(--accent)_18%,transparent)] ${
            ayuda ? "border-destructive" : "border-border focus:border-accent"
          }`}
        />
      </label>

      <p id="ayuda-patente" className="flex min-h-5 items-start gap-1.5 text-caption">
        {formato && !especial ? (
          <>
            <Check className="mt-px h-3.5 w-3.5 shrink-0 text-estado-ok" aria-hidden />
            <span className="text-muted-foreground">{nombreFormato(formato)}</span>
          </>
        ) : ayuda ? (
          <>
            <TriangleAlert className="mt-px h-3.5 w-3.5 shrink-0 text-destructive" aria-hidden />
            <span className="text-destructive">{ayuda}</span>
          </>
        ) : null}
      </p>

      {(ayuda || especial) && (
        <label className="flex items-center gap-2.5 rounded-[var(--radius-sm)] bg-muted px-3 py-2.5">
          <input
            type="checkbox"
            name="formatoEspecial"
            checked={especial}
            onChange={(e) => handleEspecialChange(e.target.checked)}
            className="h-5 w-5 accent-[var(--accent)]"
          />
          <span className="text-caption text-foreground">
            Es un importado, un clásico o tiene chapa especial
          </span>
        </label>
      )}
    </div>
  );
}
