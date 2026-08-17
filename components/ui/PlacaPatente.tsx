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

  const esMercosurAR = formato === "auto_mercosur" || formato === "moto_mercosur";
  const esMercosurBR = formato === "br_mercosur" || formato === "br_moto_mercosur";
  const esViejo = formato === "auto_viejo" || formato === "moto_vieja" || formato === "br_antigua";
  const esEspanaUE = formato === "es_actual" || formato === "es_provincial";
  const esChile = formato === "cl_nuevo" || formato === "cl_antiguo";
  const esColombia = formato === "co_moto";

  const sizeClasses = {
    sm: "px-2 py-0.5 text-[11px] rounded-md min-w-[70px]",
    md: "px-3 py-1 text-sm rounded-lg min-w-[100px]",
    lg: "px-4 py-1.5 text-lg rounded-xl min-w-[140px]",
  };

  // 1. Mercosur Argentina
  if (esMercosurAR) {
    return (
      <div
        className={cn(
          "inline-flex flex-col items-center justify-center border-2 border-zinc-900 bg-white font-black shadow-sm select-none",
          sizeClasses[size],
          className,
        )}
        style={{ letterSpacing: "0.12em" }}
      >
        <div className="flex w-full items-center justify-between bg-[#003399] px-1.5 py-[1px] text-[7px] font-bold tracking-widest text-white">
          <span className="opacity-90">MERCOSUR</span>
          <span className="text-[6px] uppercase font-extrabold tracking-wider">REPÚBLICA ARGENTINA</span>
          <span className="h-1.5 w-2 rounded-[1px] bg-amber-400 opacity-90 inline-block" />
        </div>
        <span className="text-display pt-0.5 font-black text-zinc-950">
          {textoFormateado}
        </span>
      </div>
    );
  }

  // 2. Mercosul Brasil
  if (esMercosurBR) {
    return (
      <div
        className={cn(
          "inline-flex flex-col items-center justify-center border-2 border-zinc-900 bg-white font-black shadow-sm select-none",
          sizeClasses[size],
          className,
        )}
        style={{ letterSpacing: "0.12em" }}
      >
        <div className="flex w-full items-center justify-between bg-[#003399] px-1.5 py-[1px] text-[7px] font-bold tracking-widest text-white">
          <span className="opacity-90">MERCOSUL</span>
          <span className="text-[7px] uppercase font-extrabold tracking-wider">BRASIL</span>
          <span className="text-[8px]">🇧🇷</span>
        </div>
        <span className="text-display pt-0.5 font-black text-zinc-950">
          {textoFormateado}
        </span>
      </div>
    );
  }

  // 3. España / Unión Europea (Eurobanda)
  if (esEspanaUE) {
    return (
      <div
        className={cn(
          "inline-flex items-stretch border-2 border-zinc-900 bg-white font-black shadow-sm select-none overflow-hidden",
          sizeClasses[size],
          className,
        )}
        style={{ letterSpacing: "0.15em" }}
      >
        <div className="bg-[#003399] px-1.5 flex flex-col items-center justify-center text-white mr-2 -ml-2 sm:-ml-3 my-[-6px]">
          <span className="text-[8px] text-amber-300">★</span>
          <span className="text-[9px] font-black leading-none">E</span>
        </div>
        <span className="text-display font-black text-zinc-950 self-center">
          {textoFormateado}
        </span>
      </div>
    );
  }

  // 4. Colombia (Fondo amarillo reflectivo)
  if (esColombia) {
    return (
      <div
        className={cn(
          "inline-flex flex-col items-center justify-center border-2 border-zinc-950 bg-[#FACC15] font-black text-zinc-950 shadow-sm select-none",
          sizeClasses[size],
          className,
        )}
        style={{ letterSpacing: "0.15em" }}
      >
        <span className="text-display font-black tracking-wider">
          {textoFormateado}
        </span>
        <span className="text-[6px] font-black uppercase tracking-widest opacity-80 -mt-0.5">COLOMBIA</span>
      </div>
    );
  }

  // 5. Chile (Blanca con ribete azul)
  if (esChile) {
    return (
      <div
        className={cn(
          "inline-flex flex-col items-center justify-center border-2 border-blue-900 bg-white font-black text-blue-950 shadow-sm select-none",
          sizeClasses[size],
          className,
        )}
        style={{ letterSpacing: "0.12em" }}
      >
        <span className="text-display font-black">
          {textoFormateado}
        </span>
        <span className="text-[6px] font-black uppercase tracking-widest text-blue-900 opacity-80 -mt-0.5">CHILE</span>
      </div>
    );
  }

  // 6. Formato Antiguo / Clásico
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

  // 7. Fallback / Internacional
  return (
    <div
      className={cn(
        "inline-flex items-center justify-center border-2 border-border bg-card font-mono font-black uppercase text-foreground shadow-sm",
        sizeClasses[size],
        className,
      )}
    >
      {textoFormateado}
    </div>
  );
}
