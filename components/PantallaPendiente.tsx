/**
 * Placeholder de una pantalla todavía no construida.
 *
 * Existe para que la navegación completa se pueda recorrer desde el primer
 * día: es la única forma de detectar temprano si el chrome tapa contenido,
 * si las transiciones se sienten lentas o si falta una salida en algún lado.
 * Cada una se reemplaza por la pantalla real en su fase.
 */
export function PantallaPendiente({ titulo, descripcion }: { titulo: string; descripcion: string }) {
  return (
    <main className="flex-1 px-4 pt-[calc(var(--safe-top)+4.5rem)] scroll-inset">
      <div className="mx-auto max-w-[26rem] space-y-3">
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">{titulo}</h1>
        <p className="text-sm text-muted-foreground">{descripcion}</p>
      </div>
    </main>
  );
}
