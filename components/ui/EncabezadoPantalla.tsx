import { Search } from "lucide-react";

/**
 * Encabezado común de las pantallas de lista.
 *
 * Existe para que el título, el aire y la ubicación de la acción principal
 * sean idénticos en todas: cuando cada pantalla arma su propio encabezado, la
 * altura del título cambia unos píxeles entre una y otra y al navegar se nota
 * como un salto.
 */
export function EncabezadoPantalla({
  seccion,
  titulo,
  accion,
}: {
  seccion: string;
  titulo: string;
  accion?: React.ReactNode;
}) {
  return (
    <header className="entrar flex flex-wrap items-end justify-between gap-3">
      <div className="space-y-0.5">
        <p className="t-seccion">{seccion}</p>
        <h1 className="t-pantalla text-foreground">{titulo}</h1>
      </div>
      {accion}
    </header>
  );
}

/**
 * Buscador por querystring.
 *
 * Es un form GET y no un input controlado a propósito: funciona sin JS, deja
 * la búsqueda en la URL (se puede compartir y volver con el botón atrás) y no
 * necesita que la pantalla sea Client Component.
 */
export function Buscador({
  valor,
  placeholder,
}: {
  valor?: string;
  placeholder: string;
}) {
  return (
    <form method="GET" className="entrar relative" style={{ "--i": 1 } as React.CSSProperties}>
      <Search
        className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
        aria-hidden
      />
      <input
        type="search"
        name="q"
        defaultValue={valor ?? ""}
        placeholder={placeholder}
        aria-label={placeholder}
        // 16px de fuente: por debajo, iOS hace zoom al enfocar y descoloca todo.
        className="min-h-12 w-full rounded-[var(--radius-sm)] border border-border bg-card pl-10 pr-4 text-base text-foreground shadow-[var(--sombra-sutil)] outline-none transition-shadow placeholder:text-muted-foreground focus:border-accent focus:shadow-[0_0_0_3px_color-mix(in_srgb,var(--accent)_18%,transparent)]"
      />
    </form>
  );
}
