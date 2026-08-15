"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";

export interface ZonaCarroceria {
  id: string;
  nombre: string;
  d: string;
}

const ZONAS_CARROCERIA: ZonaCarroceria[] = [
  { id: "paragolpes_delantero", nombre: "Paragolpes Delantero", d: "M 35 12 Q 50 3 65 12 L 62 25 L 38 25 Z" },
  { id: "optica_izq", nombre: "Óptica Izquierda", d: "M 33 14 L 38 14 L 38 22 L 32 20 Z" },
  { id: "optica_der", nombre: "Óptica Derecha", d: "M 62 14 L 67 14 L 68 20 L 62 22 Z" },
  { id: "capot", nombre: "Capot / Motor", d: "M 38 27 L 62 27 L 60 52 L 40 52 Z" },
  { id: "parabrisas", nombre: "Parabrisas", d: "M 39 54 L 61 54 L 60 68 L 40 68 Z" },
  { id: "techo", nombre: "Techo", d: "M 40 70 L 60 70 L 59 96 L 41 96 Z" },
  { id: "luneta", nombre: "Luneta Trasera", d: "M 41 98 L 59 98 L 60 110 L 40 110 Z" },
  { id: "baul", nombre: "Tapa de Baúl", d: "M 40 112 L 60 112 L 62 126 L 38 126 Z" },
  { id: "paragolpes_trasero", nombre: "Paragolpes Trasero", d: "M 36 128 L 64 128 Q 50 137 36 128 Z" },
  { id: "puertas_izq", nombre: "Lateral Izquierdo (Conductor)", d: "M 34 28 L 38 28 L 39 122 L 34 122 Z" },
  { id: "puertas_der", nombre: "Lateral Derecho (Acompañante)", d: "M 62 28 L 66 28 L 66 122 L 61 122 Z" },
];

interface DiagramaVehiculoProps {
  zonasSeleccionadas?: string[];
  onToggleZona?: (zonaId: string) => void;
  className?: string;
  readOnly?: boolean;
}

export function DiagramaVehiculo({
  zonasSeleccionadas = [],
  onToggleZona,
  className,
  readOnly = false,
}: DiagramaVehiculoProps) {
  const [hoverZona, setHoverZona] = useState<string | null>(null);

  const zonaHoverObj = ZONAS_CARROCERIA.find((z) => z.id === hoverZona);

  return (
    <div className={cn("flex flex-col items-center justify-center p-3", className)}>
      <div className="relative h-44 w-32">
        <svg viewBox="0 0 100 140" className="h-full w-full drop-shadow-sm select-none">
          {/* Chasis base */}
          <path
            d="M 33 22 Q 50 5 67 22 L 68 120 Q 50 138 32 120 Z"
            fill="#18181b"
            stroke="#3f3f46"
            strokeWidth="1.5"
          />
          {/* Neumáticos */}
          <rect x="26" y="24" width="5" height="15" rx="1.5" fill="#52525b" />
          <rect x="69" y="24" width="5" height="15" rx="1.5" fill="#52525b" />
          <rect x="26" y="98" width="5" height="15" rx="1.5" fill="#52525b" />
          <rect x="69" y="98" width="5" height="15" rx="1.5" fill="#52525b" />

          {/* Espejos retrovisores */}
          <path d="M 28 50 L 33 52 L 33 56 L 27 54 Z" fill="#71717a" />
          <path d="M 72 50 L 67 52 L 67 56 L 73 54 Z" fill="#71717a" />

          {/* Zonas interactivas de carrocería */}
          {ZONAS_CARROCERIA.map((z) => {
            const activa = zonasSeleccionadas.includes(z.id);
            return (
              <path
                key={z.id}
                d={z.d}
                onClick={() => !readOnly && onToggleZona?.(z.id)}
                onMouseEnter={() => setHoverZona(z.id)}
                onMouseLeave={() => setHoverZona(null)}
                className={cn(
                  "transition-all duration-200",
                  !readOnly && "cursor-pointer",
                  activa
                    ? "fill-red-500/80 stroke-red-400 stroke-2"
                    : "fill-zinc-800/80 stroke-zinc-700/60 hover:fill-amber-500/40 hover:stroke-amber-400",
                )}
                strokeWidth="1"
              >
                <title>{z.nombre}</title>
              </path>
            );
          })}
        </svg>
      </div>

      {/* Indicador de zona tocada / hover */}
      <div className="mt-2 text-center text-xs font-semibold text-muted-foreground h-5">
        {zonaHoverObj ? zonaHoverObj.nombre : `${zonasSeleccionadas.length} daños marcados`}
      </div>
    </div>
  );
}
