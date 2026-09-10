"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Wrench, CheckCircle2, Clock, Droplets, AlertTriangle, ArrowUpRight } from "lucide-react";
import { PlacaPatente } from "@/components/ui/PlacaPatente";

interface VehiculoDemo {
  id: string;
  patente: string;
  modelo: string;
  motor: string;
  km: string;
  tiempoFosa: string;
  aceite: string;
  litros: number;
  filtro: string;
  estado: "recibido" | "en_fosa" | "listo";
  alertas?: string;
}

const VEHICULOS_DEMO: VehiculoDemo[] = [
  {
    id: "1",
    patente: "AE789CD",
    modelo: "Toyota Hilux 2.8 D-4D",
    motor: "1GD-FTV Turbo Diesel",
    km: "48.200 km",
    tiempoFosa: "18 min",
    aceite: "Sintético 5W-30 API SN",
    litros: 7.5,
    filtro: "Filtro de Aceite + Cárter",
    estado: "en_fosa",
    alertas: "Pastillas delanteras al 25% (Avisar cliente)",
  },
  {
    id: "2",
    patente: "LSJ982",
    modelo: "Renault Fluence 1.6 16V Confort",
    motor: "K4M 1.6L 16V 110cv",
    km: "89.400 km",
    tiempoFosa: "25 min",
    aceite: "Semisintético 10W-40 RN0700",
    litros: 4.8,
    filtro: "Filtro Blindado Aceite + Habitáculo",
    estado: "en_fosa",
    alertas: "Chasis 8A1LZB115DL468090 · Cédula leída con IA",
  },
  {
    id: "3",
    patente: "AF342XP",
    modelo: "VW Amarok 3.0 V6 TDI",
    motor: "3.0 V6 258cv",
    km: "62.100 km",
    tiempoFosa: "42 min",
    aceite: "Sintético 5W-30 VW 507.00",
    litros: 8.0,
    filtro: "Elemento Filtrante + Aire",
    estado: "recibido",
  },
  {
    id: "4",
    patente: "RTF421",
    modelo: "Ford Ranger 3.2 TDCi",
    motor: "Duratorq 5 Cilindros",
    km: "142.000 km",
    tiempoFosa: "Listo",
    aceite: "Semisintético 10W-40",
    litros: 9.8,
    filtro: "Filtro de Aceite + Gasoil",
    estado: "listo",
  },
];

