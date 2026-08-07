"use client";

import { useActionState, useState } from "react";
import { motion, useReducedMotion } from "motion/react";
import { AlertOctagon, CheckCircle2, ChevronRight, Sparkles, Wrench, ShieldCheck, FileSpreadsheet } from "lucide-react";

import { crearTaller, type ResultadoAuth } from "@/lib/actions/auth";
import { IndicadorProgresoGlass } from "@/components/auth/IndicadorProgresoGlass";
import { CampoAnimado } from "@/components/auth/CampoAnimado";

const SUGERENCIAS = ["Lubricentro San Martín", "Taller Mecánico Central", "Lubri-Express", "Servicios Integrales YPF"];

export default function Onboarding() {
  const [paso, setPaso] = useState<number>(1);
  const [nombreTaller, setNombreTaller] = useState<string>("");
  const [nombreUsuario, setNombreUsuario] = useState<string>("");
  const [telefono, setTelefono] = useState<string>("");
  const [estado, accion, pendiente] = useActionState<ResultadoAuth, FormData>(crearTaller, {});
  const reducirMovimiento = useReducedMotion();

  return (
    <main className="mx-auto flex w-full max-w-[24rem] flex-1 flex-col justify-center gap-6 py-6 z-10">
      {/* Encabezado */}
      <header className="space-y-3 text-center">
        <div className="inline-flex items-center gap-1.5 rounded-full border border-accent/30 bg-accent/10 px-3 py-1 text-xs font-semibold text-accent backdrop-blur-md">
          <Sparkles className="h-3.5 w-3.5" />
          <span>Puesta a punto de tu Taller</span>
        </div>
        <h1 className="text-3xl font-black tracking-tight text-foreground">
          {paso === 1 ? "¿Cómo se llama tu taller?" : paso === 2 ? "Configuración Inicial" : "¡Todo Listo para Arrancar!"}
        </h1>
        <p className="text-xs text-muted-foreground font-medium">
          {paso === 1
            ? "Escribí el nombre para generar tu comprobante y panel de trabajo."
            : paso === 2
            ? "Tu taller viene pre-configurado con 11 ítems estándar de checklist."
            : "Revisá los datos antes de crear la base de datos de tu taller."}
        </p>
      </header>

      {/* Indicador de Progreso */}
      <IndicadorProgresoGlass
        pasoActual={paso}
        totalPasos={3}
        etiquetas={["Tu Taller", "Checklist", "Confirmación"]}
      />

      {/* Formulario Form */}
      <form action={accion} className="space-y-4">
        {paso === 1 && (
          <motion.div
            initial={reducirMovimiento ? false : { opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-4"
          >
            <CampoAnimado
              etiqueta="Nombre del taller"
              name="nombre"
              value={nombreTaller}
              onChange={(e) => setNombreTaller(e.target.value)}
              placeholder="Ej. Lubricentro San Martín"
              required
              autoFocus
            />

            {/* Sugerencias Rápidas */}
            <div className="space-y-1.5">
              <p className="text-[11px] font-semibold text-muted-foreground">Sugerencias rápidas:</p>
              <div className="flex flex-wrap gap-1.5">
                {SUGERENCIAS.map((sug) => (
                  <button
                    key={sug}
                    type="button"
                    onClick={() => setNombreTaller(sug)}
                    className="rounded-lg border border-border/60 bg-card/50 px-2.5 py-1 text-[11px] font-medium text-foreground hover:border-accent hover:bg-accent/10 transition-colors"
                  >
                    + {sug}
                  </button>
                ))}
              </div>
            </div>

            <CampoAnimado
              etiqueta="Tu nombre (opcional)"
              name="nombreUsuario"
              value={nombreUsuario}
              onChange={(e) => setNombreUsuario(e.target.value)}
              placeholder="Ej. Juan Pérez (Dueño)"
            />

            <CampoAnimado
              etiqueta="Teléfono del taller (opcional)"
              name="telefono"
              type="tel"
              inputMode="tel"
              value={telefono}
              onChange={(e) => setTelefono(e.target.value)}
              placeholder="Ej. 11 4455-6677"
            />

            <button
              type="button"
              disabled={!nombreTaller.trim()}
              onClick={() => setPaso(2)}
              className="flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-accent px-4 text-sm font-bold text-accent-foreground shadow-lg transition-transform active:scale-[0.98] disabled:opacity-50"
            >
              <span>Siguiente: Inspección y Checklist</span>
              <ChevronRight className="h-4 w-4" />
            </button>
          </motion.div>
        )}

        {paso === 2 && (
          <motion.div
            initial={reducirMovimiento ? false : { opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-4"
          >
            <div className="rounded-2xl border border-border bg-card/80 p-4 shadow-sm backdrop-blur-md space-y-3">
              <div className="flex items-center gap-2 text-accent font-bold text-xs uppercase tracking-wide">
                <Wrench className="h-4 w-4" />
                <span>Checklist por defecto pre-cargado</span>
              </div>
              <ul className="space-y-2 text-xs text-muted-foreground font-medium">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
                  <span>Filtro de Aceite, Aire, Combustible y Habitáculo</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
                  <span>Nivel de Aceite de Motor y Caja de Cambios</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
                  <span>Líquido de Frenos, Refrigerante y Dirección</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
                  <span>Presión de Neumáticos y Estado de Frenos</span>
                </li>
              </ul>
              <p className="text-[11px] text-muted-foreground italic border-t border-border/50 pt-2">
                * Podés agregar o modificar tus ítems de inspección en cualquier momento desde Configuración.
              </p>
            </div>

            {/* Inputs ocultos para sincronizar estado del formulario */}
            <input type="hidden" name="nombre" value={nombreTaller} />
            <input type="hidden" name="nombreUsuario" value={nombreUsuario} />
            <input type="hidden" name="telefono" value={telefono} />

            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setPaso(1)}
                className="min-h-12 flex-1 rounded-xl border border-border bg-card px-4 text-xs font-bold text-foreground transition-colors hover:bg-muted"
              >
                Volver
              </button>
              <button
                type="button"
                onClick={() => setPaso(3)}
                className="flex min-h-12 flex-[2] items-center justify-center gap-2 rounded-xl bg-accent px-4 text-xs font-bold text-accent-foreground shadow-lg transition-transform active:scale-[0.98]"
              >
                <span>Revisar y Confirmar</span>
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </motion.div>
        )}

        {paso === 3 && (
          <motion.div
            initial={reducirMovimiento ? false : { opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-4"
          >
            {/* Tarjeta de Resumen en Cristal */}
            <div className="rounded-2xl border border-accent/40 bg-card p-4 shadow-xl space-y-3">
              <div className="flex items-center justify-between border-b border-border/60 pb-3">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-accent">Resumen de Cuenta</p>
                  <h3 className="text-lg font-black text-foreground">{nombreTaller || "Tu Taller"}</h3>
                </div>
                <div className="h-9 w-9 rounded-xl bg-accent/15 flex items-center justify-center text-accent">
                  <ShieldCheck className="h-5 w-5" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="rounded-lg bg-muted/40 p-2.5">
                  <p className="text-[10px] text-muted-foreground font-semibold">Responsable</p>
                  <p className="font-bold text-foreground truncate">{nombreUsuario || "Dueño"}</p>
                </div>
                <div className="rounded-lg bg-muted/40 p-2.5">
                  <p className="text-[10px] text-muted-foreground font-semibold">Teléfono</p>
                  <p className="font-bold text-foreground truncate">{telefono || "Sin registrar"}</p>
                </div>
              </div>

              <div className="flex items-center gap-2 pt-1 text-xs text-muted-foreground font-medium">
                <FileSpreadsheet className="h-4 w-4 text-accent" />
                <span>Base de datos aislada con RLS activa</span>
              </div>
            </div>

            {/* Inputs ocultos */}
            <input type="hidden" name="nombre" value={nombreTaller} />
            <input type="hidden" name="nombreUsuario" value={nombreUsuario} />
            <input type="hidden" name="telefono" value={telefono} />

            {/* Alerta de Error */}
            {estado.error && (
              <motion.p
                role="alert"
                initial={reducirMovimiento ? false : { opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex items-center gap-2 rounded-xl bg-destructive/10 p-3 text-xs font-bold text-destructive border border-destructive/20"
              >
                <AlertOctagon className="h-4 w-4 shrink-0" />
                {estado.error}
              </motion.p>
            )}

            <div className="flex gap-2">
              <button
                type="button"
                disabled={pendiente}
                onClick={() => setPaso(2)}
                className="min-h-12 flex-1 rounded-xl border border-border bg-card px-4 text-xs font-bold text-foreground transition-colors hover:bg-muted disabled:opacity-50"
              >
                Atrás
              </button>
              <button
                type="submit"
                disabled={pendiente}
                className="flex min-h-12 flex-[2] items-center justify-center gap-2 rounded-xl bg-accent px-4 text-sm font-bold text-accent-foreground shadow-xl transition-transform active:scale-[0.98] disabled:opacity-60"
              >
                {pendiente ? "Creando taller..." : "¡Crear Taller y Entrar!"}
              </button>
            </div>
          </motion.div>
        )}
      </form>
    </main>
  );
}
