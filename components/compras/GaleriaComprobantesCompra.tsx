"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  useTransition,
} from "react";
import Image from "next/image";
import {
  Camera,
  ChevronLeft,
  ChevronRight,
  ImagePlus,
  Loader2,
  Receipt,
  RotateCcw,
  Trash2,
  TriangleAlert,
  X,
  ZoomIn,
  ZoomOut,
} from "lucide-react";

import { useIsla } from "@/components/isla/IslaContext";
import {
  borrarFotoCompra,
  fotosDeCompra,
  obtenerTallerIdActual,
  registrarFotoCompra,
  type FotoCompraConUrl,
} from "@/lib/actions/fotos-compras";
import { comprimirImagen, formatearPeso, rutaFotoCompra } from "@/lib/imagen";
import { BUCKET_FOTOS } from "@/lib/storage";
import { crearClienteNavegador } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

export interface FotoBorrador {
  id: string;
  file: File;
  previewUrl: string;
  nota?: string;
}

export type ItemComprobante =
  | { tipo: "remota"; data: FotoCompraConUrl }
  | { tipo: "borrador"; data: FotoBorrador };

export interface GaleriaComprobantesCompraProps {
  compraId?: string;
  tallerId?: string;
  puedeEditar?: boolean;
  fotosIniciales?: FotoCompraConUrl[];
  borrador?: boolean;
  fotosBorrador?: FotoBorrador[];
  onFotosBorradorChange?: (fotos: FotoBorrador[]) => void;
  className?: string;
  compacto?: boolean;
}

