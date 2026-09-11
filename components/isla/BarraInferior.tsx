"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Plus, Sparkles, Columns3, CalendarDays } from "lucide-react";
import { useState } from "react";


import { SidebarDrawer } from "@/components/nav/SidebarDrawer";
import { esRutaActiva } from "@/lib/navegacion";

export interface BarraInferiorProps {
  taller?: string;
  usuario?: string;
  rol?: string;
  vistasPermitidas?: string[] | null;
}

/**
 * Barra de navegación móvil ultra-ergonómica (Dock 70/30).
 *
 * Al alcance del pulgar, con bordes redondeados prolijos (rounded-3xl),
 * botón de menú lateral (tres rayitas), accesos de carga rápida (+ OT y + Presupuesto)
 * y atajos directos a Kanban y Turnos con áreas táctiles mínimas de 48px.
 */
export function BarraInferior({
  taller = "Mi Taller",
  usuario = "",
  rol = "mostrador",
  vistasPermitidas,
}: BarraInferiorProps) {
  const pathname = usePathname();
  const [drawerAbierto, setDrawerAbierto] = useState(false);

  return (
    <>
      <SidebarDrawer
        abierto={drawerAbierto}
        onCerrar={() => setDrawerAbierto(false)}
        taller={taller}
        usuario={usuario}
        rol={rol}
        vistasPermitidas={vistasPermitidas}
      />

      <nav
        aria-label="Navegación principal móvil"
        className="fixed inset-x-0 bottom-0 z-40 flex justify-center px-2 sm:px-3 pb-[calc(var(--safe-bottom)+0.6rem)] lg:hidden pointer-events-none"
      >
        <div className="pointer-events-auto flex w-full max-w-[28rem] items-center justify-between gap-1 rounded-3xl border border-border/80 bg-card/90 backdrop-blur-2xl p-1.5 shadow-2xl">
          {/* 1. Menú Hamburguesa → X animado */}
          <button
            type="button"
            onClick={() => setDrawerAbierto(!drawerAbierto)}
            aria-expanded={drawerAbierto}
            aria-label={drawerAbierto ? "Cerrar menú" : "Abrir menú lateral"}
            className={`flex min-h-12 min-w-12 flex-1 max-w-[4.25rem] flex-col items-center justify-center gap-0.5 rounded-2xl px-1 py-1.5 transition-all active:scale-95 touch-manipulation ${
              drawerAbierto ? "bg-accent/15 text-accent" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {/* Barras animadas que se convierten en X */}
            <span className="relative flex h-5 w-5 flex-col items-center justify-center gap-[4px]">
              <span
                className={`block h-[2px] w-[18px] rounded-full bg-current transition-all duration-300 origin-center ${
                  drawerAbierto ? "translate-y-[6px] rotate-45" : ""
                }`}
              />
              <span
                className={`block h-[2px] w-[18px] rounded-full bg-current transition-all duration-300 ${
                  drawerAbierto ? "opacity-0 scale-x-0" : ""
                }`}
              />
              <span
                className={`block h-[2px] w-[18px] rounded-full bg-current transition-all duration-300 origin-center ${
                  drawerAbierto ? "-translate-y-[6px] -rotate-45" : ""
                }`}
              />
            </span>
            <span className="text-[0.625rem] font-medium tracking-tight truncate max-w-full">
              {drawerAbierto ? "Cerrar" : "Menú"}
            </span>
          </button>

          {/* 2. En el Taller (Kanban) */}
          <Link
            href="/kanban"
            aria-current={esRutaActiva(pathname, "/kanban") ? "page" : undefined}
            className={`flex min-h-12 min-w-12 flex-1 max-w-[4.25rem] flex-col items-center justify-center gap-0.5 rounded-2xl px-1 py-1.5 transition-transform active:scale-95 touch-manipulation ${
              esRutaActiva(pathname, "/kanban")
                ? "text-accent font-bold bg-accent/10"
                : "text-muted-foreground hover:text-foreground font-medium"
            }`}
          >
            <Columns3 className="h-5 w-5" strokeWidth={esRutaActiva(pathname, "/kanban") ? 2.5 : 2} aria-hidden />
            <span className="text-[0.625rem] tracking-tight truncate max-w-full">Fosa</span>
          </Link>

          {/* 3. Botón Central Destacado: + Nueva OT */}
          <Link
            href="/ot/nueva"
            aria-label="Nueva Orden de Trabajo"
            className="flex min-h-12 min-w-12 flex-1 max-w-[4.75rem] flex-col items-center justify-center gap-0.5 rounded-2xl bg-accent px-1 py-1.5 text-accent-foreground shadow-md transition-transform active:scale-95 touch-manipulation shrink-0 hover:brightness-105"
          >
            <Plus className="h-5 w-5 stroke-[2.5]" aria-hidden />
            <span className="text-[0.625rem] font-black tracking-wide truncate max-w-full">+ OT</span>
          </Link>

          {/* 4. Botón de Carga Rápida: + Presupuesto */}
          <Link
            href="/presupuestos/nueva"
            aria-label="Nuevo Presupuesto"
            className={`flex min-h-12 min-w-12 flex-1 max-w-[4.75rem] flex-col items-center justify-center gap-0.5 rounded-2xl px-1 py-1.5 transition-transform active:scale-95 touch-manipulation shrink-0 border ${
              esRutaActiva(pathname, "/presupuestos/nueva")
                ? "border-accent bg-accent/20 text-accent font-bold"
                : "border-accent/40 bg-accent/10 text-accent hover:bg-accent/15"
            }`}
          >
            <Sparkles className="h-4 w-4" aria-hidden />
            <span className="text-[0.625rem] font-bold tracking-tight truncate max-w-full">+ Presup.</span>
          </Link>

          {/* 5. Agenda / Turnos */}
          <Link
            href="/turnos"
            aria-current={esRutaActiva(pathname, "/turnos") ? "page" : undefined}
            className={`flex min-h-12 min-w-12 flex-1 max-w-[4.25rem] flex-col items-center justify-center gap-0.5 rounded-2xl px-1 py-1.5 transition-transform active:scale-95 touch-manipulation ${
              esRutaActiva(pathname, "/turnos")
                ? "text-accent font-bold bg-accent/10"
                : "text-muted-foreground hover:text-foreground font-medium"
            }`}
          >
            <CalendarDays className="h-5 w-5" strokeWidth={esRutaActiva(pathname, "/turnos") ? 2.5 : 2} aria-hidden />
            <span className="text-[0.625rem] tracking-tight truncate max-w-full">Turnos</span>
          </Link>
        </div>
      </nav>
    </>
  );
}

