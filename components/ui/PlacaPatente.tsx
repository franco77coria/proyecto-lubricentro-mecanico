import { cn } from "@/lib/utils";
import { detectarFormato, formatearPatente } from "@/lib/patente";

interface PlacaPatenteProps {
  patente: string;
  className?: string;
  size?: "sm" | "md" | "lg";
}

export function PlacaPatente({ patente, className, size = "md" }: PlacaPatenteProps) {
  const formato = detectarFormato(patente);
  const textoFormateado = formatearPatente(patente);
  const esMercosur = formato === "auto_mercosur" || formato === "moto_mercosur";
  const esViejo = formato === "auto_viejo" || formato === "moto_vieja";

  const sizeClasses = {
    sm: "px-2 py-0.5 text-xs rounded-md min-w-[70px]",
    md: "px-3 py-1 text-sm rounded-lg min-w-[100px]",
    lg: "px-4 py-1.5 text-lg rounded-xl min-w-[140px]",
  };

  if (esMercosur) {
    return (
      <div
        className={cn(
          "inline-flex flex-col items-center justify-center border-2 border-zinc-900 bg-white font-black shadow-sm select-none",
          sizeClasses[size],
          className,
        )}
        style={{ letterSpacing: "0.12em" }}
      >
        {/* Banda Azul Mercosur */}
        <div className="flex w-full items-center justify-between bg-[#003399] px-1.5 py-[1px] text-[8px] font-bold tracking-widest text-white">
          <span className="opacity-90">MERCOSUR</span>
          <span className="text-[7px] uppercase font-extrabold tracking-wider">REPÚBLICA ARGENTINA</span>
          <span className="h-1.5 w-2 rounded-[1px] bg-amber-400 opacity-90 inline-block" />
        </div>
        {/* Caracteres de la chapa */}
        <span className="text-display pt-0.5 font-black text-zinc-950">
          {textoFormateado}
        </span>
      </div>
    );
  }

  if (esViejo) {
    return (
      <div
        className={cn(
          "inline-flex flex-col items-center justify-center border-2 border-zinc-400 bg-zinc-950 font-black text-zinc-100 shadow-sm select-none",
          sizeClasses[size],
          className,
        )}
        style={{ letterSpacing: "0.15em" }}
      >
        <span className="text-display font-black tracking-widest">
          {textoFormateado}
        </span>
      </div>
    );
  }

  // Fallback para otros formatos
  return (
    <div
      className={cn(
        "inline-flex items-center justify-center border border-border bg-card font-mono font-bold uppercase text-foreground shadow-sm",
        sizeClasses[size],
        className,
      )}
    >
      {textoFormateado}
    </div>
  );
}
