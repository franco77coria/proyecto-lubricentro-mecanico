"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutList, Plus } from "lucide-react";
import { useState } from "react";

import { HojaTodo } from "@/components/nav/HojaTodo";
import { esRutaActiva, ITEMS_BARRA, type ItemNav } from "@/lib/navegacion";

/**
 * Navegación de celular.
 *
 * Vive abajo, al alcance del pulgar, y desaparece en escritorio (a partir de
 * lg manda el sidebar). Nunca se superpone con la isla, que va arriba: son dos
 * superficies translúcidas claras y una encima de la otra arruina la
 * legibilidad de las dos.
 *
 * 5 botones principales ergonómicos (3 atajos directos + Nueva OT + Más)
 * con dimensiones mínimas táctiles de 48px (min-h-12 min-w-12) optimizados
 * para pantallas desde 360px sin colisión ni desbordes.
 */
export function BarraInferior({
  rol,
  vistasPermitidas,
}: {
  rol?: string;
  vistasPermitidas?: string[] | null;
}) {
  const pathname = usePathname();
  const [hojaAbierta, setHojaAbierta] = useState(false);

  // Los atajos van dos a la izquierda y uno a la derecha del botón central "Nueva OT",
  // completando junto con "Más" exactamente 5 botones principales ergonómicos.
  const izquierda = ITEMS_BARRA.slice(0, 2);
  const derecha = ITEMS_BARRA.slice(2);

  return (
    <>
      <HojaTodo
        abierto={hojaAbierta}
        onCerrar={() => setHojaAbierta(false)}
        rol={rol}
        vistasPermitidas={vistasPermitidas}
      />

      <nav
        aria-label="Navegación principal"
        className="fixed inset-x-0 bottom-0 z-40 flex justify-center px-2 sm:px-3 pb-[calc(var(--safe-bottom)+0.75rem)] lg:hidden"
      >
        <div className="material material-thick backdrop-blur-2xl backdrop-saturate-150 sin-transparencia:backdrop-blur-none flex w-full max-w-[26rem] items-center justify-between gap-1 rounded-[var(--radius-lg)] p-1.5 shadow-lg">
          {izquierda.map((item) => (
            <ItemBarra key={item.href} item={item} activo={esRutaActiva(pathname, item.href)} />
          ))}

          <Link
            href="/ot/nueva"
            aria-label="Nueva orden"
            className="flex min-h-12 min-w-12 flex-1 max-w-[4.75rem] flex-col items-center justify-center gap-0.5 rounded-[var(--radius-md)] bg-accent px-1 py-1.5 text-accent-foreground shadow-[var(--sombra-media)] transition-transform active:scale-95 touch-manipulation shrink-0"
          >
            <Plus className="h-5 w-5" strokeWidth={2.5} aria-hidden />
            <span className="text-[0.625rem] font-bold tracking-wide truncate max-w-full">Nueva OT</span>
          </Link>

          {derecha.map((item) => (
            <ItemBarra key={item.href} item={item} activo={esRutaActiva(pathname, item.href)} />
          ))}

          <button
            type="button"
            onClick={() => setHojaAbierta(true)}
            aria-expanded={hojaAbierta}
            aria-label="Ver todas las pantallas"
            className="flex min-h-12 min-w-12 flex-1 max-w-[4.25rem] flex-col items-center justify-center gap-0.5 rounded-[var(--radius-md)] px-1 py-1.5 text-muted-foreground transition-transform active:scale-95 touch-manipulation shrink-0"
          >
            <LayoutList className="h-5 w-5" aria-hidden />
            <span className="text-[0.625rem] font-medium tracking-wide truncate max-w-full">Más</span>
          </button>
        </div>
      </nav>
    </>
  );
}

function ItemBarra({ item, activo }: { item: ItemNav; activo: boolean }) {
  const Icono = item.icono;
  return (
    <Link
      href={item.href}
      aria-current={activo ? "page" : undefined}
      className={`flex min-h-12 min-w-12 flex-1 max-w-[4.25rem] flex-col items-center justify-center gap-0.5 rounded-[var(--radius-md)] px-1 py-1.5 transition-transform active:scale-95 touch-manipulation shrink-0 ${
        activo ? "text-accent font-semibold" : "text-muted-foreground hover:text-foreground font-medium"
      }`}
    >
      <Icono className="h-5 w-5" strokeWidth={activo ? 2.5 : 2} aria-hidden />
      <span className={`text-[0.625rem] tracking-wide truncate max-w-full ${activo ? "font-bold" : "font-medium"}`}>
        {item.etiqueta}
      </span>
    </Link>
  );
}

