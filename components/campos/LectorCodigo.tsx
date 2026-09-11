"use client";

import { Camera, CircleAlert, Image as ImageIcon, Loader2, Sparkles, X } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";

import { leerCodigo, type FormatosCodigo } from "@/lib/codigo";
import { comprimirParaOCR } from "@/lib/imagen";

type Estado = "iniciando" | "escaneando" | "leyendo" | "sin-camara";

/** Cada cuánto se intenta leer un cuadro. */
const MS_ENTRE_LECTURAS = 350;

/**
 * Lector unificado de cámara para Códigos QR/PDF417 y Reconocimiento IA de Cédula.
 *
 * Se abre a pantalla completa con vista previa en vivo.
 *
 * Modo dual:
 * 1. Lee códigos QR y de barras en tiempo real mientras se apunta.
 * 2. Si `onCapturaFotoIA` está configurado, permite capturar instantáneamente
 *    un fotograma en alta definición para procesarlo con IA (Gemini Vision),
 *    o seleccionar una foto ya guardada de la galería del celular.
 */
export function LectorCodigo({
  titulo,
  ayuda,
  formatos,
  onLeido,
  onCapturaFotoIA,
  procesandoIA: procesandoIAProp = false,
  onCerrar,
}: {
  titulo: string;
  ayuda: string;
  formatos?: FormatosCodigo;
  onLeido?: (texto: string) => void;
  onCapturaFotoIA?: (dataUri: string) => Promise<void> | void;
  procesandoIA?: boolean;
  onCerrar: () => void;
}) {
  const refVideo = useRef<HTMLVideoElement>(null);
  const refCanvas = useRef<HTMLCanvasElement>(null);
  const refInputGaleria = useRef<HTMLInputElement>(null);
  const refInputCamaraNativa = useRef<HTMLInputElement>(null);

  // Evita que el bucle siga leyendo entre que se encuentra un código y que se desmonta
  const refCortado = useRef(false);
  const [estado, setEstado] = useState<Estado>("iniciando");
  const [aviso, setAviso] = useState<string | null>(null);
  const [procesandoLocalIA, setProcesandoLocalIA] = useState(false);

  const esModoIA = Boolean(onCapturaFotoIA);
  const tieneEscanerQR = Boolean(formatos && onLeido);
  const estaProcesandoIA = procesandoIAProp || procesandoLocalIA;

  const procesar = useCallback(
    async (imagen: ImageData | Blob) => {
      if (!formatos || !onLeido) return false;
      const texto = await leerCodigo(imagen, formatos);
      if (!texto || refCortado.current) return false;
      refCortado.current = true;
      onLeido(texto);
      return true;
    },
    [formatos, onLeido],
  );

  // Cámara en vivo
  useEffect(() => {
    refCortado.current = false;
    let stream: MediaStream | null = null;
    let timer: ReturnType<typeof setTimeout> | null = null;

    async function bucle() {
      const video = refVideo.current;
      const canvas = refCanvas.current;
      if (refCortado.current || !video || !canvas) return;

      if (video.readyState >= 2 && video.videoWidth > 0) {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        const ctx = canvas.getContext("2d", { willReadFrequently: true });
        if (ctx) {
          ctx.drawImage(video, 0, 0);
          try {
            const encontrado = await procesar(
              ctx.getImageData(0, 0, canvas.width, canvas.height),
            );
            if (encontrado) return;
          } catch {
            // Cuadro borroso no es error
          }
        }
      }
      if (!refCortado.current) timer = setTimeout(bucle, MS_ENTRE_LECTURAS);
    }

    (async () => {
      if (!navigator.mediaDevices?.getUserMedia) {
        setEstado("sin-camara");
        setAviso("Este dispositivo no expone la cámara al navegador.");
        return;
      }
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: { ideal: "environment" }, width: { ideal: 1920 } },
        });
        if (refCortado.current) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }
        const video = refVideo.current;
        if (video) {
          video.srcObject = stream;
          await video.play().catch(() => {});
        }
        setEstado("escaneando");
        if (tieneEscanerQR) {
          bucle();
        }
      } catch {
        setEstado("sin-camara");
        setAviso(
          window.isSecureContext
            ? "No se pudo abrir la cámara. Revisá el permiso del navegador."
            : "La cámara en vivo necesita HTTPS. Podés sacar o subir una foto.",
        );
      }
    })();

    return () => {
      refCortado.current = true;
      if (timer) clearTimeout(timer);
      stream?.getTracks().forEach((t) => t.stop());
    };
  }, [procesar, tieneEscanerQR]);

  /**
   * Captura el fotograma actual del video en vivo y lo procesa con IA.
   */
  async function capturarFotogramaIA() {
    const video = refVideo.current;
    if (!video || !onCapturaFotoIA || estaProcesandoIA) return;
    if (video.readyState < 2 || video.videoWidth <= 0) {
      setAviso("Esperá que la cámara termine de enfocar para capturar.");
      return;
    }

    setProcesandoLocalIA(true);
    try {
      const dataUri = await comprimirParaOCR(video);
      await onCapturaFotoIA(dataUri);
    } catch (err) {
      console.error("[capturarFotogramaIA]", err);
      setAviso("No se pudo capturar la foto de la cámara.");
    } finally {
      if (!refCortado.current) setProcesandoLocalIA(false);
    }
  }

  /**
   * Procesa una imagen seleccionada desde la galería o tomada con la cámara nativa.
   */
  async function procesarArchivoSeleccionado(file: File) {
    if (!file) return;

    // Si tiene handler de IA, comprimimos y mandamos a IA
    if (onCapturaFotoIA) {
      setProcesandoLocalIA(true);
      try {
        const dataUriComprimido = await comprimirParaOCR(file);
        await onCapturaFotoIA(dataUriComprimido);
      } catch (err) {
        console.error("[procesarArchivoSeleccionado/IA]", err);
        setAviso("No se pudo procesar la imagen seleccionada.");
      } finally {
        if (!refCortado.current) setProcesandoLocalIA(false);
      }
      return;
    }

    // Modo código estándar: leer QR/barras del archivo
    setEstado("leyendo");
    try {
      const encontrado = await procesar(file);
      if (!encontrado) {
        setEstado("sin-camara");
        setAviso(
          "No se encontró el código en esa foto. Probá con más luz, sin reflejo del plástico y que el código entre completo.",
        );
      }
    } catch {
      setEstado("sin-camara");
      setAviso("No se pudo procesar la imagen.");
    }
  }

  return (
    <div
      className="fixed inset-0 z-[60] flex flex-col bg-slate-950 text-white select-none"
      role="dialog"
      aria-modal="true"
      aria-label={titulo}
    >
      {/* Input oculto para Galería (sin atributo capture para abrir el carrete/archivos) */}
      <input
        ref={refInputGaleria}
        type="file"
        accept="image/*"
        className="sr-only"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) procesarArchivoSeleccionado(f);
          e.target.value = "";
        }}
      />

      {/* Input oculto para Cámara Nativa de respaldo */}
      <input
        ref={refInputCamaraNativa}
        type="file"
        accept="image/*"
        capture="environment"
        className="sr-only"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) procesarArchivoSeleccionado(f);
          e.target.value = "";
        }}
      />

      {/* Encabezado */}
      <header className="flex items-start justify-between gap-3 p-4 pt-[calc(var(--safe-top)+1rem)] z-10 bg-gradient-to-b from-black/80 via-black/40 to-transparent">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-base font-bold">{titulo}</h2>
            {esModoIA && (
              <span className="flex items-center gap-1 rounded-full bg-accent px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-wide text-white">
                <Sparkles className="h-3 w-3" />
                <span>{tieneEscanerQR ? "QR + IA" : "Cédula IA"}</span>
              </span>
            )}
          </div>
          <p className="mt-0.5 text-xs text-white/70">{ayuda}</p>
        </div>
        <button
          type="button"
          onClick={onCerrar}
          aria-label="Cerrar el lector"
          className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-white/10 text-white active:scale-95 hover:bg-white/20 transition-all"
        >
          <X className="h-5 w-5" aria-hidden />
        </button>
      </header>

      {/* Área del Visor */}
      <div
        onClick={esModoIA && !estaProcesandoIA && estado === "escaneando" ? capturarFotogramaIA : undefined}
        className={`relative flex-1 overflow-hidden bg-black ${esModoIA ? "cursor-pointer" : ""}`}
      >
        <video
          ref={refVideo}
          playsInline
          muted
          className="h-full w-full object-cover"
        />
        <canvas ref={refCanvas} className="hidden" />

        {/* Marco de encuadre en vivo */}
        {estado === "escaneando" && !estaProcesandoIA && (
          <div className="pointer-events-none absolute inset-0 grid place-items-center p-6">
            <div className="relative aspect-[3/2] w-full max-w-md rounded-2xl border-2 border-white/80 shadow-[0_0_0_100vmax_rgba(2,6,23,0.55)]">
              {/* Esquinas destacadas */}
              <div className="absolute -top-1 -left-1 h-5 w-5 border-t-4 border-l-4 border-accent rounded-tl-md" />
              <div className="absolute -top-1 -right-1 h-5 w-5 border-t-4 border-r-4 border-accent rounded-tr-md" />
              <div className="absolute -bottom-1 -left-1 h-5 w-5 border-b-4 border-l-4 border-accent rounded-bl-md" />
              <div className="absolute -bottom-1 -right-1 h-5 w-5 border-b-4 border-r-4 border-accent rounded-br-md" />

              <div className="absolute inset-x-0 -bottom-8 text-center">
                <p className="text-[11px] font-semibold text-white/80 drop-shadow-md">
                  {tieneEscanerQR
                    ? "Enfocá el código para lectura rápida o sacá una foto con IA"
                    : "Encuadrá la cédula y tocá Capturar o cualquier parte de la pantalla"}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Feedback durante procesamiento IA */}
        {estaProcesandoIA && (
          <div className="absolute inset-0 z-20 grid place-items-center bg-slate-950/85 backdrop-blur-xs p-6 text-center animate-in fade-in">
            <div className="space-y-3 max-w-xs">
              <div className="relative mx-auto h-14 w-14">
                <Loader2 className="h-14 w-14 animate-spin text-accent" />
                <Sparkles className="absolute inset-0 m-auto h-6 w-6 text-accent animate-pulse" />
              </div>
              <p className="text-base font-bold text-white">Analizando cédula con IA…</p>
              <p className="text-xs text-white/70 leading-relaxed">
                Extrayendo patente, marca, modelo, motorización, chasis y datos del titular.
              </p>
            </div>
          </div>
        )}

        {/* Mensaje cuando la cámara no está lista o falló */}
        {estado !== "escaneando" && !estaProcesandoIA && (
          <div className="absolute inset-0 grid place-items-center bg-slate-950/90 p-6 text-center">
            {estado === "sin-camara" ? (
              <div className="max-w-xs space-y-3 text-white">
                <CircleAlert className="mx-auto h-10 w-10 text-amber-400" aria-hidden />
                <p className="text-sm font-semibold">{aviso}</p>
                <div className="flex flex-col gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => refInputGaleria.current?.click()}
                    className="flex min-h-11 items-center justify-center gap-2 rounded-xl bg-accent px-4 text-xs font-bold text-white active:scale-95 shadow-md"
                  >
                    <ImageIcon className="h-4 w-4" />
                    <span>Elegir foto de la galería</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => refInputCamaraNativa.current?.click()}
                    className="flex min-h-11 items-center justify-center gap-2 rounded-xl bg-white/10 px-4 text-xs font-bold text-white active:scale-95 hover:bg-white/15"
                  >
                    <Camera className="h-4 w-4" />
                    <span>Abrir cámara de fotos</span>
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-2 text-white/80">
                <Loader2 className="mx-auto h-8 w-8 animate-spin text-accent" aria-hidden />
                <p className="text-sm font-semibold">
                  {estado === "leyendo" ? "Leyendo la foto…" : "Iniciando cámara…"}
                </p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Barra de Control Inferior */}
      <footer className="relative z-10 bg-gradient-to-t from-black via-black/90 to-transparent p-4 pb-[calc(var(--safe-bottom)+1.25rem)]">
        {esModoIA ? (
          <div className="space-y-3">
            {/* Fila principal con botón de disparador central y galería a los lados */}
            <div className="flex items-center justify-around px-4">
              {/* Botón Galería */}
              <button
                type="button"
                onClick={() => refInputGaleria.current?.click()}
                disabled={estaProcesandoIA}
                aria-label="Subir foto desde la galería"
                className="flex flex-col items-center gap-1 p-2 text-white/80 hover:text-white active:scale-95 transition-all disabled:opacity-50"
              >
                <div className="grid h-12 w-12 place-items-center rounded-2xl bg-white/10 border border-white/15 shadow-sm">
                  <ImageIcon className="h-5 w-5" />
                </div>
                <span className="text-[11px] font-bold">Galería</span>
              </button>

              {/* Botón Disparador Central de Fotograma */}
              <button
                type="button"
                onClick={capturarFotogramaIA}
                disabled={estaProcesandoIA || estado !== "escaneando"}
                aria-label="Capturar cédula con IA"
                className="group relative flex flex-col items-center gap-1 active:scale-90 transition-transform disabled:opacity-50"
              >
                <div className="relative grid h-18 w-18 place-items-center rounded-full border-4 border-white bg-white/20 p-1 shadow-lg shadow-black/50">
                  <div className="h-full w-full rounded-full bg-white group-active:scale-90 transition-transform flex items-center justify-center">
                    <Sparkles className="h-6 w-6 text-slate-950" />
                  </div>
                </div>
                <span className="text-[11px] font-extrabold text-white tracking-wide">
                  Capturar (IA)
                </span>
              </button>

              {/* Botón Cámara Nativa */}
              <button
                type="button"
                onClick={() => refInputCamaraNativa.current?.click()}
                disabled={estaProcesandoIA}
                aria-label="Sacar foto con app de cámara"
                className="flex flex-col items-center gap-1 p-2 text-white/80 hover:text-white active:scale-95 transition-all disabled:opacity-50"
              >
                <div className="grid h-12 w-12 place-items-center rounded-2xl bg-white/10 border border-white/15 shadow-sm">
                  <Camera className="h-5 w-5" />
                </div>
                <span className="text-[11px] font-bold">Foto</span>
              </button>
            </div>

            <p className="text-center text-[10px] leading-tight text-white/50">
              La foto se optimiza en tu dispositivo antes de enviarla para lectura instantánea.
            </p>
          </div>
        ) : (
          /* Modo escaneo simple sin IA (ej: productos o stock) */
          <div className="space-y-2">
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => refInputGaleria.current?.click()}
                className="flex min-h-12 flex-1 items-center justify-center gap-2 rounded-xl bg-white/10 text-xs font-bold text-white active:scale-[0.98] hover:bg-white/15"
              >
                <ImageIcon className="h-4 w-4" />
                <span>Elegir de la galería</span>
              </button>
              <button
                type="button"
                onClick={() => refInputCamaraNativa.current?.click()}
                className="flex min-h-12 flex-1 items-center justify-center gap-2 rounded-xl bg-white/10 text-xs font-bold text-white active:scale-[0.98] hover:bg-white/15"
              >
                <Camera className="h-4 w-4" />
                <span>Sacar foto</span>
              </button>
            </div>
            <p className="text-center text-[11px] leading-snug text-white/50">
              La imagen se procesa en este dispositivo.
            </p>
          </div>
        )}
      </footer>
    </div>
  );
}
