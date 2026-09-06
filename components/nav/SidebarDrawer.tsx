"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import { LogOut, Plus, Wrench, Shield, Sparkles, Check, X } from "lucide-react";

import { esRutaActiva, itemsVisibles, ITEMS_NAV } from "@/lib/navegacion";
import { cerrarSesion } from "@/lib/actions/auth";
import { SelectorTema } from "@/components/ui/SelectorTema";

export interface SidebarDrawerProps {
  abierto: boolean;
  onCerrar: () => void;
  taller: string;
  usuario: string;
  rol: string;
  vistasPermitidas?: string[] | null;
}

const NOMBRE_ROL: Record<string, string> = {
  dueno: "Dueño / Encargado",
  mostrador: "Mostrador / Recepción",
  mecanico: "Mecánico / Fosa",
};

export function SidebarDrawer({
  abierto,
  onCerrar,
  taller,
  usuario,
  rol,
  vistasPermitidas,
}: SidebarDrawerProps) {
  const pathname = usePathname();
  const [confirmandoLogout, setConfirmandoLogout] = useState(false);

  // Cerrar al presionar Escape y bloquear scroll del fondo
  useEffect(() => {
    if (!abierto) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onCerrar();
    document.addEventListener("keydown", onKey);
    const previo = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = previo;
    };
  }, [abierto, onCerrar]);

  if (!abierto) return null;

  return (
    <div className="fixed inset-0 z-50 lg:hidden" role="dialog" aria-modal="true" aria-label="Menú principal">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm transition-opacity duration-300 animate-in fade-in"
        onClick={onCerrar}
      />

      {/* Drawer deslizable desde la izquierda con bordes redondeados a la derecha */}
      <aside className="fixed inset-y-0 left-0 z-50 flex w-72 max-w-[85vw] flex-col border-r border-border/80 bg-card/95 backdrop-blur-2xl rounded-r-3xl shadow-2xl overflow-hidden transition-transform duration-300 animate-in slide-in-from-left">
        {/* 1. Cabecera con taller, tema y botón de cierre */}
        <div className="flex items-center justify-between border-b border-border/60 px-4 py-3.5 bg-muted/20">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="relative grid h-8 w-8 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-accent to-orange-600 text-white shadow-sm">
              <Wrench className="h-4 w-4" aria-hidden />
              <span className="absolute -top-0.5 -right-0.5 flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
              </span>
            </div>
            <div className="min-w-0 flex-1">
              <span className="block truncate text-xs font-black tracking-tight text-foreground">
                {taller || "Mi Taller"}
              </span>
              <span className="flex items-center gap-0.5 text-[10px] font-semibold text-muted-foreground">
                <Shield className="h-2.5 w-2.5 text-accent" />
                Fierros Pro
              </span>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <SelectorTema />
            <button
              type="button"
              onClick={onCerrar}
              className="grid h-8 w-8 place-items-center rounded-xl text-muted-foreground hover:bg-muted hover:text-foreground active:scale-95 transition-all"
              aria-label="Cerrar menú"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* 2. Acciones Rápidas */}
        <div className="grid grid-cols-2 gap-2 p-3 border-b border-border/40">
          <Link
            href="/ot/nueva"
            onClick={onCerrar}
            className="flex min-h-10 items-center justify-center gap-1.5 rounded-xl bg-accent px-2 text-xs font-bold text-white shadow-sm transition-all hover:brightness-105 active:scale-95"
          >
            <Plus className="h-3.5 w-3.5 stroke-[3]" />
            <span className="truncate">Nueva OT</span>
          </Link>
          <Link
            href="/presupuestos/nueva"
            onClick={onCerrar}
            className="flex min-h-10 items-center justify-center gap-1.5 rounded-xl border border-accent/30 bg-accent/10 px-2 text-xs font-bold text-accent transition-all hover:bg-accent/20 active:scale-95"
          >
            <Sparkles className="h-3.5 w-3.5" />
            <span className="truncate">Presupuesto</span>
          </Link>
        </div>

        {/* 3. Lista de Rutas */}
        <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-3 overscroll-contain">
          <p className="px-2 pb-1 text-[10px] font-black uppercase tracking-wider text-muted-foreground/70">
            Operaciones del Taller
          </p>
          {itemsVisibles(ITEMS_NAV, rol, vistasPermitidas).map((item) => {
            const activo = esRutaActiva(pathname, item.href);
            const Icono = item.icono;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onCerrar}
                className={`group flex min-h-11 items-center gap-3 rounded-xl px-3 text-xs font-bold transition-all active:scale-95 ${
                  activo
                    ? "bg-accent/15 text-accent shadow-xs border border-accent/20"
                    : "text-muted-foreground hover:bg-muted/60 hover:text-foreground"
                }`}
              >
                <Icono
                  className={`h-4 w-4 shrink-0 transition-transform ${activo ? "text-accent" : "text-muted-foreground"}`}
                  strokeWidth={activo ? 2.5 : 2}
                />
                <span className="truncate flex-1">{item.etiqueta}</span>
                {item.ayuda && (
                  <span className="text-[10px] font-normal text-muted-foreground/60 truncate max-w-[80px]">
                    {item.ayuda}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* 4. Pie de usuario */}
        <div className="border-t border-border/60 bg-muted/20 p-3">
          {confirmandoLogout ? (
            <div className="rounded-xl border border-destructive/30 bg-destructive/10 p-2.5 text-center space-y-2 animate-in fade-in">
              <p className="text-xs font-bold text-destructive">¿Cerrar sesión?</p>
              <div className="flex items-center gap-1.5">
                <form action={cerrarSesion} className="flex-1">
                  <button
                    type="submit"
                    className="flex min-h-8 w-full items-center justify-center gap-1 rounded-lg bg-destructive text-xs font-bold text-white shadow-xs hover:brightness-105 active:scale-95"
                  >
                    <Check className="h-3.5 w-3.5" />
                    <span>Salir</span>
                  </button>
                </form>
                <button
                  type="button"
                  onClick={() => setConfirmandoLogout(false)}
                  className="flex min-h-8 flex-1 items-center justify-center gap-1 rounded-lg border border-border bg-card text-xs font-semibold text-foreground hover:bg-muted active:scale-95"
                >
                  <X className="h-3.5 w-3.5" />
                  <span>No</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-between gap-2 rounded-xl border border-border/60 bg-card/80 px-2.5 py-2">
              <div className="flex items-center gap-2 min-w-0">
                <span className="grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-zinc-800 text-xs font-bold text-white border border-white/10">
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
                className="grid h-7 w-7 shrink-0 place-items-center rounded-lg text-muted-foreground hover:bg-destructive/10 hover:text-destructive active:scale-95 transition-all"
              >
                <LogOut className="h-4 w-4" />
              </button>
            </div>
          )}
        </div>
      </aside>
    </div>
  );
}
