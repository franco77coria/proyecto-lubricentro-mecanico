"use client";

import { useState } from "react";
import Image from "next/image";
import { Camera, X, ZoomIn } from "lucide-react";
import { cn } from "@/lib/utils";
import type { FotoPublica } from "@/lib/actions/seguimiento";

interface GaleriaReparacionProps {
  fotos?: FotoPublica[];
  className?: string;
}

const ETIQUETA_FOTO: Record<string, string> = {
  estado_ingreso: "Recepción / Ingreso",
  dano: "Detalle / Daño previo",
  comprobante: "Repuesto / Trabajo",
};

export function GaleriaReparacion({ fotos = [], className }: GaleriaReparacionProps) {
  const [fotoActiva, setFotoActiva] = useState<FotoPublica | null>(null);

  if (!fotos || fotos.length === 0) return null;

  return (
    <section className={cn("rounded-3xl border border-border/80 bg-card p-5 shadow-sm space-y-3", className)}>
      <div className="flex items-center gap-2 border-b border-border pb-2.5">
        <Camera className="h-4 w-4 text-accent" />
        <h3 className="text-xs font-black uppercase tracking-wider text-foreground">
          Registro Fotográfico del Servicio ({fotos.length})
        </h3>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
        {fotos.map((foto) => (
          <button
            key={foto.id}
            type="button"
            onClick={() => setFotoActiva(foto)}
            className="group relative aspect-video w-full overflow-hidden rounded-2xl border border-border/80 bg-muted/40 text-left transition-all hover:border-accent active:scale-95 focus:outline-none"
          >
            {foto.url ? (
              <Image
                src={foto.url}
                alt={foto.nota || ETIQUETA_FOTO[foto.tipo] || "Foto de orden"}
                fill
                unoptimized
                sizes="(max-width: 640px) 50vw, 33vw"
                className="object-cover transition-transform duration-300 group-hover:scale-105"
              />
            ) : (
              <div className="grid h-full w-full place-items-center text-xs text-muted-foreground">
                Foto
              </div>
            )}

            {/* Overlay gradiente con texto */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent p-2 flex flex-col justify-between opacity-90 z-10">
              <span className="self-end rounded-full bg-black/50 p-1 text-white backdrop-blur-sm">
                <ZoomIn className="h-3 w-3" />
              </span>
              <p className="text-[11px] font-semibold text-white truncate">
                {foto.nota || ETIQUETA_FOTO[foto.tipo] || "Inspección"}
              </p>
            </div>
          </button>
        ))}
      </div>

      {/* Modal Lightbox */}
      {fotoActiva && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4 backdrop-blur-sm animate-in fade-in duration-200"
          onClick={() => setFotoActiva(null)}
        >
          <div
            className="relative max-w-2xl w-full rounded-3xl overflow-hidden bg-zinc-950 border border-zinc-800 shadow-2xl p-2"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => setFotoActiva(null)}
              className="absolute top-4 right-4 z-20 grid h-9 w-9 place-items-center rounded-full bg-black/70 text-white hover:bg-black active:scale-90"
              aria-label="Cerrar"
            >
              <X className="h-5 w-5" />
            </button>

            {fotoActiva.url && (
              <div className="relative aspect-video w-full rounded-2xl overflow-hidden bg-black">
                <Image
                  src={fotoActiva.url}
                  alt={fotoActiva.nota || "Foto ampliada"}
                  fill
                  unoptimized
                  sizes="(max-width: 768px) 100vw, 700px"
                  className="object-contain"
                />
              </div>
            )}

            <div className="p-4 text-center">
              <span className="inline-block rounded-full bg-accent/15 px-3 py-1 text-xs font-bold text-accent">
                {ETIQUETA_FOTO[fotoActiva.tipo] || "Detalle"}
              </span>
              {fotoActiva.nota && (
                <p className="text-sm font-medium text-zinc-200 mt-2">
                  {fotoActiva.nota}
                </p>
              )}
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
