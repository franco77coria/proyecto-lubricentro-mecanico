"use client";

import { useActionState, useState } from "react";
import { useSearchParams } from "next/navigation";
import { motion, useReducedMotion } from "motion/react";
import { AlertOctagon, Wrench } from "lucide-react";

import { autenticar, type ResultadoAuth } from "@/lib/actions/auth";
import { BotonArranque } from "@/components/auth/BotonArranque";
import { CampoAnimado } from "@/components/auth/CampoAnimado";
import { Tacometro } from "@/components/auth/Tacometro";

const MODOS = [
  { id: "login", etiqueta: "Iniciar sesión" },
  { id: "registro", etiqueta: "Crear taller" },
] as const;

type Modo = (typeof MODOS)[number]["id"];

export default function Login() {
  const [modo, setModo] = useState<Modo>("login");
  // Cuando se llega desde una invitación, hay que volver ahí al terminar.
  const volver = useSearchParams().get("volver") ?? "";
  const [estado, accion, pendiente] = useActionState<ResultadoAuth, FormData>(autenticar, {});
  const reducirMovimiento = useReducedMotion();

  return (
    <main className="mx-auto flex w-full max-w-[23rem] flex-1 flex-col justify-center gap-6 py-4">
      {/* En escritorio la marca vive en el panel de al lado; acá sería
          repetirla dos veces en la misma pantalla. */}
      <header className="space-y-2 text-center lg:hidden">
        <span className="mx-auto grid h-11 w-11 place-items-center rounded-[var(--radius-sm)] bg-accent text-accent-foreground shadow-[var(--sombra-media)]">
          <Wrench className="h-5 w-5" aria-hidden />
        </span>
        <h1 className="text-display text-3xl text-foreground">TALLER</h1>
        <p className="text-caption text-muted-foreground">
          Órdenes de trabajo, stock y clientes
        </p>
      </header>

      <div className="mx-auto h-28 w-28 lg:hidden">
        <Tacometro estado={pendiente ? "acelerando" : "ralenti"} />
      </div>

      <div className="hidden space-y-1 lg:block">
        <h1 className="t-pantalla text-foreground">
          {modo === "login" ? "Entrá al taller" : "Creá tu taller"}
        </h1>
        <p className="text-sm text-muted-foreground">
          {modo === "login"
            ? "Usá el mail con el que te registraste."
            : "Se crea con el checklist estándar ya cargado."}
        </p>
      </div>

      {/* Selector con indicador deslizante: el fondo se mueve de una opción a
          la otra en vez de aparecer y desaparecer, así el cambio se lee como
          un solo control y no como dos botones distintos. */}
      <div
        role="tablist"
        aria-label="Modo de acceso"
        className="relative grid grid-cols-2 rounded-[var(--radius-sm)] border border-border bg-muted/60 p-1"
      >
        {MODOS.map((m) => {
          const activo = modo === m.id;
          return (
            <button
              key={m.id}
              type="button"
              role="tab"
              aria-selected={activo}
              onClick={() => setModo(m.id)}
              className="relative z-10 min-h-10 rounded-[calc(var(--radius-sm)-0.25rem)] text-sm font-semibold transition-colors"
            >
              {activo && (
                <motion.span
                  layoutId="indicador-modo"
                  transition={reducirMovimiento ? { duration: 0 } : { type: "spring", bounce: 0.15, duration: 0.4 }}
                  className="absolute inset-0 -z-10 rounded-[calc(var(--radius-sm)-0.25rem)] bg-card shadow-[var(--sombra-sutil)]"
                />
              )}
              <span className={activo ? "text-foreground" : "text-muted-foreground"}>
                {m.etiqueta}
              </span>
            </button>
          );
        })}
      </div>

      <form action={accion} className="flex flex-col gap-4">
        <input type="hidden" name="modo" value={modo} />
        <input type="hidden" name="volver" value={volver} />

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

        {/* Testigo de check engine: parpadea dos veces y queda encendido. */}
        {estado.error && (
          <motion.p
            role="alert"
            initial={reducirMovimiento ? false : { opacity: 0 }}
            animate={reducirMovimiento ? {} : { opacity: [0, 1, 0.3, 1] }}
            transition={{ duration: 0.5, times: [0, 0.25, 0.5, 1] }}
            className="flex items-start gap-2 rounded-[var(--radius-sm)] border border-destructive/20 bg-destructive/10 px-3 py-2.5 text-sm font-medium text-destructive"
          >
            <AlertOctagon className="mt-px h-4 w-4 shrink-0" aria-hidden />
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
          onClick={() => setModo(modo === "login" ? "registro" : "login")}
          className="font-semibold text-accent underline underline-offset-2"
        >
          {modo === "login" ? "Creá tu taller" : "Iniciá sesión"}
        </button>
      </p>
    </main>
  );
}
