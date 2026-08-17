"use client";

import { useState } from "react";
import { PAISES_PRINCIPALES, normalizarTelefono } from "@/lib/telefono";

interface InputTelefonoProps {
  name?: string;
  value?: string;
  defaultValue?: string;
  disabled?: boolean;
  required?: boolean;
  onChange?: (e164: string | null) => void;
  paisDefault?: string;
}

export function InputTelefono({
  name = "telefono",
  defaultValue = "",
  disabled,
  required,
  onChange,
  paisDefault = "AR",
}: InputTelefonoProps) {
  const [pais, setPais] = useState(paisDefault);
  const [local, setLocal] = useState(defaultValue);

  const paisObj = PAISES_PRINCIPALES.find((p) => p.iso === pais) || PAISES_PRINCIPALES[0];

  function handleChange(val: string) {
    setLocal(val);
    const normalizado = normalizarTelefono(val, { paisDefault: pais, esCelular: true });
    onChange?.(normalizado);
  }

  return (
    <div className="flex gap-2">
      <select
        value={pais}
        disabled={disabled}
        onChange={(e) => {
          setPais(e.target.value);
          const normalizado = normalizarTelefono(local, { paisDefault: e.target.value, esCelular: true });
          onChange?.(normalizado);
        }}
        className="min-h-11 rounded-xl border border-border bg-card px-2.5 text-xs font-bold text-foreground outline-none focus:border-accent"
        aria-label="Código de país"
      >
        {PAISES_PRINCIPALES.map((p) => (
          <option key={p.iso} value={p.iso}>
            {p.bandera} +{p.prefijo}
          </option>
        ))}
      </select>

      <input
        type="tel"
        inputMode="tel"
        name={name}
        value={local}
        disabled={disabled}
        required={required}
        placeholder={paisObj.ejemplo}
        onChange={(e) => handleChange(e.target.value)}
        className="min-h-11 flex-1 rounded-xl border border-border bg-card px-3 text-xs font-medium text-foreground outline-none focus:border-accent"
      />
    </div>
  );
}
