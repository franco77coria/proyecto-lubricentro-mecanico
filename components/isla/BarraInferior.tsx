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
 * Cuatro atajos + la acción principal + "Más". Los cuatro son SIEMPRE los
 * mismos, sin importar el rol: una barra que cambia de forma según quién entró
 * rompe la memoria muscular, que es lo único que hace rápida una navegación de
 * cien usos por día.
 *
 * "Más" no es un cajón de sastre — es la única puerta a las otras seis
 * pantallas desde un teléfono. Antes esas seis no tenían ninguna: el sidebar
 * que las lista se oculta por debajo de `lg`, así que en celular no existían.
 */
export function BarraInferior({ rol }: { rol?: string }) {
  const pathname = usePathname();
  const [hojaAbierta, setHojaAbierta] = useState(false);

  // Los atajos van dos a cada lado del botón central. Con cuatro fijos el
  // reparto es estable y no depende del rol.
  const izquierda = ITEMS_BARRA.slice(0, 2);
  const derecha = ITEMS_BARRA.slice(2);

  return (
    <>
      <HojaTodo abierto={hojaAbierta} onCerrar={() => setHojaAbierta(false)} rol={rol} />

      <nav
        aria-label="Navegación principal"
        className="fixed inset-x-0 bottom-0 z-40 flex justify-center px-3 pb-[calc(var(--safe-bottom)+0.75rem)] lg:hidden"
      >
        <div className="material material-thick backdrop-blur-2xl backdrop-saturate-150 sin-transparencia:backdrop-blur-none flex w-full max-w-[26rem] items-center justify-around gap-0.5 rounded-[var(--radius-lg)] px-1.5 py-2">
          {izquierda.map((item) => (
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

          {derecha.map((item) => (
            <ItemBarra key={item.href} item={item} activo={esRutaActiva(pathname, item.href)} />
          ))}

          <button
            type="button"
            onClick={() => setHojaAbierta(true)}
            aria-expanded={hojaAbierta}
            aria-label="Ver todas las pantallas"
            className="flex min-h-12 min-w-12 flex-col items-center justify-center gap-0.5 rounded-[var(--radius-md)] px-2 py-1.5 text-muted-foreground transition-transform active:scale-95"
          >
            <LayoutList className="h-5 w-5" aria-hidden />
            <span className="text-[0.625rem] font-medium tracking-wide">Más</span>
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
