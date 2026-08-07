"use client";

import { useActionState, useState } from "react";
import { motion, useReducedMotion } from "motion/react";
import { AlertOctagon, Wrench } from "lucide-react";

import { autenticar, type ResultadoAuth } from "@/lib/actions/auth";
import { BotonArranque } from "@/components/auth/BotonArranque";
import { Tacometro } from "@/components/auth/Tacometro";
import { CampoAnimado } from "@/components/auth/CampoAnimado";

export default function Login() {
  const [modo, setModo] = useState<"login" | "registro">("login");
  const [estado, accion, pendiente] = useActionState<ResultadoAuth, FormData>(autenticar, {});
  const reducirMovimiento = useReducedMotion();

  return (
    <main className="mx-auto flex w-full max-w-[22rem] flex-1 flex-col justify-center gap-6 py-6 z-10">
      <header className="space-y-1.5 text-center">
        <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-xl bg-accent/15 text-accent shadow-sm">
          <Wrench className="h-5 w-5" />
        </div>
        <h1 className="text-display text-4xl tracking-tight text-foreground font-black">TALLER</h1>
        <p className="text-caption text-muted-foreground font-medium">
          Sistema de Gestión para Lubricentros y Mecánica
        </p>
      </header>

      <div className="mx-auto h-40 w-40">
        <Tacometro estado={pendiente ? "acelerando" : "ralenti"} />
      </div>

      <form action={accion} className="flex flex-col gap-4">
        <input type="hidden" name="modo" value={modo} />

        <div className="space-y-3">
          <CampoAnimado
            etiqueta="Email"
            name="email"
            type="email"
            autoComplete="email"
            inputMode="email"
            placeholder="vos@taller.com"
            required
          />
          <CampoAnimado
            etiqueta="Contraseña"
            name="password"
            type="password"
            autoComplete={modo === "login" ? "current-password" : "new-password"}
            placeholder="Mínimo 8 caracteres"
            minLength={8}
            required
          />
        </div>

        {estado.error && (
          <motion.p
            role="alert"
            initial={reducirMovimiento ? false : { opacity: 0 }}
            animate={reducirMovimiento ? {} : { opacity: [0, 1, 0.3, 1] }}
            transition={{ duration: 0.5, times: [0, 0.25, 0.5, 1] }}
            className="flex items-center gap-2 rounded-xl bg-destructive/10 p-3 text-xs font-bold text-destructive border border-destructive/20"
          >
            <AlertOctagon className="h-4 w-4 shrink-0" />
            {estado.error}
          </motion.p>
        )}

        <div className="flex justify-center pt-1">
          <BotonArranque modo={modo} cargando={pendiente} />
        </div>
      </form>

      <p className="text-center text-caption text-muted-foreground font-medium">
        {modo === "login" ? "¿Primera vez acá?" : "¿Ya tenés cuenta?"}{" "}
        <button
          type="button"
          onClick={() => setModo((m) => (m === "login" ? "registro" : "login"))}
          className="min-h-11 font-bold text-accent underline underline-offset-2 transition-colors hover:text-accent/80"
        >
          {modo === "login" ? "Crear un taller" : "Iniciar sesión"}
        </button>
      </p>
    </main>
  );
}
