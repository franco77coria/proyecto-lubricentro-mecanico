"use client";

import { Activity, Eye } from "lucide-react";
import type { RegistroAuditoria } from "@/lib/actions/equipo";

const NOMBRE_ROL: Record<string, string> = {
  dueno: "Dueño / Admin",
  mostrador: "Mostrador / Recepción",
  mecanico: "Mecánico / Fosa",
};

const COLOR_ROL: Record<string, string> = {
  dueno: "bg-amber-500/15 text-amber-400 border-amber-500/30",
  mostrador: "bg-sky-500/15 text-sky-400 border-sky-500/30",
  mecanico: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
};

function formatearMinutos(mins: number): string {
  if (mins === 0) return "0m";
  const horas = Math.floor(mins / 60);
  const m = mins % 60;
  if (horas === 0) return `${m}m`;
  return `${horas}h ${m > 0 ? `${m}m` : ""}`;
}

export function PanelAuditoriaEquipo({
  registros,
  onEditarVistas,
}: {
  registros: RegistroAuditoria[];
  onEditarVistas: (usuario: { userId: string; nombre: string | null; vistasPermitidas?: string[] | null }) => void;
}) {
  if (!registros.length) return null;

  return (
    <section className="space-y-4 rounded-3xl border border-border/80 bg-card p-5 sm:p-7 shadow-xl">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border/60 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <Activity className="h-5 w-5 text-accent animate-pulse" />
            <h2 className="text-lg font-black tracking-tight text-foreground">
              Auditoría &amp; Telemetría de Uso Activo
            </h2>
          </div>
          <p className="mt-1 text-xs font-semibold text-muted-foreground">
            Monitoreo en vivo del tiempo que cada mecánico y empleado pasa operando activamente la herramienta.
          </p>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {registros.map((reg) => {
          const vistasCount = reg.vistasPermitidas?.length ?? 5;
          return (
            <div
              key={reg.userId}
              className="flex flex-col justify-between rounded-2xl border border-border/70 bg-muted/20 p-4 transition-all hover:border-accent/40 space-y-4"
            >
              <div className="space-y-3">
                {/* Cabecera del usuario */}
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="relative">
                      <span className="grid h-10 w-10 place-items-center rounded-xl bg-gradient-to-br from-zinc-700 to-zinc-900 text-xs font-black text-white shadow-sm border border-white/10">
                        {(reg.nombre || "?").slice(0, 2).toUpperCase()}
                      </span>
                      {reg.estaOnline && (
                        <span className="absolute -bottom-1 -right-1 flex h-3.5 w-3.5">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                          <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-emerald-500 border-2 border-card" />
                        </span>
                      )}
                    </div>
                    <div className="min-w-0">
                      <h3 className="truncate text-sm font-black text-foreground">
                        {reg.nombre || "Usuario"}
                      </h3>
                      <span
                        className={`inline-block rounded-full border px-2 py-0.2 text-[9px] font-black uppercase mt-0.5 ${
                          COLOR_ROL[reg.rol] ?? "bg-muted text-foreground"
                        }`}
                      >
                        {NOMBRE_ROL[reg.rol] ?? reg.rol}
                      </span>
                    </div>
                  </div>

                  {/* Estado en vivo */}
                  <span
                    className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold ${
                      reg.estaOnline
                        ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30"
                        : "bg-muted text-muted-foreground"
                    }`}
                  >
                    {reg.estaOnline ? "En línea ahora" : "Desconectado"}
                  </span>
                </div>

                {/* Métricas de tiempo */}
                <div className="grid grid-cols-2 gap-2 rounded-xl bg-card p-2.5 border border-border/50">
                  <div>
                    <span className="block text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                      Uso Activo Hoy
                    </span>
                    <span className="text-base font-black text-accent tabular-nums">
                      {formatearMinutos(reg.minutosHoy)}
                    </span>
                  </div>
                  <div>
                    <span className="block text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                      Últimos 7 Días
                    </span>
                    <span className="text-base font-black text-foreground tabular-nums">
                      {formatearMinutos(reg.minutosSemana)}
                    </span>
                  </div>
                </div>

                {/* Pantallas visitadas hoy */}
                {reg.pantallasHoy.length > 0 && (
                  <div className="space-y-1">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                      Pantallas operadas hoy:
                    </span>
                    <div className="flex flex-wrap gap-1">
                      {reg.pantallasHoy.map((p) => (
                        <span
                          key={p}
                          className="rounded-md bg-muted/60 px-1.5 py-0.5 text-[10px] font-medium text-foreground truncate max-w-[120px]"
                        >
                          {p.replace("/", "") || "tablero"}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Botón para configurar vistas autorizadas */}
              {reg.rol !== "dueno" && (
                <button
                  type="button"
                  onClick={() =>
                    onEditarVistas({
                      userId: reg.userId,
                      nombre: reg.nombre,
                      vistasPermitidas: reg.vistasPermitidas,
                    })
                  }
                  className="flex min-h-9 w-full items-center justify-center gap-1.5 rounded-xl border border-border/80 bg-card px-3 text-xs font-bold text-foreground hover:border-accent/40 hover:bg-muted transition-all active:scale-98"
                >
                  <Eye className="h-3.5 w-3.5 text-accent" />
                  <span>Configurar Pantallas ({vistasCount})</span>
                </button>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}
