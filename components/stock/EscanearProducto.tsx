"use client";

import { ScanBarcode } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { LectorCodigo } from "@/components/campos/LectorCodigo";
import { FORMATOS_PRODUCTO } from "@/lib/codigo";

/**
 * Escanear un producto del estante.
 *
 * Deja el código en el buscador de la pantalla (`?q=`) en vez de abrir una
 * pantalla propia. Dos ventajas concretas:
 *   - Si el producto está, queda solo en la lista con sus botones de sumar y
 *     restar stock al lado: el gesto que sigue después de escanear un bidón.
 *   - Si no está, se ve el mismo vacío que en cualquier búsqueda, con el código
 *     ya escrito para copiarlo al alta.
 *
 * El código también queda en la URL, así que se puede compartir o recargar.
 */
export function EscanearProducto() {
  const router = useRouter();
  const [abierto, setAbierto] = useState(false);

  return (
    <>
      {abierto && (
        <LectorCodigo
          titulo="Escanear producto"
          ayuda="Apuntá al código de barras del bidón, la caja del filtro o la etiqueta del estante."
          formatos={FORMATOS_PRODUCTO}
          onLeido={(codigo) => {
            setAbierto(false);
            router.push(`/stock?q=${encodeURIComponent(codigo)}`);
          }}
          onCerrar={() => setAbierto(false)}
        />
      )}

      <button
        type="button"
        onClick={() => setAbierto(true)}
        className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-muted px-4 text-xs font-bold text-foreground transition-transform active:scale-95"
      >
        <ScanBarcode className="h-4 w-4 text-accent" aria-hidden />
        <span>Escanear</span>
      </button>
    </>
  );
}
