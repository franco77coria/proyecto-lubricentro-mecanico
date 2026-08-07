"use client";

import { useActionState } from "react";
import { motion, useReducedMotion } from "motion/react";
import { AlertOctagon } from "lucide-react";

import { crearTaller, type ResultadoAuth } from "@/lib/actions/auth";

export default function Onboarding() {
  const [estado, accion, pendiente] = useActionState<ResultadoAuth, FormData>(crearTaller, {});
  const reducirMovimiento = useReducedMotion();

  return (
    <main className="mx-auto flex w-full max-w-[22rem] flex-1 flex-col justify-center gap-6 py-6">
      <header className="space-y-2">
        <p className="text-caption text-muted-foreground">Último paso</p>
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">
          ¿Cómo se llama tu taller?
        </h1>
        <p className="text-sm text-muted-foreground">
          Queda como dueño y arranca con el checklist estándar cargado. Todo se
          puede cambiar después.
        </p>
      </header>

      <form action={accion} className="space-y-3">
        <Campo etiqueta="Nombre del taller" name="nombre" placeholder="Lubricentro San Martín" autoFocus />
        <Campo etiqueta="Tu nombre" name="nombreUsuario" placeholder="Opcional" required={false} />
        <Campo
          etiqueta="Teléfono"
          name="telefono"
          type="tel"
          inputMode="tel"
          placeholder="Opcional"
          required={false}
        />

        {estado.error && (
          <motion.p
            role="alert"
            initial={reducirMovimiento ? false : { opacity: 0 }}
            animate={reducirMovimiento ? {} : { opacity: [0, 1, 0.3, 1] }}
            transition={{ duration: 0.5, times: [0, 0.25, 0.5, 1] }}
            className="flex items-center gap-2 rounded-[var(--radius-sm)] bg-destructive/10 px-3 py-2.5 text-sm text-destructive"
          >
            <AlertOctagon className="h-4 w-4 shrink-0" aria-hidden />
            {estado.error}
          </motion.p>
        )}

        <button
          type="submit"
          disabled={pendiente}
          className="min-h-12 w-full rounded-[var(--radius-sm)] bg-accent px-4 text-sm font-semibold text-accent-foreground transition-transform active:scale-[0.98] disabled:opacity-60"
        >
          {pendiente ? "Creando…" : "Crear el taller"}
        </button>
      </form>
    </main>
  );
}

function Campo({
  etiqueta,
  name,
  required = true,
  ...props
}: { etiqueta: string; name: string } & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <label className="block space-y-1.5">
      <span className="text-caption font-medium text-muted-foreground">{etiqueta}</span>
      <input
        name={name}
        required={required}
        className="min-h-12 w-full rounded-[var(--radius-sm)] border border-border bg-card px-3 text-base text-foreground outline-none transition-shadow placeholder:text-muted-foreground/70 focus:border-accent focus:shadow-[0_0_0_3px_color-mix(in_srgb,var(--accent)_18%,transparent)]"
        {...props}
      />
    </label>
  );
}
