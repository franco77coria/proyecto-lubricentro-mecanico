"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { LogOut, Plus, Wrench, Shield, Sparkles, Check, X } from "lucide-react";

import { esRutaActiva, itemsVisibles, ITEMS_NAV } from "@/lib/navegacion";
import { cerrarSesion } from "@/lib/actions/auth";
import { SelectorTema } from "@/components/ui/SelectorTema";
import { SelectorIdioma } from "@/components/ui/SelectorIdioma";

export interface SidebarProps {
  taller: string;
  usuario: string;
  rol: string;
  vistasPermitidas?: string[] | null;
}

const NOMBRE_ROL: Record<string, string> = {
  dueno: "Dueño / Admin",
  mostrador: "Mostrador / Recepción",
  mecanico: "Mecánico / Fosa",
};

export function Sidebar({ taller, usuario, rol, vistasPermitidas }: SidebarProps) {
  const pathname = usePathname();
  const [confirmandoLogout, setConfirmandoLogout] = useState(false);

  return (
    <aside className="fixed inset-y-0 left-0 z-30 hidden w-[var(--sidebar-ancho)] flex-col border-r border-border/80 bg-card/95 backdrop-blur-xl lg:flex shadow-xl overflow-hidden">
      {/* 1. Cabecera del Taller con Identidad + Píldoras de Idioma y Tema */}
      <div className="px-4 pt-4 pb-3 border-b border-border/60 space-y-3 bg-muted/10">
        <div className="flex items-center justify-between gap-2.5 min-w-0">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="relative grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-accent to-orange-600 text-white shadow-md shadow-accent/25">
              <Wrench className="h-4.5 w-4.5" aria-hidden />
              <span className="absolute -top-0.5 -right-0.5 flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500" />
              </span>
            </div>
            <div className="min-w-0 flex-1">
              <span className="block truncate text-sm font-black tracking-tight text-foreground">
                {taller || "Mi Taller"}
              </span>
              <span className="flex items-center gap-1 text-[10px] font-semibold text-muted-foreground">
                <Shield className="h-2.5 w-2.5 text-accent" />
                Fierros Pro
              </span>
            </div>
          </div>
        </div>

        {/* Píldoras de Idioma y Modo Claro/Oscuro (Arriba para máxima accesibilidad y nunca quedar tapadas) */}
        <div className="flex items-center gap-2 pt-0.5">
          <SelectorIdioma className="flex-1" />
          <SelectorTema className="shrink-0" />
        </div>
      </div>

      {/* 2. Acciones Rápidas (CTAs con espaciado respirable) */}
      <div className="flex flex-col gap-2 p-3.5 border-b border-border/40">
        <Link
          href="/ot/nueva"
          className="group relative flex min-h-11 items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-accent to-amber-500 text-xs font-black text-white shadow-md shadow-accent/20 transition-all hover:brightness-110 hover:shadow-accent/40 active:scale-[0.98]"
        >
          <Plus className="h-4 w-4 stroke-[3] transition-transform group-hover:rotate-90" aria-hidden />
          <span>Nueva Orden</span>
        </Link>
        <Link
          href="/presupuestos/nueva"
          className="flex min-h-9 items-center justify-center gap-1.5 rounded-xl border border-accent/30 bg-accent/5 text-[11px] font-bold text-accent transition-all hover:bg-accent/15 hover:border-accent active:scale-[0.98]"
        >
          <Sparkles className="h-3 w-3" aria-hidden />
          <span>Nuevo Presupuesto</span>
        </Link>
      </div>

      {/* 3. Navegación Principal con espacio y scroll suave */}
      <nav
        aria-label="Navegación principal"
        className="flex-1 space-y-1.5 overflow-y-auto px-3.5 py-3.5 overscroll-contain scrollbar-thin scrollbar-thumb-muted-foreground/20 hover:scrollbar-thumb-muted-foreground/40"
      >
        <p className="px-2 pb-1.5 text-[10px] font-black uppercase tracking-wider text-muted-foreground/70">
          Operaciones
        </p>
        {itemsVisibles(ITEMS_NAV, rol, vistasPermitidas).map((item) => {
          const activo = esRutaActiva(pathname, item.href);
          const Icono = item.icono;
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={activo ? "page" : undefined}
              className={`group relative flex min-h-10 items-center gap-3 rounded-xl px-3 text-xs font-bold transition-all ${
                activo
                  ? "bg-accent/15 text-accent shadow-xs border border-accent/30 font-black"
                  : "text-muted-foreground hover:bg-muted/70 hover:text-foreground hover:translate-x-0.5"
              }`}
            >
              {activo && (
                <span className="absolute left-0 top-1/2 -translate-y-1/2 h-5 w-1 rounded-r-full bg-accent" />
              )}
              <Icono
                className={`h-4 w-4 shrink-0 transition-transform group-hover:scale-110 ${
                  activo ? "text-accent" : "text-muted-foreground"
                }`}
                strokeWidth={activo ? 2.5 : 2}
                aria-hidden
              />
              <span className="truncate">{item.etiqueta}</span>
            </Link>
          );
        })}
      </nav>

      {/* 4. Pie del Sidebar: Perfil y Cierre de Sesión Colapsado con Confirmación */}
      <div className="border-t border-border/70 bg-muted/20 p-3">
        {confirmandoLogout ? (
          <div className="rounded-2xl border border-destructive/30 bg-destructive/10 p-2.5 text-center space-y-2 animate-in fade-in-50 zoom-in-95 duration-150">
            <p className="text-[11px] font-bold text-destructive">
              ¿Cerrar sesión?
            </p>
            <div className="flex items-center gap-1.5">
              <form action={cerrarSesion} className="flex-1">
                <button
                  type="submit"
                  className="flex min-h-8 w-full items-center justify-center gap-1 rounded-xl bg-destructive text-[11px] font-black text-white shadow-sm hover:brightness-110 active:scale-95 transition-all"
                >
                  <Check className="h-3.5 w-3.5" />
                  <span>Salir</span>
                </button>
              </form>
              <button
                type="button"
                onClick={() => setConfirmandoLogout(false)}
                className="flex min-h-8 flex-1 items-center justify-center gap-1 rounded-xl border border-border bg-card text-[11px] font-bold text-foreground hover:bg-muted active:scale-95 transition-all"
              >
                <X className="h-3.5 w-3.5" />
                <span>Cancelar</span>
              </button>
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-between gap-2 rounded-2xl border border-border/60 bg-card/70 p-2 transition-colors hover:border-border">
            <div className="flex items-center gap-2.5 min-w-0">
              <span className="grid h-8 w-8 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-zinc-700 to-zinc-900 text-[11px] font-black text-white shadow-xs border border-white/10">
                {(usuario || "?").slice(0, 2).toUpperCase()}
              </span>
              <div className="min-w-0 flex-1">
                <span className="block truncate text-xs font-bold text-foreground">
                  {usuario || "Taller"}
                </span>
                <span className="block text-[10px] font-medium text-muted-foreground truncate">
                  {NOMBRE_ROL[rol] ?? rol}
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setConfirmandoLogout(true)}
              aria-label="Cerrar sesión"
              title="Cerrar sesión"
              className="grid h-8 w-8 shrink-0 place-items-center rounded-xl text-muted-foreground hover:bg-destructive/10 hover:text-destructive active:scale-95 transition-all"
            >
              <LogOut className="h-3.5 w-3.5" />
            </button>
          </div>
        )}
      </div>
    </aside>
  );
}
