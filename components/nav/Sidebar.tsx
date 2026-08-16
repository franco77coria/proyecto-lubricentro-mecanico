"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LogOut, Plus, Wrench, Shield, Sparkles } from "lucide-react";

import { esRutaActiva, itemsVisibles, ITEMS_NAV } from "@/lib/navegacion";
import { cerrarSesion } from "@/lib/actions/auth";
import { SelectorTema } from "@/components/ui/SelectorTema";

export interface SidebarProps {
  taller: string;
  usuario: string;
  rol: string;
}

const NOMBRE_ROL: Record<string, string> = {
  dueno: "Dueño / Admin",
  mostrador: "Mostrador / Recepción",
  mecanico: "Jefe de Fosa",
};

export function Sidebar({ taller, usuario, rol }: SidebarProps) {
  const pathname = usePathname();

  return (
    <aside className="fixed inset-y-0 left-0 z-30 hidden w-[var(--sidebar-ancho)] flex-col border-r border-border/80 bg-card/95 backdrop-blur-xl lg:flex shadow-2xl overflow-hidden">
      {/* Cabecera del Taller con identidad Fierros */}
      <div className="flex items-center justify-between gap-3 px-4 pt-5 pb-4 border-b border-border/50">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="relative grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-accent to-orange-600 text-white shadow-lg shadow-accent/25">
            <Wrench className="h-5 w-5 drop-shadow-sm" aria-hidden />
            <span className="absolute -top-1 -right-1 flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500" />
            </span>
          </div>
          <div className="min-w-0 flex-1">
            <span className="block truncate text-sm font-black tracking-tight text-foreground">
              {taller || "Mi Taller"}
            </span>
            <span className="flex items-center gap-1 text-[11px] font-semibold text-muted-foreground">
              <Shield className="h-3 w-3 text-accent" />
              Sistema Fierros
            </span>
          </div>
        </div>
      </div>

      {/* Acciones Rápidas (CTAs Fierros) */}
      <div className="flex flex-col gap-2 p-3 border-b border-border/40">
        <Link
          href="/ot/nueva"
          className="group relative flex min-h-11 items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-accent to-amber-500 text-sm font-black text-white shadow-lg shadow-accent/20 transition-all hover:brightness-110 hover:shadow-accent/40 active:scale-[0.98]"
        >
          <Plus className="h-4 w-4 stroke-[3] transition-transform group-hover:rotate-90" aria-hidden />
          <span>Nueva Orden</span>
        </Link>
        <Link
          href="/presupuestos/nueva"
          className="flex min-h-10 items-center justify-center gap-2 rounded-2xl border border-accent/40 bg-accent/5 text-xs font-bold text-accent transition-all hover:bg-accent/15 hover:border-accent active:scale-[0.98]"
        >
          <Sparkles className="h-3.5 w-3.5" aria-hidden />
          <span>Nuevo Presupuesto</span>
        </Link>
      </div>

      {/* Navegación Principal con SCROLL NATIVO Y FLUIDO */}
      <nav
        aria-label="Navegación principal"
        className="flex-1 space-y-1 overflow-y-auto px-3 py-3 overscroll-contain scrollbar-thin scrollbar-thumb-muted-foreground/20 hover:scrollbar-thumb-muted-foreground/40"
      >
        <p className="px-3 pb-1 text-[10px] font-bold uppercase tracking-wider text-muted-foreground/70">
          Operaciones
        </p>
        {itemsVisibles(ITEMS_NAV, rol).map((item) => {
          const activo = esRutaActiva(pathname, item.href);
          const Icono = item.icono;
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={activo ? "page" : undefined}
              className={`group relative flex min-h-10 items-center gap-3 rounded-2xl px-3 text-xs font-bold transition-all ${
                activo
                  ? "bg-accent/15 text-accent shadow-sm border border-accent/30 font-black"
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

      {/* Pie del Sidebar: Tema, Perfil y Cerrar Sesión */}
      <div className="border-t border-border/60 bg-muted/20 p-3 space-y-2">
        {/* Selector de Modo Claro / Modo Oscuro */}
        <div className="flex items-center justify-between px-1">
          <span className="text-[11px] font-bold text-muted-foreground">Apariencia</span>
          <SelectorTema />
        </div>

        {/* Tarjeta de Usuario */}
        <div className="flex items-center gap-2.5 rounded-2xl border border-border/50 bg-card/60 p-2">
          <span className="grid h-8 w-8 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-zinc-700 to-zinc-900 text-xs font-black text-white shadow-sm border border-white/10">
            {(usuario || "?").slice(0, 2).toUpperCase()}
          </span>
          <div className="min-w-0 flex-1">
            <span className="block truncate text-xs font-bold text-foreground">
              {usuario || "Taller Muñoz"}
            </span>
            <span className="block text-[10px] font-medium text-muted-foreground">
              {NOMBRE_ROL[rol] ?? rol}
            </span>
          </div>
        </div>

        <form action={cerrarSesion}>
          <button
            type="submit"
            className="flex min-h-9 w-full items-center justify-center gap-2 rounded-xl text-xs font-bold text-muted-foreground transition-all hover:bg-destructive/10 hover:text-destructive active:scale-95"
          >
            <LogOut className="h-3.5 w-3.5" aria-hidden />
            <span>Cerrar sesión</span>
          </button>
        </form>
      </div>
    </aside>
  );
}
