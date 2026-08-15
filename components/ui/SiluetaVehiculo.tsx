import { cn } from "@/lib/utils";

export type TipoCarroceria = "sedan" | "hatchback" | "suv" | "pickup" | "furgon" | "moto" | "auto";

interface SiluetaVehiculoProps {
  tipo?: TipoCarroceria | string;
  className?: string;
}

export function SiluetaVehiculo({ tipo = "auto", className }: SiluetaVehiculoProps) {
  const norm = (tipo || "auto").toLowerCase();

  if (norm.includes("moto")) {
    return (
      <svg
        viewBox="0 0 48 32"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className={cn("h-6 w-10 shrink-0", className)}
        aria-hidden
      >
        {/* Rueda delantera y trasera */}
        <circle cx="10" cy="22" r="6" />
        <circle cx="38" cy="22" r="6" />
        {/* Cuadro y manubrio */}
        <path d="M10 22l8-10h6l4 8H10z" />
        <path d="M24 12l4 10" />
        <path d="M28 6h4l6 16" />
        <circle cx="28" cy="6" r="1.5" fill="currentColor" />
        <path d="M18 12c-2-3-4-3-6-3" />
      </svg>
    );
  }

  if (norm.includes("pickup") || norm.includes("camioneta") || norm.includes("hilux") || norm.includes("ranger") || norm.includes("amarok")) {
    return (
      <svg
        viewBox="0 0 54 28"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className={cn("h-6 w-12 shrink-0", className)}
        aria-hidden
      >
        {/* Chasis Pickup */}
        <path d="M3 18h6m12 0h18m8 0h4v-5l-4-2H33V7H17L8 14H3v4z" />
        {/* Caja de carga */}
        <line x1="33" y1="11" x2="49" y2="11" />
        <line x1="33" y1="7" x2="33" y2="18" />
        {/* Cabina */}
        <path d="M17 7l-7 7h15l-1-7h-7z" />
        {/* Ruedas */}
        <circle cx="15" cy="18" r="4.5" />
        <circle cx="43" cy="18" r="4.5" />
      </svg>
    );
  }

  if (norm.includes("suv") || norm.includes("crossover") || norm.includes("duster") || norm.includes("ecosport") || norm.includes("compass")) {
    return (
      <svg
        viewBox="0 0 50 28"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className={cn("h-6 w-11 shrink-0", className)}
        aria-hidden
      >
        {/* Carrocería SUV */}
        <path d="M3 18h6m12 0h16m6 0h4v-6l-5-4H18L10 13H3v5z" />
        {/* Barras de techo */}
        <line x1="19" y1="6" x2="38" y2="6" strokeWidth="1.5" />
        {/* Ventanas */}
        <path d="M18 8l-6 5h14V8h-8z" />
        <path d="M28 8v5h9l-3-5h-6z" />
        {/* Ruedas */}
        <circle cx="15" cy="18" r="4.5" />
        <circle cx="39" cy="18" r="4.5" />
      </svg>
    );
  }

  if (norm.includes("furgon") || norm.includes("van") || norm.includes("kangoo") || norm.includes("partner") || norm.includes("berlingo")) {
    return (
      <svg
        viewBox="0 0 50 28"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className={cn("h-6 w-11 shrink-0", className)}
        aria-hidden
      >
        {/* Carrocería Furgón */}
        <path d="M3 18h6m12 0h16m6 0h4V7H17L9 13H3v5z" />
        {/* Parabrisas y ventanilla */}
        <path d="M16 8l-6 5h7V8h-1z" />
        {/* Ruedas */}
        <circle cx="15" cy="18" r="4.5" />
        <circle cx="39" cy="18" r="4.5" />
      </svg>
    );
  }

  // Default: Sedán / Berlina deportiva
  return (
    <svg
      viewBox="0 0 48 26"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={cn("h-6 w-10 shrink-0", className)}
      aria-hidden
    >
      {/* Carrocería Sedán */}
      <path d="M3 17h6m12 0h14m6 0h4v-4l-6-2H34L26 6H15L9 12H3v5z" />
      {/* Ventanas */}
      <path d="M16 7l-5 5h12V7h-7z" />
      <path d="M25 7v5h8l-4-5h-4z" />
      {/* Ruedas */}
      <circle cx="15" cy="17" r="4" />
      <circle cx="37" cy="17" r="4" />
    </svg>
  );
}
