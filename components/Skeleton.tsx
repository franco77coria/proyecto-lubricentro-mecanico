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
  titulo,
  variante = "tarjetas",
}: {
  titulo: string;
  variante?: "tarjetas" | "filas";
}) {
  return (
    <main className="flex-1 px-4 pt-[calc(var(--safe-top)+4.5rem)] scroll-inset" aria-busy="true">
      <div className="mx-auto max-w-[26rem] space-y-4">
        {/* El título se muestra de verdad: ya se sabe, y ver el nombre de la
            pantalla al instante es la mitad de la sensación de velocidad. */}
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">{titulo}</h1>
        <span className="sr-only">Cargando…</span>

        {variante === "tarjetas" ? (
          <div className="space-y-3">
            <TarjetaOTSkeleton />
            <TarjetaOTSkeleton />
            <TarjetaOTSkeleton />
          </div>
        ) : (
          <div className="divide-y divide-border rounded-[var(--radius-md)] bg-card px-3">
            {Array.from({ length: 6 }, (_, i) => (
              <FilaSkeleton key={i} />
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
