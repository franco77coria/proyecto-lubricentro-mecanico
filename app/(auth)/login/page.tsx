"use client";

import { useActionState, useState } from "react";
import { motion, useReducedMotion } from "motion/react";
import { AlertOctagon } from "lucide-react";

import { autenticar, type ResultadoAuth } from "@/lib/actions/auth";
import { BotonArranque } from "@/components/auth/BotonArranque";
import { Tacometro } from "@/components/auth/Tacometro";

export default function Login() {
  const [modo, setModo] = useState<"login" | "registro">("login");
  const [estado, accion, pendiente] = useActionState<ResultadoAuth, FormData>(autenticar, {});
  const reducirMovimiento = useReducedMotion();

  return (
    <main className="mx-auto flex w-full max-w-[22rem] flex-1 flex-col justify-center gap-6 py-6">
      <header className="space-y-1 text-center">
        <h1 className="text-display text-4xl text-foreground">TALLER</h1>
        <p className="text-caption text-muted-foreground">
          Órdenes de trabajo, stock y clientes
        </p>
      </header>

      <div className="mx-auto h-40 w-40">
        <Tacometro estado={pendiente ? "acelerando" : "ralenti"} />
      </div>

      {/* Un solo formulario: el botón de arranque ES el submit, y los campos
          tienen que estar adentro para que viajen con él. */}
      <form action={accion} className="flex flex-col gap-4">
        <input type="hidden" name="modo" value={modo} />

        <div className="space-y-3">
          <Campo
            etiqueta="Email"
            name="email"
            type="email"
            autoComplete="email"
            inputMode="email"
            placeholder="vos@taller.com"
          />
          <Campo
            etiqueta="Contraseña"
            name="password"
            type="password"
            autoComplete={modo === "login" ? "current-password" : "new-password"}
            placeholder="Mínimo 8 caracteres"
            minLength={8}
          />
        </div>

        {/* Testigo de check engine: parpadea dos veces y queda encendido. */}
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

        <div className="flex justify-center pt-1">
          <BotonArranque modo={modo} cargando={pendiente} />
        </div>
      </form>

      <p className="text-center text-caption text-muted-foreground">
        {modo === "login" ? "¿Primera vez acá?" : "¿Ya tenés cuenta?"}{" "}
        <button
          type="button"
          onClick={() => setModo((m) => (m === "login" ? "registro" : "login"))}
          className="min-h-11 font-semibold text-accent underline underline-offset-2"
        >
          {modo === "login" ? "Crear un taller" : "Iniciar sesión"}
        </button>
      </p>
    </main>
  );
}

function Campo({
  etiqueta,
  name,
  ...props
}: { etiqueta: string; name: string } & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <label className="block space-y-1.5">
      {/* Label visible, no placeholder haciendo de etiqueta: el placeholder
          desaparece al escribir y deja al usuario sin saber qué campo es. */}
      <span className="text-caption font-medium text-muted-foreground">{etiqueta}</span>
      <input
        name={name}
        required
        // 16px de fuente: por debajo de eso, iOS hace zoom al enfocar el campo
        // y descoloca toda la pantalla.
        className="min-h-12 w-full rounded-[var(--radius-sm)] border border-border bg-card px-3 text-base text-foreground outline-none transition-shadow placeholder:text-muted-foreground/70 focus:border-accent focus:shadow-[0_0_0_3px_color-mix(in_srgb,var(--accent)_18%,transparent)]"
        {...props}
      />
    </label>
  );
}
