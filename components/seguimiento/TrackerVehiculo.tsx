"use client";

import { motion } from "motion/react";
import { CheckCircle2, AlertCircle, Sparkles, Wrench, ShieldCheck, ClipboardCheck, ArrowDownToLine } from "lucide-react";
import { cn } from "@/lib/utils";

export interface TrackerVehiculoProps {
  estado: string;
  className?: string;
}

const ETAPAS_TRACKER = [
  {
    clave: "ingresado",
    titulo: "Ingresado",
    subtitulo: "Unidad recibida en taller",
    icon: ArrowDownToLine,
    estados: ["recibido"],
  },
  {
    clave: "presupuesto",
    titulo: "Presupuesto",
    subtitulo: "Diagnóstico e inspección",
    icon: ClipboardCheck,
    estados: ["presupuesto", "aprobado"],
  },
  {
    clave: "reparacion",
    titulo: "En Trabajo",
    subtitulo: "En fosa / elevador",
    icon: Wrench,
    estados: ["en_trabajo", "esperando_repuesto"],
  },
  {
    clave: "control",
    titulo: "Control Final",
    subtitulo: "Chequeo de calidad",
    icon: ShieldCheck,
    estados: ["control_calidad"],
  },
  {
    clave: "listo",
    titulo: "¡Listo para Retirar!",
    subtitulo: "Servicio completado",
    icon: Sparkles,
    estados: ["listo", "entregado", "cerrado"],
  },
] as const;

