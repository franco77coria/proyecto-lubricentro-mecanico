"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Plus } from "lucide-react";

import { esRutaActiva, itemsVisibles, ITEMS_BARRA } from "@/lib/navegacion";

/**
 * Navegación de celular.
 *
 * Vive abajo, al alcance del pulgar, y desaparece en escritorio (a partir de
 * lg manda el sidebar). Nunca se superpone con la isla, que va arriba: son dos
 * superficies translúcidas claras y una encima de la otra arruina la
 * legibilidad de las dos.
 *
 * El botón central es la acción que más se repite en un taller —abrir una
 * orden— y por eso está separado del resto, en el acento y más grande.
 */
export function BarraInferior({ rol }: { rol?: string }) {
  const pathname = usePathname();
  const items = itemsVisibles(ITEMS_BARRA, rol ?? "");
  const mitad = Math.ceil(items.length / 2);

  return (
    <nav
      aria-label="Navegación principal"
      className="fixed inset-x-0 bottom-0 z-40 flex justify-center px-3 pb-[calc(var(--safe-bottom)+0.75rem)] lg:hidden"
    >
      <div className="material material-thick backdrop-blur-2xl backdrop-saturate-150 sin-transparencia:backdrop-blur-none flex w-full max-w-[26rem] items-center justify-around gap-1 rounded-[var(--radius-lg)] px-2 py-2">
        {items.slice(0, mitad).map((item) => (
          <ItemBarra key={item.href} item={item} activo={esRutaActiva(pathname, item.href)} />
        ))}

        <Link
          href="/ot/nueva"
          aria-label="Nueva orden"
          className="flex min-h-12 min-w-12 flex-col items-center justify-center gap-0.5 rounded-[var(--radius-md)] bg-accent px-3 py-1.5 text-accent-foreground shadow-[var(--sombra-media)] transition-transform active:scale-95"
        >
          <Plus className="h-5 w-5" strokeWidth={2.5} aria-hidden />
          <span className="text-[0.625rem] font-semibold tracking-wide">Nueva OT</span>
        </Link>

        {items.slice(mitad).map((item) => (
          <ItemBarra key={item.href} item={item} activo={esRutaActiva(pathname, item.href)} />
        ))}
      </div>
    </nav>
  );
}

function ItemBarra({
  item,
  activo,
}: {
  item: (typeof ITEMS_BARRA)[number];
  activo: boolean;
}) {
  const Icono = item.icono;
  return (
    <Link
      href={item.href}
      aria-current={activo ? "page" : undefined}
      className={`flex min-h-12 min-w-12 flex-col items-center justify-center gap-0.5 rounded-[var(--radius-md)] px-2 py-1.5 transition-transform active:scale-95 ${
        activo ? "text-accent" : "text-muted-foreground"
      }`}
    >
      <Icono className="h-5 w-5" strokeWidth={activo ? 2.5 : 2} aria-hidden />
      <span className={`text-[0.625rem] tracking-wide ${activo ? "font-semibold" : "font-medium"}`}>
        {item.etiqueta}
      </span>
    </Link>
  );
}