export function GaleriaComprobantesCompra({
  compraId,
  tallerId: tallerIdProp,
  puedeEditar = true,
  fotosIniciales,
  borrador = false,
  fotosBorrador = [],
  onFotosBorradorChange,
  className,
  compacto = false,
}: GaleriaComprobantesCompraProps) {
  const { notificar } = useIsla();

  // Referencias a inputs de archivos (cámara y explorador)
  const inputCamaraRef = useRef<HTMLInputElement>(null);
  const inputGaleriaRef = useRef<HTMLInputElement>(null);

  // Estados locales
  const [fotosRemotas, setFotosRemotas] = useState<FotoCompraConUrl[]>(
    fotosIniciales ?? [],
  );
  const [tallerIdLocal, setTallerIdLocal] = useState<string | null>(
    tallerIdProp ?? null,
  );
  const [cargandoRemotas, setCargandoRemotas] = useState(
    !borrador && Boolean(compraId) && !fotosIniciales,
  );
  const [subiendo, setSubiendo] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Estado del Lightbox
  const [fotoActivaIndex, setFotoActivaIndex] = useState<number | null>(null);
  const [zoom, setZoom] = useState<number>(1);
  const [posicion, setPosicion] = useState<{ x: number; y: number }>({
    x: 0,
    y: 0,
  });
  const [arrastrando, setArrastrando] = useState(false);
  const inicioArrastre = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const [borrandoId, setBorrandoId] = useState<string | null>(null);
  const [, iniciarTransicion] = useTransition();

  // Obtener taller_id si no fue pasado por props
  useEffect(() => {
    if (tallerIdProp) {
      setTallerIdLocal(tallerIdProp);
      return;
    }
    let montado = true;
    obtenerTallerIdActual().then((id) => {
      if (montado && id) setTallerIdLocal(id);
    });
    return () => {
      montado = false;
    };
  }, [tallerIdProp]);

  // Cargar fotos remotas si hay compraId y no fueron pasadas fotosIniciales
  useEffect(() => {
    if (borrador || !compraId || fotosIniciales) return;

    let cancelado = false;
    setCargandoRemotas(true);

    fotosDeCompra(compraId)
      .then((items) => {
        if (!cancelado) {
          setFotosRemotas(items);
        }
      })
      .catch((err) => {
        if (!cancelado) {
          console.error("[GaleriaComprobantesCompra]", err);
        }
      })
      .finally(() => {
        if (!cancelado) {
          setCargandoRemotas(false);
        }
      });

    return () => {
      cancelado = true;
    };
  }, [compraId, borrador, fotosIniciales]);

  // Lista unificada de items para render y lightbox
  const items: ItemComprobante[] = borrador
    ? fotosBorrador.map((b) => ({ tipo: "borrador", data: b }))
    : fotosRemotas.map((r) => ({ tipo: "remota", data: r }));

  const fotoActivaItem =
    fotoActivaIndex !== null && items[fotoActivaIndex]
      ? items[fotoActivaIndex]
      : null;

  // Reset de zoom al cambiar de foto activa
  useEffect(() => {
    setZoom(1);
    setPosicion({ x: 0, y: 0 });
  }, [fotoActivaIndex]);

  // Manejo de teclado para Lightbox (Escape, Zoom, Flechas)
  useEffect(() => {
    if (fotoActivaIndex === null) return;

    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        setFotoActivaIndex(null);
      } else if (e.key === "ArrowLeft") {
        setFotoActivaIndex((prev) =>
          prev !== null && prev > 0 ? prev - 1 : items.length - 1,
        );
      } else if (e.key === "ArrowRight") {
        setFotoActivaIndex((prev) =>
          prev !== null && prev < items.length - 1 ? prev + 1 : 0,
        );
      } else if (e.key === "+" || e.key === "=") {
        e.preventDefault();
        setZoom((z) => Math.min(4, z + 0.5));
      } else if (e.key === "-") {
        e.preventDefault();
        setZoom((z) => Math.max(1, z - 0.5));
      } else if (e.key === "0") {
        e.preventDefault();
        setZoom(1);
        setPosicion({ x: 0, y: 0 });
      }
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [fotoActivaIndex, items.length]);

  // Procesamiento y subida de fotos
  async function procesarArchivos(archivos: File[]) {
    if (!archivos.length) return;
    setError(null);

    // MODO BORRADOR (Formulario de nueva compra)
    if (borrador) {
      const nuevosBorradores: FotoBorrador[] = archivos.map((archivo) => ({
        id: crypto.randomUUID(),
        file: archivo,
        previewUrl: URL.createObjectURL(archivo),
      }));

      const listaActualizada = [...fotosBorrador, ...nuevosBorradores];
      onFotosBorradorChange?.(listaActualizada);

      notificar({
        tipo: "exito",
        mensaje:
          nuevosBorradores.length === 1
            ? "Foto de remito lista para adjuntar"
            : `${nuevosBorradores.length} fotos de remito listas`,
      });
      return;
    }

    // MODO PERSISTENTE (Compra existente con compraId)
    if (!compraId) {
      setError("No se identificó la compra para guardar el comprobante");
      return;
    }

    let tallerId = tallerIdLocal;
    if (!tallerId) {
      tallerId = await obtenerTallerIdActual();
      if (tallerId) setTallerIdLocal(tallerId);
    }

    if (!tallerId) {
      setError("No se pudo identificar el taller de la sesión");
      return;
    }

    setSubiendo(true);
    const supabase = crearClienteNavegador();
    let totalBytesAhorrados = 0;
    let fotosSubidas = 0;
    const nuevasRemotas: FotoCompraConUrl[] = [];

    try {
      for (const [i, archivo] of archivos.entries()) {
        notificar({
          tipo: "progreso",
          mensaje: "Subiendo comprobante",
          actual: i + 1,
          total: archivos.length,
        });

        // Comprimir en el navegador antes de subir para no saturar conexión ni storage
        const { blob, bytesOriginales, bytesFinales } =
          await comprimirImagen(archivo);
        totalBytesAhorrados += bytesOriginales - bytesFinales;

        const path = rutaFotoCompra(
          tallerId,
          compraId,
          blob.type === "image/webp" ? "webp" : "jpg",
        );

        const { error: errorSubida } = await supabase.storage
          .from(BUCKET_FOTOS)
          .upload(path, blob, { contentType: blob.type, upsert: false });

        if (errorSubida) throw new Error(errorSubida.message);

        const res = await registrarFotoCompra(compraId, path);
        if (res.error || !res.id) {
          throw new Error(res.error ?? "No se pudo registrar la foto");
        }

        // Obtener URL firmada para la nueva foto
        const { data: firmada } = await supabase.storage
          .from(BUCKET_FOTOS)
          .createSignedUrl(path, 3600);

        if (firmada?.signedUrl) {
          nuevasRemotas.push({
            id: res.id,
            compraId,
            path,
            nota: null,
            url: firmada.signedUrl,
            creadoEn: new Date().toISOString(),
            subidoPor: null,
          });
        }
        fotosSubidas++;
      }

      setFotosRemotas((prev) => [...prev, ...nuevasRemotas]);

      notificar({
        tipo: "exito",
        mensaje:
          fotosSubidas === 1
            ? `Comprobante subido · ${formatearPeso(totalBytesAhorrados)} optimizados`
            : `${fotosSubidas} comprobantes subidos · ${formatearPeso(totalBytesAhorrados)} optimizados`,
      });
    } catch (e) {
      const msg =
        e instanceof Error
          ? e.message
          : "No se pudieron subir los comprobantes";
      setError(msg);
      notificar({ tipo: "error", mensaje: msg });
    } finally {
      setSubiendo(false);
    }
  }

  function alSeleccionarInput(e: React.ChangeEvent<HTMLInputElement>) {
    const archivos = Array.from(e.target.files ?? []);
    e.target.value = "";
    if (archivos.length > 0) {
      procesarArchivos(archivos);
    }
  }

  // Borrar foto (remota o borrador)
  function eliminarFoto(index: number) {
    const item = items[index];
    if (!item) return;

    if (item.tipo === "borrador") {
      URL.revokeObjectURL(item.data.previewUrl);
      const nuevaLista = fotosBorrador.filter((b) => b.id !== item.data.id);
      onFotosBorradorChange?.(nuevaLista);
      if (fotoActivaIndex === index) {
        setFotoActivaIndex(null);
      } else if (fotoActivaIndex !== null && fotoActivaIndex > index) {
        setFotoActivaIndex(fotoActivaIndex - 1);
      }
      return;
    }

    if (!compraId) return;

    const fotoId = item.data.id;
    setBorrandoId(fotoId);

    iniciarTransicion(async () => {
      const res = await borrarFotoCompra(fotoId, compraId);
      setBorrandoId(null);

      if (res.error) {
        notificar({ tipo: "error", mensaje: res.error });
        return;
      }

      setFotosRemotas((prev) => prev.filter((f) => f.id !== fotoId));
      if (fotoActivaIndex === index) {
        setFotoActivaIndex(null);
      } else if (fotoActivaIndex !== null && fotoActivaIndex > index) {
        setFotoActivaIndex(fotoActivaIndex - 1);
      }

      notificar({
        tipo: "exito",
        mensaje: "Comprobante eliminado del remito",
      });
    });
  }

  // Controles de zoom y arrastre para Lightbox
  const alternarDobleClic = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      e.stopPropagation();
      if (zoom > 1) {
        setZoom(1);
        setPosicion({ x: 0, y: 0 });
      } else {
        setZoom(2.5);
      }
    },
    [zoom],
  );

  const manejarMouseDown = (e: React.MouseEvent) => {
    if (zoom <= 1) return;
    setArrastrando(true);
    inicioArrastre.current = {
      x: e.clientX - posicion.x,
      y: e.clientY - posicion.y,
    };
  };

  const manejarMouseMove = (e: React.MouseEvent) => {
    if (!arrastrando || zoom <= 1) return;
    setPosicion({
      x: e.clientX - inicioArrastre.current.x,
      y: e.clientY - inicioArrastre.current.y,
    });
  };

  const manejarMouseUp = () => {
    setArrastrando(false);
  };

  const manejarWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    if (e.deltaY < 0) {
      setZoom((z) => Math.min(4, z + 0.25));
    } else {
      setZoom((z) => {
        const nuevo = Math.max(1, z - 0.25);
        if (nuevo === 1) setPosicion({ x: 0, y: 0 });
        return nuevo;
      });
    }
  };

  return (
    <div className={cn("space-y-3", className)}>
      {/* Inputs ocultos: uno con capture para cámara trasera directa, otro para galería/archivos */}
      <input
        ref={inputCamaraRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={alSeleccionarInput}
        className="sr-only"
        aria-hidden
      />
      <input
        ref={inputGaleriaRef}
        type="file"
        accept="image/*"
        multiple
        onChange={alSeleccionarInput}
        className="sr-only"
        aria-hidden
      />

      {/* Encabezado y botones de captura */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-1.5 text-caption font-semibold text-foreground">
          <Receipt className="h-4 w-4 text-accent" aria-hidden />
          <span>Comprobantes / Remito físico</span>
          {items.length > 0 && (
            <span className="rounded-full bg-accent/15 px-2 py-0.2 text-[11px] font-bold text-accent">
              {items.length}
            </span>
          )}
        </div>

        {puedeEditar && (
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              disabled={subiendo}
              onClick={() => inputCamaraRef.current?.click()}
              className="inline-flex min-h-9 items-center gap-1.5 rounded-xl bg-accent px-3 text-caption font-bold text-white shadow-sm transition-transform active:scale-95 hover:brightness-110 disabled:opacity-50"
              title="Sacar foto con la cámara del celular"
            >
              <Camera className="h-3.5 w-3.5" aria-hidden />
              <span>Sacar foto</span>
            </button>

            <button
              type="button"
              disabled={subiendo}
              onClick={() => inputGaleriaRef.current?.click()}
              className="inline-flex min-h-9 items-center gap-1.5 rounded-xl border border-border bg-card px-3 text-caption font-semibold text-muted-foreground transition-colors hover:bg-muted hover:text-foreground active:scale-95 disabled:opacity-50"
              title="Elegir foto desde la galería o explorador"
            >
              <ImagePlus className="h-3.5 w-3.5" aria-hidden />
              <span>Galería</span>
            </button>
          </div>
        )}
      </div>

      {subiendo && (
        <div className="flex items-center gap-2 rounded-xl bg-accent-suave p-2.5 text-caption font-medium text-accent">
          <Loader2 className="h-4 w-4 animate-spin shrink-0" aria-hidden />
          <span>Optimizando y subiendo comprobante…</span>
        </div>
      )}

      {error && (
        <p role="alert" className="flex items-start gap-1.5 text-caption text-destructive">
          <TriangleAlert className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden />
          <span>{error}</span>
        </p>
      )}

      {/* Lista de miniaturas */}
      {cargandoRemotas ? (
        <div className="flex items-center justify-center gap-2 py-4 text-caption text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
          <span>Cargando comprobantes…</span>
        </div>
      ) : items.length === 0 ? (
        <div
          onClick={() => puedeEditar && inputCamaraRef.current?.click()}
          className={cn(
            "flex flex-col items-center justify-center gap-1.5 rounded-2xl border border-dashed border-border/80 bg-muted/20 p-4 text-center text-caption text-muted-foreground transition-colors",
            puedeEditar && "cursor-pointer hover:border-accent/40 hover:bg-muted/40",
            compacto && "py-3",
          )}
        >
          <Camera className="h-5 w-5 text-muted-foreground/60" aria-hidden />
          <p className="font-medium">
            {puedeEditar
              ? "Sacá una foto al remito físico para guardarlo con la compra"
              : "Sin comprobantes físicos adjuntos"}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
          {items.map((item, idx) => {
            const url =
              item.tipo === "borrador"
                ? item.data.previewUrl
                : item.data.url;
            const id = item.data.id;
            const estaBorrando = borrandoId === id;

            return (
              <div
                key={id}
                className="group relative aspect-square overflow-hidden rounded-xl border border-border/80 bg-black/5 dark:bg-black/30 shadow-xs"
              >
                <button
                  type="button"
                  onClick={() => setFotoActivaIndex(idx)}
                  className="relative h-full w-full focus:outline-none"
                  aria-label={`Ver comprobante ${idx + 1}`}
                >
                  <Image
                    src={url}
                    alt={`Comprobante físico ${idx + 1}`}
                    fill
                    unoptimized
                    sizes="(max-width: 640px) 33vw, 25vw"
                    className="object-cover transition-transform duration-200 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end justify-between p-1.5">
                    <span className="text-[10px] font-bold text-white drop-shadow-xs">
                      #{idx + 1}
                    </span>
                    <span className="rounded-full bg-black/60 p-1 text-white backdrop-blur-xs">
                      <ZoomIn className="h-3 w-3" aria-hidden />
                    </span>
                  </div>
                </button>

                {puedeEditar && (
                  <button
                    type="button"
                    onClick={() => eliminarFoto(idx)}
                    disabled={estaBorrando}
                    aria-label={`Borrar comprobante ${idx + 1}`}
                    className="absolute right-1 top-1 grid h-7 w-7 place-items-center rounded-full bg-black/75 text-white/90 shadow-md backdrop-blur-xs transition-all hover:bg-destructive hover:text-white active:scale-90 disabled:opacity-50"
                  >
                    {estaBorrando ? (
                      <Loader2 className="h-3 w-3 animate-spin" aria-hidden />
                    ) : (
                      <Trash2 className="h-3 w-3" aria-hidden />
                    )}
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Modal Lightbox con Zoom de alta resolución */}
      {fotoActivaItem && fotoActivaIndex !== null && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex flex-col bg-black/95 backdrop-blur-md select-none animate-in fade-in duration-200"
          onClick={() => {
            if (zoom === 1) setFotoActivaIndex(null);
          }}
        >
          {/* Barra superior del Lightbox */}
          <div
            className="flex items-center justify-between border-b border-white/10 px-4 py-3 bg-black/40 text-white z-20"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-2.5">
              <span className="rounded-full bg-accent/20 px-2.5 py-0.5 text-xs font-bold text-accent">
                {fotoActivaIndex + 1} / {items.length}
              </span>
              <span className="text-xs font-medium text-white/80 hidden sm:inline">
                Comprobante físico / Remito
              </span>
            </div>

            {/* Controles de zoom y herramientas */}
            <div className="flex items-center gap-1 sm:gap-2">
              <button
                type="button"
                onClick={() => setZoom((z) => Math.max(1, z - 0.5))}
                disabled={zoom <= 1}
                className="grid h-9 w-9 place-items-center rounded-lg bg-white/10 text-white transition-colors hover:bg-white/20 active:scale-95 disabled:opacity-30"
                title="Alejar (-)"
                aria-label="Alejar"
              >
                <ZoomOut className="h-4 w-4" aria-hidden />
              </button>

              <span className="min-w-14 text-center text-xs font-mono font-bold text-white/90">
                {Math.round(zoom * 100)}%
              </span>

              <button
                type="button"
                onClick={() => setZoom((z) => Math.min(4, z + 0.5))}
                disabled={zoom >= 4}
                className="grid h-9 w-9 place-items-center rounded-lg bg-white/10 text-white transition-colors hover:bg-white/20 active:scale-95 disabled:opacity-30"
                title="Acercar (+)"
                aria-label="Acercar"
              >
                <ZoomIn className="h-4 w-4" aria-hidden />
              </button>

              <button
                type="button"
                onClick={() => {
                  setZoom(1);
                  setPosicion({ x: 0, y: 0 });
                }}
                disabled={zoom === 1}
                className="grid h-9 w-9 place-items-center rounded-lg bg-white/10 text-white transition-colors hover:bg-white/20 active:scale-95 disabled:opacity-30"
                title="Restablecer tamaño (0)"
                aria-label="Restablecer tamaño"
              >
                <RotateCcw className="h-4 w-4" aria-hidden />
              </button>

              {puedeEditar && (
                <button
                  type="button"
                  onClick={() => eliminarFoto(fotoActivaIndex)}
                  disabled={borrandoId === fotoActivaItem.data.id}
                  className="grid h-9 w-9 place-items-center rounded-lg bg-destructive/80 text-white transition-colors hover:bg-destructive active:scale-95 ml-1"
                  title="Eliminar comprobante"
                  aria-label="Eliminar comprobante"
                >
                  <Trash2 className="h-4 w-4" aria-hidden />
                </button>
              )}

              <button
                type="button"
                onClick={() => setFotoActivaIndex(null)}
                className="grid h-9 w-9 place-items-center rounded-lg bg-white/20 text-white transition-colors hover:bg-white/30 active:scale-95 ml-2"
                title="Cerrar (Esc)"
                aria-label="Cerrar visor"
              >
                <X className="h-5 w-5" aria-hidden />
              </button>
            </div>
          </div>

          {/* Área principal de visualización interactiva */}
          <div
            className={cn(
              "relative flex-1 overflow-hidden flex items-center justify-center p-2 sm:p-4",
              zoom > 1
                ? arrastrando
                  ? "cursor-grabbing"
                  : "cursor-grab"
                : "cursor-default",
            )}
            onDoubleClick={alternarDobleClic}
            onMouseDown={manejarMouseDown}
            onMouseMove={manejarMouseMove}
            onMouseUp={manejarMouseUp}
            onMouseLeave={manejarMouseUp}
            onWheel={manejarWheel}
          >
            {/* Navegación anterior */}
            {items.length > 1 && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setFotoActivaIndex((prev) =>
                    prev !== null && prev > 0 ? prev - 1 : items.length - 1,
                  );
                }}
                className="absolute left-3 top-1/2 -translate-y-1/2 z-30 grid h-11 w-11 place-items-center rounded-full bg-black/60 text-white/90 border border-white/10 backdrop-blur-md transition-all hover:bg-black hover:scale-105 active:scale-95"
                aria-label="Comprobante anterior"
              >
                <ChevronLeft className="h-6 w-6" aria-hidden />
              </button>
            )}

            {/* Imagen con transformaciones de Zoom y Pan */}
            <div
              className="relative max-h-full max-w-full flex items-center justify-center transition-transform duration-75 ease-out"
              style={{
                transform: `scale(${zoom}) translate(${posicion.x / zoom}px, ${posicion.y / zoom}px)`,
                transformOrigin: "center center",
              }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={
                  fotoActivaItem.tipo === "borrador"
                    ? fotoActivaItem.data.previewUrl
                    : fotoActivaItem.data.url
                }
                alt="Comprobante ampliado"
                className="max-h-[82vh] max-w-[92vw] object-contain rounded-lg shadow-2xl pointer-events-none"
                draggable={false}
              />
            </div>

            {/* Navegación siguiente */}
            {items.length > 1 && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setFotoActivaIndex((prev) =>
                    prev !== null && prev < items.length - 1 ? prev + 1 : 0,
                  );
                }}
                className="absolute right-3 top-1/2 -translate-y-1/2 z-30 grid h-11 w-11 place-items-center rounded-full bg-black/60 text-white/90 border border-white/10 backdrop-blur-md transition-all hover:bg-black hover:scale-105 active:scale-95"
                aria-label="Comprobante siguiente"
              >
                <ChevronRight className="h-6 w-6" aria-hidden />
              </button>
            )}
          </div>

          {/* Pie del Lightbox con pista de uso */}
          <div
            className="border-t border-white/10 px-4 py-2.5 text-center bg-black/40 text-white/60 text-[11px] z-20"
            onClick={(e) => e.stopPropagation()}
          >
            <p>
              Doble clic para alternar zoom · Rueda del mouse para acercar/alejar
              · Arrastrá la imagen para leer números y detalles
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