export function InteractiveHeroMockup() {
  const [seleccionado, setSeleccionado] = useState<string>("1");
  const [estados, setEstados] = useState<Record<string, "recibido" | "en_fosa" | "listo">>({
    "1": "en_fosa",
    "2": "recibido",
    "3": "listo",
  });

  const vehiculo = VEHICULOS_DEMO.find((v) => v.id === seleccionado) || VEHICULOS_DEMO[0];
  const estadoActual = estados[vehiculo.id] || vehiculo.estado;

  const cambiarEstado = (nuevo: "recibido" | "en_fosa" | "listo") => {
    setEstados((prev) => ({ ...prev, [vehiculo.id]: nuevo }));
  };

  return (
    <div className="relative w-full max-w-xl mx-auto">
      {/* Resplandor ambiental de fondo */}
      <div className="absolute -inset-1 bg-gradient-to-r from-orange-500/20 via-amber-500/10 to-transparent rounded-[2.5rem] blur-2xl -z-10 opacity-70" />

      {/* Outer Shell (Doppelrand / Double-Bezel Hardware Architecture) */}
      <div className="rounded-[2rem] bg-white/[0.04] p-1.5 sm:p-2 border border-white/10 shadow-[0_20px_50px_rgba(0,0,0,0.8)] backdrop-blur-xl">
        {/* Inner Core */}
        <div className="rounded-[calc(2rem-0.375rem)] bg-[#101014]/95 border border-white/[0.06] p-4 sm:p-6 shadow-[inset_0_1px_1px_rgba(255,255,255,0.1)]">
          {/* Header de la terminal */}
          <div className="flex items-center justify-between border-b border-white/[0.08] pb-3 mb-4">
            <div className="flex items-center gap-2">
              <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-[11px] font-mono uppercase tracking-widest text-emerald-400 font-bold">
                Elevador 02 · Fosa Activa
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-white/[0.06] text-white/70 border border-white/[0.06]">
                OT #2026-084
              </span>
            </div>
          </div>

          {/* Selector de Vehículos en Taller */}
          <div className="flex items-center gap-1.5 p-1 rounded-xl bg-white/[0.03] border border-white/[0.05] mb-4 overflow-x-auto scrollbar-none">
            {VEHICULOS_DEMO.map((v) => {
              const active = v.id === seleccionado;
              const est = estados[v.id] || v.estado;
              return (
                <button
                  key={v.id}
                  type="button"
                  onClick={() => setSeleccionado(v.id)}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                    active
                      ? "bg-accent text-accent-foreground shadow-sm shadow-orange-500/30"
                      : "text-white/60 hover:text-white hover:bg-white/[0.04]"
                  }`}
                >
                  <span>{v.patente}</span>
                  <span
                    className={`h-1.5 w-1.5 rounded-full ${
                      est === "listo"
                        ? "bg-emerald-400"
                        : est === "en_fosa"
                          ? "bg-amber-400"
                          : "bg-blue-400"
                    }`}
                  />
                </button>
              );
            })}
          </div>

          {/* Ficha Dinámica del Auto Seleccionado */}
          <AnimatePresence mode="wait">
            <motion.div
              key={vehiculo.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.25 }}
              className="space-y-4"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h3 className="text-base sm:text-lg font-black text-white tracking-tight">
                    {vehiculo.modelo}
                  </h3>
                  <p className="text-xs text-white/60 mt-0.5 flex items-center gap-2">
                    <span>{vehiculo.motor}</span>
                    <span>·</span>
                    <span className="font-mono text-white/80">{vehiculo.km}</span>
                  </p>
                </div>
                <PlacaPatente patente={vehiculo.patente} size="sm" />
              </div>

              {/* Control Táctil de Estado (1 toque para el mecánico en fosa) */}
              <div>
                <p className="text-[10px] uppercase font-bold tracking-wider text-white/50 mb-2">
                  Estado en Taller (1 toque para actualizar):
                </p>
                <div className="grid grid-cols-3 gap-2">
                  {(
                    [
                      { id: "recibido", label: "Recibido", color: "blue", icon: Clock },
                      { id: "en_fosa", label: "En Fosa", color: "amber", icon: Wrench },
                      { id: "listo", label: "Listo", color: "emerald", icon: CheckCircle2 },
                    ] as const
                  ).map((st) => {
                    const isCurrent = estadoActual === st.id;
                    const Icon = st.icon;
                    return (
                      <button
                        key={st.id}
                        type="button"
                        onClick={() => cambiarEstado(st.id)}
                        className={`min-h-11 px-1.5 sm:px-2 rounded-xl flex items-center justify-center gap-1 sm:gap-1.5 text-[11px] sm:text-xs font-bold transition-all ${
                          isCurrent
                            ? st.id === "listo"
                              ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/50 shadow-[0_0_15px_rgba(16,185,129,0.25)]"
                              : st.id === "en_fosa"
                                ? "bg-amber-500/20 text-amber-300 border border-amber-500/50 shadow-[0_0_15px_rgba(245,158,11,0.25)]"
                                : "bg-blue-500/20 text-blue-300 border border-blue-500/50 shadow-[0_0_15px_rgba(59,130,246,0.25)]"
                            : "bg-white/[0.03] text-white/50 border border-white/[0.05] hover:bg-white/[0.06] hover:text-white"
                        }`}
                      >
                        <Icon className="h-3.5 w-3.5 shrink-0" />
                        <span className="truncate">{st.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Especificaciones Rápidas de Servicio (Datos críticos para el mecánico) */}
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="rounded-xl bg-white/[0.03] border border-white/[0.06] p-3">
                  <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-orange-400/90 mb-1">
                    <Droplets className="h-3.5 w-3.5" />
                    <span>Cárter &amp; Viscosidad</span>
                  </div>
                  <p className="font-bold text-white text-sm">{vehiculo.litros} Litros</p>
                  <p className="text-[11px] text-white/60 truncate">{vehiculo.aceite}</p>
                </div>

                <div className="rounded-xl bg-white/[0.03] border border-white/[0.06] p-3">
                  <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-white/50 mb-1">
                    <Wrench className="h-3.5 w-3.5" />
                    <span>Filtros &amp; Repuestos</span>
                  </div>
                  <p className="font-bold text-white text-sm truncate">{vehiculo.filtro}</p>
                  <p className="text-[11px] text-emerald-400 font-medium">Stock disponible: 8 un.</p>
                </div>
              </div>

              {/* Alerta de Peritaje Visual */}
              {vehiculo.alertas && (
                <div className="rounded-xl bg-amber-500/10 border border-amber-500/20 p-2.5 flex items-start gap-2 text-xs text-amber-200">
                  <AlertTriangle className="h-4 w-4 shrink-0 text-amber-400 mt-0.5" />
                  <p className="leading-snug">{vehiculo.alertas}</p>
                </div>
              )}
            </motion.div>
          </AnimatePresence>

          {/* Footer de la maqueta: Disparo instantáneo de WhatsApp */}
          <div className="mt-4 pt-3 border-t border-white/[0.08] flex items-center justify-between text-xs">
            <span className="text-white/60 flex items-center gap-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-accent" />
              Notificación WhatsApp al cliente:
            </span>
            <span className="font-bold text-accent hover:underline cursor-pointer flex items-center gap-1">
              Enlace de Seguimiento listo
              <ArrowUpRight className="h-3 w-3" />
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
