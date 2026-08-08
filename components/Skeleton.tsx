/**
 * Skeletons de carga.
 *
 * Dos reglas que hacen la diferencia entre que se sienta rápido y que se
 * sienta roto:
 *
 * 1. El skeleton tiene que tener la MISMA forma y el mismo alto que el
 *    contenido real. Si no, cuando llegan los datos todo salta y la pantalla
 *    se siente peor que si no hubiera habido nada.
 * 2. No se usa un spinner. Un spinner dice "esperá"; un skeleton dice "esto
 *    es lo que va a haber acá", y eso se percibe como más rápido aunque tarde
 *    exactamente lo mismo.
 *
 * Server Components a propósito: no necesitan JS en el cliente.
 */

export function Linea({ className = "" }: { className?: string }) {
  return <div className={`skeleton h-3 rounded-full ${className}`} />;
}

export function Bloque({ className = "" }: { className?: string }) {
  return <div className={`skeleton rounded-[var(--radius-md)] ${className}`} />;
}

/** Tarjeta de orden de trabajo: número, patente, estado y totales. */
export function TarjetaOTSkeleton() {
  return (
    <div className="space-y-3 rounded-[var(--radius-md)] bg-card p-4 shadow-sm">
      <div className="flex items-center justify-between">
        <Linea className="w-24" />
        <Linea className="w-16" />
      </div>
      <Linea className="h-5 w-32" />
      <div className="flex items-center gap-2">
        <Linea className="w-20" />
        <Linea className="w-14" />
      </div>
    </div>
  );
}

/** Fila de lista: avatar/icono + dos líneas + valor a la derecha. */
export function FilaSkeleton() {
  return (
    <div className="flex items-center gap-3 px-1 py-3">
      <Bloque className="h-10 w-10 shrink-0 rounded-full" />
      <div className="flex-1 space-y-2">
        <Linea className="w-2/5" />
        <Linea className="w-1/4" />
      </div>
      <Linea className="w-12" />
    </div>
  );
}

/**
 * Esqueleto de pantalla completa. Es lo que va en cada `loading.tsx`.
 *
 * El padding de arriba deja lugar a la isla y `scroll-inset` al chrome de
 * abajo, igual que las pantallas reales: si no, el contenido salta al cargar.
 */
export function PantallaSkeleton({
  seccion,
  titulo,
  variante = "tarjetas",
}: {
  seccion: string;
  titulo: string;
  variante?: "tarjetas" | "filas";
}) {
  return (
    <main className="flex-1 pt-[calc(var(--safe-top)+1.25rem)] pb-4 scroll-inset" aria-busy="true">
      {/* Mismo contenedor y mismo encabezado que la pantalla real: si el
          esqueleto tuviera otro ancho u otra altura de título, al llegar los
          datos todo se correría de lugar y se vería peor que sin esqueleto. */}
      <div className="contenedor space-y-5">
        <div className="space-y-0.5">
          <p className="t-seccion">{seccion}</p>
          {/* El título se muestra de verdad: ya se sabe cuál es, y verlo al
              instante es la mitad de la sensación de velocidad. */}
          <h1 className="t-pantalla text-foreground">{titulo}</h1>
        </div>
        <span className="sr-only">Cargando…</span>

        <Bloque className="h-12 w-full" />

        {variante === "tarjetas" ? (
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {Array.from({ length: 6 }, (_, i) => (
              <TarjetaOTSkeleton key={i} />
            ))}
          </div>
        ) : (
          <div className="grid gap-2.5 lg:grid-cols-2 xl:grid-cols-3">
            {Array.from({ length: 8 }, (_, i) => (
              <div key={i} className="tarjeta px-3">
                <FilaSkeleton />
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