export function TrackerVehiculo({ estado, className }: TrackerVehiculoProps) {
  const listo = ["listo", "entregado", "cerrado"].includes(estado);
  
  // Calcular índice actual (0 a 4)
  let indiceActual = ETAPAS_TRACKER.findIndex((e) =>
    (e.estados as readonly string[]).includes(estado),
  );
  if (listo) indiceActual = ETAPAS_TRACKER.length - 1;
  if (indiceActual === -1) {
    // Si es un estado intermedio
    if (estado === "en_trabajo" || estado === "esperando_repuesto") indiceActual = 2;
    else indiceActual = 0;
  }

  const porcentajeProgreso = (indiceActual / (ETAPAS_TRACKER.length - 1)) * 100;

  return (
    <div className={cn("rounded-3xl border border-border/80 bg-card p-5 sm:p-7 shadow-lg relative overflow-hidden", className)}>
      {/* Luz ambiental de fondo según estado */}
      <div
        className={cn(
          "absolute -top-24 -right-24 h-48 w-48 rounded-full blur-3xl opacity-20 pointer-events-none transition-all duration-1000",
          listo ? "bg-emerald-500 opacity-30" : "bg-accent opacity-25",
        )}
      />

      {/* Header del Tracker estilo Mercado Libre / Rappi */}
      <div className="flex items-center justify-between gap-3 pb-6 border-b border-border/60">
        <div>
          <div className="flex items-center gap-2">
            <span className="relative flex h-3 w-3">
              <span className={cn(
                "animate-ping absolute inline-flex h-full w-full rounded-full opacity-75",
                listo ? "bg-emerald-400" : "bg-accent",
              )} />
              <span className={cn(
                "relative inline-flex rounded-full h-3 w-3",
                listo ? "bg-emerald-500" : "bg-accent",
              )} />
            </span>
            <span className="text-xs font-black uppercase tracking-wider text-muted-foreground">
              {listo ? "Servicio Concluido" : "En Progreso en Tiempo Real"}
            </span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-foreground mt-1 tracking-tight">
            {ETAPAS_TRACKER[indiceActual]?.titulo}
          </h2>
        </div>

        <div className="text-right">
          <span className="inline-block rounded-full bg-accent/15 px-3 py-1 text-xs font-black text-accent">
            Paso {indiceActual + 1} de {ETAPAS_TRACKER.length}
          </span>
        </div>
      </div>

      {/* Pista de progreso y animación del auto */}
      <div className="py-8 relative">
        {/* Barra base de la ruta */}
        <div className="h-2 w-full bg-muted/60 rounded-full overflow-hidden relative">
          <motion.div
            className={cn(
              "h-full rounded-full transition-all duration-700",
              listo ? "bg-emerald-500" : "bg-gradient-to-r from-accent/80 via-accent to-amber-400",
            )}
            initial={{ width: "0%" }}
            animate={{ width: `${porcentajeProgreso}%` }}
            transition={{ type: "spring", stiffness: 100, damping: 15 }}
          />
        </div>

        {/* Auto desplazándose sobre la pista */}
        <motion.div
          className="absolute top-1 -translate-x-1/2 flex flex-col items-center pointer-events-none"
          initial={{ left: "0%" }}
          animate={{ left: `${porcentajeProgreso}%` }}
          transition={{ type: "spring", stiffness: 100, damping: 15 }}
        >
          <div className={cn(
            "p-1.5 rounded-full shadow-md border border-white/20 transition-all",
            listo ? "bg-emerald-600 text-white animate-bounce" : "bg-zinc-900 text-accent",
          )}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" className="h-5 w-5">
              <path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1.1.4-1.4.9l-1.5 2.9C2 11.2 2 11.6 2 12v4c0 .6.4 1 1 1h2" />
              <circle cx="7" cy="17" r="2" />
              <path d="M9 17h6" />
              <circle cx="17" cy="17" r="2" />
            </svg>
          </div>
        </motion.div>

        {/* Hitos / Estaciones */}
        <div className="grid grid-cols-5 gap-1 pt-6 text-center">
          {ETAPAS_TRACKER.map((etapa, idx) => {
            const completada = idx <= indiceActual;
            const esActual = idx === indiceActual;
            const IconComponent = etapa.icon;

            return (
              <div key={etapa.clave} className="flex flex-col items-center gap-1.5">
                <div
                  className={cn(
                    "grid h-8 w-8 sm:h-10 sm:w-10 place-items-center rounded-full text-xs font-bold transition-all",
                    completada
                      ? esActual && listo
                        ? "bg-emerald-500 text-white ring-4 ring-emerald-500/20"
                        : esActual
                          ? "bg-accent text-white ring-4 ring-accent/25 scale-110"
                          : "bg-accent/80 text-white"
                      : "bg-muted text-muted-foreground",
                  )}
                >
                  {completada && !esActual ? (
                    <CheckCircle2 className="h-4 w-4 sm:h-5 sm:w-5" />
                  ) : (
                    <IconComponent className="h-4 w-4 sm:h-5 sm:w-5" />
                  )}
                </div>
                <div className="min-w-0 px-0.5">
                  <p
                    className={cn(
                      "text-[10px] sm:text-xs font-bold leading-tight truncate",
                      completada ? "text-foreground" : "text-muted-foreground",
                    )}
                  >
                    {etapa.titulo}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Alerta de Retiro Destacada */}
      {listo && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="mt-4 flex items-center gap-3 rounded-2xl bg-emerald-600 p-4 text-white shadow-md"
        >
          <Sparkles className="h-6 w-6 shrink-0 text-emerald-200 animate-pulse" />
          <div className="text-sm">
            <p className="font-extrabold leading-tight">¡Tu vehículo ya puede ser retirado!</p>
            <p className="text-emerald-100 text-xs mt-0.5">
              Los trabajos programados y el control de calidad han finalizado con éxito.
            </p>
          </div>
        </motion.div>
      )}

      {estado === "esperando_repuesto" && (
        <div className="mt-4 flex items-center gap-2.5 rounded-2xl bg-amber-500/15 border border-amber-500/30 p-3.5 text-amber-400 text-xs font-medium">
          <AlertCircle className="h-5 w-5 shrink-0 text-amber-400" />
          <span>Aguardando entrega de repuesto específico para completar el armado.</span>
        </div>
      )}
    </div>
  );
}
