"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronRight } from "lucide-react";

import { SelectorTema } from "@/components/ui/SelectorTema";
import { Sheet } from "@/components/sheet/Sheet";
import { esRutaActiva, gruposVisibles, NOMBRE_GRUPO } from "@/lib/navegacion";

/**
 * Todas las pantallas, desde el celular.
 */
export function HojaTodo({
  abierto,
  onCerrar,
  rol,
  vistasPermitidas,
}: {
  abierto: boolean;
  onCerrar: () => void;
  rol?: string;
  vistasPermitidas?: string[] | null;
}) {
  const pathname = usePathname();
  const grupos = gruposVisibles(rol ?? "", vistasPermitidas);

  return (
    <Sheet abierto={abierto} onCerrar={onCerrar} titulo="Todo el taller">
      <div className="space-y-5 pb-4">
        {/* Selector de Apariencia */}
        <div className="flex items-center justify-between rounded-2xl border border-border/80 bg-card p-3.5 shadow-sm">
          <div className="space-y-0.5">
            <span className="text-xs font-black text-foreground">Tema Visual</span>
            <span className="block text-[11px] text-muted-foreground">Alternar modo oscuro / claro</span>
          </div>
          <SelectorTema />
        </div>

        {grupos.map(({ grupo, items }) => (
          <section key={grupo} className="space-y-1.5">
            <h3 className="px-1 text-caption font-bold uppercase tracking-wider text-muted-foreground">
              {NOMBRE_GRUPO[grupo]}
            </h3>

            <ul className="overflow-hidden rounded-[var(--radius-md)] border border-border bg-card">
              {items.map((item, i) => {
                const Icono = item.icono;
                const activo = esRutaActiva(pathname, item.href);
                return (
                  <li key={item.href} className={i > 0 ? "border-t border-border" : ""}>
                    <Link
                      href={item.href}
                      onClick={onCerrar}
                      aria-current={activo ? "page" : undefined}
                      className={`flex min-h-14 items-center gap-3 px-3.5 transition-colors active:bg-muted ${
                        activo ? "bg-accent-suave" : ""
                      }`}
                    >
                      <span
                        className={`grid h-10 w-10 shrink-0 place-items-center rounded-[var(--radius-sm)] ${
                          activo ? "bg-accent text-accent-foreground" : "bg-muted text-muted-foreground"
                        }`}
                      >
                        <Icono className="h-5 w-5" strokeWidth={activo ? 2.5 : 2} aria-hidden />
                      </span>

                      <span className="min-w-0 flex-1">
                        <span
                          className={`block truncate text-sm ${
                            activo ? "font-bold text-accent" : "font-semibold text-foreground"
                          }`}
                        >
                          {item.etiqueta}
                        </span>
                        {item.ayuda && (
                          <span className="block truncate text-caption text-muted-foreground">
                            {item.ayuda}
                          </span>
                        )}
                      </span>

                      <ChevronRight
                        className="h-4 w-4 shrink-0 text-muted-foreground"
                        aria-hidden
                      />
                    </Link>
                  </li>
                );
              })}
            </ul>
          </section>
        ))}
      </div>
    </Sheet>
  );
}
