"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Car, LayoutGrid, type LucideIcon, Package, Plus, Settings } from "lucide-react";

/**
 * Navegación principal en móvil.
 *
 * Vive SIEMPRE abajo; la isla vive arriba. No se superponen nunca: son dos
 * superficies translúcidas claras y apilarlas arruina la legibilidad de las dos.
 *
 * Las etiquetas son concretas a propósito. "Inicio" o "Más" no dicen qué hay
 * del otro lado; "Tablero" y "Ajustes" sí, y eso es lo que hace que la
 * navegación sea predecible.
 */
interface ItemNav {
  href: string;
  etiqueta: string;
  icono: LucideIcon;
  destacado?: boolean;
}

const ITEMS: readonly ItemNav[] = [
  { href: "/tablero", etiqueta: "Tablero", icono: LayoutGrid },
  { href: "/vehiculos", etiqueta: "Autos", icono: Car },
  { href: "/ot/nueva", etiqueta: "Nueva OT", icono: Plus, destacado: true },
  { href: "/stock", etiqueta: "Stock", icono: Package },
  { href: "/config", etiqueta: "Ajustes", icono: Settings },
];

export function BarraInferior() {
  const pathname = usePathname();

  return (
    <nav
      aria-label="Navegación principal"
      className="fixed inset-x-0 bottom-0 z-40 flex justify-center px-3 pb-[calc(var(--safe-bottom)+0.75rem)]"
    >
      <div className="material material-thick backdrop-blur-2xl backdrop-saturate-150 sin-transparencia:backdrop-blur-none flex w-full max-w-[26rem] items-center justify-around gap-1 rounded-[var(--radius-lg)] px-2 py-2">
        {ITEMS.map((item) => {
          const activo = pathname === item.href || pathname.startsWith(`${item.href}/`);
          const Icono = item.icono;

          if (item.destacado) {
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-label={item.etiqueta}
                className="flex min-h-12 min-w-12 flex-col items-center justify-center gap-0.5 rounded-[var(--radius-md)] bg-accent px-3 py-1.5 text-accent-foreground transition-transform active:scale-95"
              >
                <Icono className="h-5 w-5" strokeWidth={2.5} aria-hidden />
                <span className="text-[0.625rem] font-semibold tracking-wide">
                  {item.etiqueta}
                </span>
              </Link>
            );
          }

          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={activo ? "page" : undefined}
              className={`flex min-h-12 min-w-12 flex-col items-center justify-center gap-0.5 rounded-[var(--radius-md)] px-2 py-1.5 transition-transform active:scale-95 ${
                activo ? "text-accent" : "text-muted-foreground"
              }`}
            >
              <Icono className="h-5 w-5" strokeWidth={activo ? 2.5 : 2} aria-hidden />
              <span
                className={`text-[0.625rem] tracking-wide ${
                  activo ? "font-semibold" : "font-medium"
                }`}
              >
                {item.etiqueta}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
