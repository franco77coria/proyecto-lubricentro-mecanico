"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { CheckCircle2, AlertCircle, Eye, EyeOff } from "lucide-react";

interface CampoAnimadoProps extends React.InputHTMLAttributes<HTMLInputElement> {
  etiqueta: string;
  name: string;
  error?: string;
  exitoso?: boolean;
}

export function CampoAnimado({
  etiqueta,
  name,
  type = "text",
  error,
  exitoso,
  ...props
}: CampoAnimadoProps) {
  const [mostrarPassword, setMostrarPassword] = useState(false);
  const [enfocado, setEnfocado] = useState(false);

  const esPassword = type === "password";
  const inputType = esPassword ? (mostrarPassword ? "text" : "password") : type;

  return (
    <div className="space-y-1.5">
      <div className="flex justify-between items-baseline">
        <label htmlFor={name} className="text-caption font-medium text-muted-foreground">
          {etiqueta}
        </label>
        {error && (
          <span className="text-[11px] font-semibold text-destructive animate-pulse">
            {error}
          </span>
        )}
      </div>

      <div className="relative flex items-center">
        <input
          id={name}
          name={name}
          type={inputType}
          onFocus={() => setEnfocado(true)}
          onBlur={() => setEnfocado(false)}
          className={`min-h-12 w-full rounded-xl border bg-card/80 px-3.5 pr-10 text-base text-foreground outline-none transition-all placeholder:text-muted-foreground/50 backdrop-blur-md ${
            error
              ? "border-destructive/80 shadow-[0_0_0_3px_color-mix(in_srgb,var(--destructive)_15%,transparent)]"
              : exitoso
              ? "border-emerald-500/80 shadow-[0_0_0_3px_color-mix(in_srgb,#10b981_15%,transparent)]"
              : enfocado
              ? "border-accent shadow-[0_0_0_3px_color-mix(in_srgb,var(--accent)_18%,transparent)]"
              : "border-border/70 hover:border-border"
          }`}
          {...props}
        />

        <div className="absolute right-3 flex items-center gap-1.5">
          {esPassword && (
            <button
              type="button"
              onClick={() => setMostrarPassword(!mostrarPassword)}
              className="text-muted-foreground hover:text-foreground p-1 transition-colors"
              tabIndex={-1}
            >
              {mostrarPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          )}

          <AnimatePresence mode="wait">
            {exitoso && (
              <motion.span
                key="check"
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0, opacity: 0 }}
                transition={{ type: "spring", bounce: 0.5 }}
              >
                <CheckCircle2 className="h-4 w-4 text-emerald-500" />
              </motion.span>
            )}
            {error && !exitoso && (
              <motion.span
                key="error"
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0, opacity: 0 }}
                transition={{ type: "spring", bounce: 0.5 }}
              >
                <AlertCircle className="h-4 w-4 text-destructive" />
              </motion.span>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
