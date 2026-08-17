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
    <aside className="fixed inset-y-0 left-0 z-30 hidden w-[var(--sidebar-ancho)] flex-col border-r border-border/70 bg-card/95 backdrop-blur-xl lg:flex shadow-lg overflow-hidden">
      {/* 1. Cabecera Compacta del Taller */}
      <div className="px-3.5 pt-3.5 pb-2.5 border-b border-border/50 space-y-2">
        <div className="flex items-center justify-between gap-2 min-w-0">
          <div className="flex items-center gap-2 min-w-0">
            <div className="relative grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-gradient-to-br from-accent to-orange-600 text-white shadow-xs">
              <Wrench className="h-3.5 w-3.5" aria-hidden />
              <span className="absolute -top-0.5 -right-0.5 flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
              </span>
            </div>
            <div className="min-w-0 flex-1">
              <span className="block truncate text-xs font-black tracking-tight text-foreground leading-tight">
                {taller || "Mi Taller"}
              </span>
              <span className="flex items-center gap-0.5 text-[9px] font-semibold text-muted-foreground">
                <Shield className="h-2 w-2 text-accent" />
                Fierros
              </span>
            </div>
          </div>

          {/* Micro-Píldoras Superiores (Idioma & Modo Claro/Oscuro) */}
          <div className="flex items-center gap-1 shrink-0">
            <SelectorIdioma />
            <SelectorTema />
          </div>
        </div>
      </div>

      {/* 2. Acciones Rápidas (Compactas en 2 Columnas) */}
      <div className="grid grid-cols-2 gap-1.5 p-2.5 border-b border-border/40">
        <Link
          href="/ot/nueva"
          className="group flex h-8 items-center justify-center gap-1 rounded-xl bg-accent px-2 text-[11px] font-bold text-white shadow-xs transition-all hover:brightness-105 active:scale-95"
        >
          <Plus className="h-3 w-3 stroke-[3]" aria-hidden />
          <span className="truncate">Nueva Orden</span>
        </Link>
        <Link
          href="/presupuestos/nueva"
          className="flex h-8 items-center justify-center gap-1 rounded-xl border border-accent/30 bg-accent/5 px-2 text-[11px] font-bold text-accent transition-all hover:bg-accent/15 active:scale-95"
        >
          <Sparkles className="h-3 w-3" aria-hidden />
          <span className="truncate">Presupuesto</span>
        </Link>
      </div>

      {/* 3. Navegación Principal Refinada */}
      <nav
        aria-label="Navegación principal"
        className="flex-1 space-y-0.5 overflow-y-auto px-2.5 py-2 overscroll-contain scrollbar-thin scrollbar-thumb-muted-foreground/15 hover:scrollbar-thumb-muted-foreground/30"
      >
        <p className="px-2 pt-1 pb-1 text-[9px] font-black uppercase tracking-wider text-muted-foreground/60">
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
              className={`group relative flex min-h-8 items-center gap-2.5 rounded-lg px-2.5 text-[11.5px] font-semibold transition-all ${
                activo
                  ? "bg-accent/10 text-accent font-bold shadow-2xs"
                  : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
              }`}
            >
              {activo && (
                <span className="absolute left-0 top-1/2 -translate-y-1/2 h-4 w-0.5 rounded-r-full bg-accent" />
              )}
              <Icono
                className={`h-3.5 w-3.5 shrink-0 transition-transform group-hover:scale-110 ${
                  activo ? "text-accent" : "text-muted-foreground/80"
                }`}
                strokeWidth={activo ? 2.25 : 1.75}
                aria-hidden
              />
              <span className="truncate">{item.etiqueta}</span>
            </Link>
          );
        })}
      </nav>

      {/* 4. Pie del Sidebar: Micro-Perfil y Cierre de Sesión Colapsado */}
      <div className="border-t border-border/60 bg-muted/10 p-2.5">
        {confirmandoLogout ? (
          <div className="rounded-xl border border-destructive/30 bg-destructive/10 p-2 text-center space-y-1.5 animate-in fade-in-50 zoom-in-95 duration-100">
            <p className="text-[10px] font-bold text-destructive">
              ¿Cerrar sesión?
            </p>
            <div className="flex items-center gap-1">
              <form action={cerrarSesion} className="flex-1">
                <button
                  type="submit"
                  className="flex h-7 w-full items-center justify-center gap-1 rounded-lg bg-destructive text-[10px] font-bold text-white shadow-xs hover:brightness-105 active:scale-95 transition-all"
                >
                  <Check className="h-3 w-3" />
                  <span>Salir</span>
                </button>
              </form>
              <button
                type="button"
                onClick={() => setConfirmandoLogout(false)}
                className="flex h-7 flex-1 items-center justify-center gap-1 rounded-lg border border-border bg-card text-[10px] font-semibold text-foreground hover:bg-muted active:scale-95 transition-all"
              >
                <X className="h-3 w-3" />
                <span>No</span>
              </button>
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-between gap-1.5 rounded-xl border border-border/50 bg-card/60 px-2 py-1.5 transition-colors hover:border-border/80">
            <div className="flex items-center gap-2 min-w-0">
              <span className="grid h-6 w-6 shrink-0 place-items-center rounded-lg bg-gradient-to-br from-zinc-700 to-zinc-900 text-[10px] font-bold text-white shadow-xs border border-white/10">
                {(usuario || "?").slice(0, 2).toUpperCase()}
              </span>
              <div className="min-w-0 flex-1">
                <span className="block truncate text-[11px] font-bold text-foreground leading-tight">
                  {usuario || "Taller"}
                </span>
                <span className="block text-[9px] font-medium text-muted-foreground truncate leading-tight">
                  {NOMBRE_ROL[rol] ?? rol}
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setConfirmandoLogout(true)}
              aria-label="Cerrar sesión"
              title="Cerrar sesión"
              className="grid h-6 w-6 shrink-0 place-items-center rounded-lg text-muted-foreground hover:bg-destructive/10 hover:text-destructive active:scale-95 transition-all"
            >
              <LogOut className="h-3 w-3" />
            </button>
          </div>
        )}
      </div>
    </aside>
  );
}
