"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LogOut, Plus, Wrench } from "lucide-react";

import { esRutaActiva, ITEMS_NAV } from "@/lib/navegacion";
import { cerrarSesion } from "@/lib/actions/auth";

export interface SidebarProps {
  taller: string;
  usuario: string;
  rol: string;
}

const NOMBRE_ROL: Record<string, string> = {
  dueno: "Dueño",
  mostrador: "Mostrador",
  mecanico: "Mecánico",
};

/**
 * Navegación de escritorio.
 *
 * Existe porque la app estaba hecha como una columna de celular estirada: en
 * un monitor quedaban dos tercios de pantalla en blanco y la navegación
 * flotaba abajo, lejos del cursor. Acá la navegación es permanente y el
 * contenido usa el ancho que hay.
 *
 * Se oculta por debajo de lg, donde manda la barra inferior.
 */
export function Sidebar({ taller, usuario, rol }: SidebarProps) {
  const pathname = usePathname();

  return (
    <aside className="fixed inset-y-0 left-0 z-30 hidden w-[var(--sidebar-ancho)] flex-col border-r border-border bg-card lg:flex">
      <div className="flex items-center gap-2.5 px-5 py-5">
        <span className="grid h-9 w-9 place-items-center rounded-[var(--radius-sm)] bg-accent text-accent-foreground">
          <Wrench className="h-4.5 w-4.5" aria-hidden />
        </span>
        <span className="min-w-0">
          <span className="block truncate text-sm font-semibold text-foreground">{taller}</span>
          <span className="block text-[0.6875rem] text-muted-foreground">Gestión de taller</span>
        </span>
      </div>

      <div className="px-3 pb-3">
        <Link
          href="/ot/nueva"
          className="flex min-h-11 items-center justify-center gap-2 rounded-[var(--radius-sm)] bg-accent text-sm font-semibold text-accent-foreground shadow-[var(--sombra-sutil)] transition-transform hover:brightness-110 active:scale-[0.98]"
        >
          <Plus className="h-4 w-4" strokeWidth={2.5} aria-hidden />
          Nueva orden
        </Link>
      </div>

      <nav aria-label="Navegación principal" className="flex-1 space-y-0.5 px-3">
        {ITEMS_NAV.filter((i) => !i.soloDueno || rol === "dueno").map((item) => {
          const activo = esRutaActiva(pathname, item.href);
          const Icono = item.icono;
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={activo ? "page" : undefined}
              className={`flex min-h-10 items-center gap-3 rounded-[var(--radius-sm)] px-3 text-sm transition-colors ${
                activo
                  ? "bg-accent-suave font-semibold text-accent"
                  : "font-medium text-muted-foreground hover:bg-muted hover:text-foreground"
              }`}
            >
              <Icono className="h-4.5 w-4.5 shrink-0" strokeWidth={activo ? 2.4 : 2} aria-hidden />
              {item.etiqueta}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-border p-3">
        <div className="flex items-center gap-2.5 px-2 py-1.5">
          <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-muted text-xs font-bold text-foreground">
            {(usuario || "?").slice(0, 2).toUpperCase()}
          </span>
          <span className="min-w-0 flex-1">
            <span className="block truncate text-sm font-medium text-foreground">
              {usuario || "Sin nombre"}
            </span>
            <span className="block text-[0.6875rem] text-muted-foreground">
              {NOMBRE_ROL[rol] ?? rol}
            </span>
          </span>
        </div>
        <form action={cerrarSesion}>
          <button
            type="submit"
            className="mt-1 flex min-h-10 w-full items-center gap-3 rounded-[var(--radius-sm)] px-3 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-destructive"
          >
            <LogOut className="h-4.5 w-4.5" aria-hidden />
            Cerrar sesión
          </button>
        </form>
      </div>
    </aside>
  );
}
