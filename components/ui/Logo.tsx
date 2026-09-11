import { SVGProps } from "react";

export interface LogoProps extends SVGProps<SVGSVGElement> {
  size?: "xs" | "sm" | "md" | "lg" | "xl";
  conContenedor?: boolean;
  conTexto?: boolean;
  textoClase?: string;
}

const TAMANOS = {
  xs: 20,
  sm: 26,
  md: 34,
  lg: 44,
  xl: 56,
};

/**
 * Logotipo oficial de Fierros: Llave de tuercas técnica combinada (boca abierta y corona estriada)
 * con diseño facetado, alma rebajada y acabado automotriz de alta precisión.
 */
export function LogoIcono({
  size = "md",
  conContenedor = false,
  className = "",
  ...props
}: Omit<LogoProps, "conTexto" | "textoClase">) {
  const px = typeof size === "number" ? size : TAMANOS[size] || 34;

  const svg = (
    <svg
      width={px}
      height={px}
      viewBox="0 0 48 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`shrink-0 transition-transform ${className}`}
      {...props}
    >
      <defs>
        {/* Gradiente principal Naranja Carrera Automotriz */}
        <linearGradient id="fierros-orange-grad" x1="6" y1="42" x2="42" y2="6" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#ea580c" />
          <stop offset="45%" stopColor="#f97316" />
          <stop offset="100%" stopColor="#fb923c" />
        </linearGradient>

        {/* Gradiente de brillo superior metálico */}
        <linearGradient id="fierros-glow-grad" x1="12" y1="12" x2="38" y2="38" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#fed7aa" stopOpacity="0.8" />
          <stop offset="100%" stopColor="#ea580c" stopOpacity="0.1" />
        </linearGradient>

        {/* Sombra de profundidad en el alma de la llave */}
        <linearGradient id="fierros-groove-grad" x1="14" y1="34" x2="34" y2="14" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#9a3412" />
          <stop offset="100%" stopColor="#c2410c" />
        </linearGradient>
      </defs>

      {/* ── Cuerpo y Bocas de la Llave Mecánica ── */}
      {/* Silueta continua de llave combinada inclinada a 45° */}
      <path
        d="M34.2 6.5
           C32.1 4.9 29.3 4.5 27.0 5.4
           C25.4 6.0 24.1 7.2 23.3 8.7
           L22.8 9.6
           C21.8 11.4 22.2 13.6 23.7 15.0
           L24.8 16.0
           L16.2 24.6
           L15.1 23.5
           C13.7 22.0 11.5 21.6 9.7 22.6
           L8.8 23.1
           C6.2 24.5 4.5 27.2 4.6 30.2
           C4.7 33.2 6.6 35.8 9.5 37.0
           C12.4 38.1 15.8 37.4 17.9 35.3
           C19.7 33.5 20.4 31.0 19.8 28.6
           L20.8 27.6
           L29.4 19.0
           L30.5 20.1
           C32.0 21.5 34.2 21.9 36.0 20.9
           L36.9 20.4
           C39.4 19.0 41.2 16.4 41.4 13.5
           C41.5 10.6 40.0 7.8 37.3 6.6
           C36.3 6.1 35.2 5.8 34.2 6.5Z"
        fill="url(#fierros-orange-grad)"
      />

      {/* Vaciado de la Boca Abierta (Garras de precisión con ángulo hexagonal de 15°) */}
      <path
        d="M36.5 7.8
           L31.8 12.5
           L33.2 15.0
           L30.8 15.6
           L26.5 11.3
           L27.1 8.9
           L29.6 10.3
           L34.3 5.6
           C35.1 6.2 35.8 6.9 36.5 7.8Z"
        fill="#0b1220"
        opacity="0.95"
      />

      {/* Corona Estriada (Ojo cerrado de trinquete / estrella con orificio central) */}
      <circle cx="11.5" cy="31.5" r="4.2" fill="#0b1220" opacity="0.95" />
      <circle cx="11.5" cy="31.5" r="2.6" fill="url(#fierros-orange-grad)" opacity="0.3" />

      {/* Alma rebajada ergonómica (I-Beam técnico) en el mango */}
      <rect
        x="18.5"
        y="21.5"
        width="11"
        height="3.2"
        rx="1.6"
        transform="rotate(-45 18.5 21.5)"
        fill="url(#fierros-groove-grad)"
      />

      {/* Bisel superior reflectivo (luz pulida de cromo satinado) */}
      <path
        d="M24.8 16.0 L16.2 24.6"
        stroke="url(#fierros-glow-grad)"
        strokeWidth="1.2"
        strokeLinecap="round"
      />
    </svg>
  );

  if (conContenedor) {
    return (
      <div
        className="relative grid place-items-center rounded-xl bg-gradient-to-b from-[#181d28] to-[#0b1019] p-1.5 shadow-md border border-white/10"
        style={{ width: px + 12, height: px + 12 }}
      >
        {svg}
      </div>
    );
  }

  return svg;
}

export function Logo({
  size = "md",
  conContenedor = false,
  conTexto = false,
  textoClase = "text-foreground",
  className = "",
  ...props
}: LogoProps) {
  if (!conTexto) {
    return (
      <LogoIcono
        size={size}
        conContenedor={conContenedor}
        className={className}
        {...props}
      />
    );
  }

  return (
    <div className="inline-flex items-center gap-2.5 select-none">
      <LogoIcono
        size={size}
        conContenedor={conContenedor}
        className={className}
        {...props}
      />
      <div className="flex flex-col">
        <span
          className={`font-black tracking-tight text-display leading-none ${
            size === "xs" || size === "sm"
              ? "text-base"
              : size === "lg" || size === "xl"
              ? "text-2xl"
              : "text-lg"
          } ${textoClase}`}
        >
          FIERROS
        </span>
        <span className="text-[9px] font-mono uppercase tracking-widest text-muted-foreground leading-tight">
          LUBRICENTRO & TALLER
        </span>
      </div>
    </div>
  );
}
