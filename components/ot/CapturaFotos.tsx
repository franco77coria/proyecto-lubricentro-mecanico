"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import { Camera, Trash2, TriangleAlert } from "lucide-react";

import { useIsla } from "@/components/isla/IslaContext";
import { borrarFoto, registrarFoto, type FotoConUrl, type TipoFoto } from "@/lib/actions/fotos";
import { crearClienteNavegador } from "@/lib/supabase/client";
import { BUCKET_FOTOS } from "@/lib/storage";
import { comprimirImagen, formatearPeso, rutaFoto } from "@/lib/imagen";

const TIPOS: { id: TipoFoto; etiqueta: string; ayuda: string }[] = [
  { id: "cedula", etiqueta: "Cédula", ayuda: "Foto del documento del vehículo" },
  { id: "estado_ingreso", etiqueta: "Estado", ayuda: "Cómo llegó el auto" },
  { id: "dano", etiqueta: "Daños", ayuda: "Golpes y rayones que ya traía" },
  { id: "comprobante", etiqueta: "Comprobante", ayuda: "Remitos y facturas" },
];

export function CapturaFotos({
  otId,
  tallerId,
  fotos,
}: {
  otId: string;
  tallerId: string;
  fotos: FotoConUrl[];
}) {
  const { notificar } = useIsla();
  const [tipo, setTipo] = useState<TipoFoto>("estado_ingreso");
  const [subiendo, setSubiendo] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  async function alElegir(e: React.ChangeEvent<HTMLInputElement>) {
    const archivos = Array.from(e.target.files ?? []);
    // El input se limpia enseguida para poder volver a elegir la misma foto.
    e.target.value = "";
    if (!archivos.length) return;

    setError(null);
    setSubiendo(true);
    const supabase = crearClienteNavegador();
    let ahorrado = 0;
    let subidas = 0;

    try {
      for (const [i, archivo] of archivos.entries()) {
        notificar({
          tipo: "progreso",
          mensaje: "Subiendo fotos",
          actual: i + 1,
          total: archivos.length,
        });

        // Comprimir ANTES de subir: sin esto se mandan 5 MB por foto y en la
        // conexión de un taller la subida no termina nunca.
        const { blob, bytesOriginales, bytesFinales } = await comprimirImagen(archivo);
        ahorrado += bytesOriginales - bytesFinales;

        const path = rutaFoto(tallerId, otId, blob.type === "image/webp" ? "webp" : "jpg");
        const { error: errorSubida } = await supabase.storage
          .from(BUCKET_FOTOS)
          .upload(path, blob, { contentType: blob.type, upsert: false });

        if (errorSubida) throw new Error(errorSubida.message);

        const res = await registrarFoto(otId, tipo, path);
        if (res.error) throw new Error(res.error);
        subidas++;
      }

      notificar({
        tipo: "exito",
        mensaje:
          subidas === 1
            ? `Foto subida · ${formatearPeso(ahorrado)} menos`
            : `${subidas} fotos subidas · ${formatearPeso(ahorrado)} menos`,
      });
    } catch (e) {
      const msg = e instanceof Error ? e.message : "No se pudieron subir las fotos";
      setError(msg);
      notificar({ tipo: "error", mensaje: msg });
    } finally {
      setSubiendo(false);
    }
  }

  async function alBorrar(id: string) {
    const res = await borrarFoto(id, otId);
    if (res.error) notificar({ tipo: "error", mensaje: res.error });
  }

  return (
    <section className="tarjeta space-y-4 p-4">
      <div className="flex items-center justify-between gap-2">
        <h2 className="t-seccion">Fotos</h2>
        <span className="text-caption text-muted-foreground">
          {fotos.length} {fotos.length === 1 ? "foto" : "fotos"}
        </span>
      </div>

      <div className="flex flex-wrap gap-1.5">
        {TIPOS.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTipo(t.id)}
            aria-pressed={tipo === t.id}
            title={t.ayuda}
            className={`min-h-9 rounded-full px-3 text-caption font-medium transition-colors ${
              tipo === t.id
                ? "bg-accent text-accent-foreground"
                : "bg-muted text-muted-foreground hover:text-foreground"
            }`}
          >
            {t.etiqueta}
          </button>
        ))}
      </div>

      <p className="text-caption text-muted-foreground">
        {TIPOS.find((t) => t.id === tipo)?.ayuda}
      </p>

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        // Abre la cámara trasera directamente en el celular, sin pasar por la
        // galería. En escritorio el navegador lo ignora y abre el explorador.
        capture="environment"
        multiple
        onChange={alElegir}
        className="sr-only"
      />

      <button
        type="button"
        disabled={subiendo}
        onClick={() => inputRef.current?.click()}
        className="flex min-h-12 w-full items-center justify-center gap-2 rounded-[var(--radius-sm)] border border-dashed border-accent-borde bg-accent-suave text-sm font-semibold text-accent transition-transform active:scale-[0.98] disabled:opacity-60"
      >
        <Camera className="h-4.5 w-4.5" aria-hidden />
        {subiendo ? "Subiendo…" : "Sacar o elegir fotos"}
      </button>

      {error && (
        <p role="alert" className="flex items-start gap-2 text-caption text-destructive">
          <TriangleAlert className="mt-px h-3.5 w-3.5 shrink-0" aria-hidden />
          {error}
        </p>
      )}

      {fotos.length > 0 && (
        <ul className="grid grid-cols-3 gap-2 sm:grid-cols-4">
          {fotos.map((f) => (
            <li key={f.id} className="group relative aspect-square overflow-hidden rounded-[var(--radius-sm)] bg-muted">
              <Image
                src={f.url}
                alt={TIPOS.find((t) => t.id === f.tipo)?.etiqueta ?? "Foto de la orden"}
                fill
                sizes="(min-width: 640px) 25vw, 33vw"
                className="object-cover"
              />
              <span className="absolute inset-x-0 bottom-0 bg-slate-900/70 px-1.5 py-0.5 text-[0.625rem] font-medium text-white">
                {TIPOS.find((t) => t.id === f.tipo)?.etiqueta ?? f.tipo}
              </span>
              <button
                type="button"
                onClick={() => alBorrar(f.id)}
                aria-label="Borrar foto"
                className="absolute right-1 top-1 grid h-8 w-8 place-items-center rounded-full bg-slate-900/70 text-white transition-opacity active:scale-95"
              >
                <Trash2 className="h-3.5 w-3.5" aria-hidden />
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
