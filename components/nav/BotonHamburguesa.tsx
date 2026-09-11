"use client";

export interface BotonHamburguesaProps {
  activo: boolean;
  onClick: () => void;
  ariaLabel?: string;
  className?: string;
}

/**
 * Botón con icono animado: 3 barras horizontales (hamburguesa)
 * que rotan y se funden en una 'X' perfecta cuando está activo.
 */
export function BotonHamburguesa({
  activo,
  onClick,
  ariaLabel,
  className = "",
}: BotonHamburguesaProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-expanded={activo}
      aria-label={ariaLabel || (activo ? "Ocultar menú lateral" : "Mostrar menú lateral")}
      title={ariaLabel || (activo ? "Ocultar menú lateral" : "Mostrar menú lateral")}
      className={`group relative flex h-8 w-8 items-center justify-center rounded-xl border border-border/70 bg-card/80 text-muted-foreground hover:bg-muted hover:text-foreground active:scale-95 transition-all shadow-xs ${className}`}
    >
      <span className="relative flex h-3.5 w-3.5 flex-col items-center justify-center gap-[3px]" aria-hidden="true">
        <span
          className={`block h-[1.75px] w-[15px] rounded-full bg-current transition-all duration-300 origin-center ${
            activo ? "translate-y-[4.75px] rotate-45" : ""
          }`}
        />
        <span
          className={`block h-[1.75px] w-[15px] rounded-full bg-current transition-all duration-300 ${
            activo ? "opacity-0 scale-x-0" : ""
          }`}
        />
        <span
          className={`block h-[1.75px] w-[15px] rounded-full bg-current transition-all duration-300 origin-center ${
            activo ? "-translate-y-[4.75px] -rotate-45" : ""
          }`}
        />
      </span>
    </button>
  );
}
