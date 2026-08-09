"use client";

import { Camera, CircleAlert, ImageUp, Loader2, X } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";

import { leerCodigo, type FormatosCodigo } from "@/lib/codigo";

type Estado = "iniciando" | "escaneando" | "leyendo" | "sin-camara";

/** Cada cuánto se intenta leer un cuadro. */
const MS_ENTRE_LECTURAS = 350;

/**
 * Lector de códigos con la cámara.
 *
 * Se abre a pantalla completa: al lado del auto, con el celular en una mano y
 * la cédula en la otra, cualquier cosa más chica que la pantalla entera es
 * imposible de apuntar.
 *
 * SIEMPRE ofrece el camino de la foto además del vivo, y no como parche: la
 * cámara en vivo necesita HTTPS (o localhost), así que un taller entrando al
 * sistema por IP local en la red del negocio no la tiene. El `<input capture>`
 * funciona en los dos casos. Un lector que en algunos dispositivos no abre y no
 * explica por qué se deja de usar y se vuelve a tipear la patente.
 */
export function LectorCodigo({
  titulo,
  ayuda,
  formatos,
  onLeido,
  onCerrar,
}: {
  titulo: string;
  ayuda: string;
  formatos: FormatosCodigo;
  onLeido: (texto: string) => void;
  onCerrar: () => void;
}) {
  const refVideo = useRef<HTMLVideoElement>(null);
  const refCanvas = useRef<HTMLCanvasElement>(null);
  // Evita que el bucle siga leyendo (y que se llame a onLeido dos veces) entre
  // que se encuentra un código y que el componente se desmonta.
  const refCortado = useRef(false);
  const [estado, setEstado] = useState<Estado>("iniciando");
  const [aviso, setAviso] = useState<string | null>(null);

  const procesar = useCallback(
    async (imagen: ImageData | Blob) => {
      const texto = await leerCodigo(imagen, formatos);
      if (!texto || refCortado.current) return false;
      refCortado.current = true;
      onLeido(texto);
      return true;
    },
    [formatos, onLeido],
  );

  // Cámara en vivo. Todo el setState ocurre dentro de callbacks asincrónicos:
  // el cuerpo del efecto no toca estado.
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
            // Un cuadro borroso que no se puede decodificar no es un error:
            // es el caso normal mientras el usuario está apuntando.
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
          // La de atrás: la cédula se apoya sobre el capó, no se selfea.
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
        bucle();
      } catch {
        setEstado("sin-camara");
        setAviso(
          window.isSecureContext
            ? "No se pudo abrir la cámara. Revisá el permiso del navegador."
            : "La cámara en vivo necesita HTTPS. Sacá una foto y la leemos igual.",
        );
      }
    })();

    return () => {
      refCortado.current = true;
      if (timer) clearTimeout(timer);
      stream?.getTracks().forEach((t) => t.stop());
    };
  }, [procesar]);

  async function desdeArchivo(e: React.ChangeEvent<HTMLInputElement>) {
    const archivo = e.target.files?.[0];
    if (!archivo) return;
    setEstado("leyendo");
    try {
      const encontrado = await procesar(archivo);
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
      className="fixed inset-0 z-[60] flex flex-col bg-slate-950"
      role="dialog"
      aria-modal="true"
      aria-label={titulo}
    >
      <header className="flex items-start justify-between gap-3 p-4 pt-[calc(var(--safe-top)+1rem)] text-white">
        <div>
          <h2 className="text-base font-bold">{titulo}</h2>
          <p className="mt-0.5 text-xs text-white/70">{ayuda}</p>
        </div>
        <button
          type="button"
          onClick={onCerrar}
          aria-label="Cerrar el lector"
          className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-white/10 text-white active:scale-95"
        >
          <X className="h-5 w-5" aria-hidden />
        </button>
      </header>

      <div className="relative flex-1 overflow-hidden">
        <video
          ref={refVideo}
          playsInline
          muted
          className="h-full w-full object-cover"
        />
        <canvas ref={refCanvas} className="hidden" />

        {/* Marco de encuadre. Es 3:2 apaisado porque el PDF417 de la cédula es
            una banda ancha y baja: un cuadrado invita a acercarse de más y a
            cortarle los extremos, que es el motivo más común de que no lea. */}
        {estado === "escaneando" && (
          <div className="pointer-events-none absolute inset-0 grid place-items-center p-6">
            <div className="aspect-[3/2] w-full max-w-md rounded-2xl border-2 border-white/80 shadow-[0_0_0_100vmax_rgba(2,6,23,0.55)]" />
          </div>
        )}

        {estado !== "escaneando" && (
          <div className="absolute inset-0 grid place-items-center bg-slate-950/90 p-6 text-center">
            {estado === "sin-camara" ? (
              <div className="max-w-xs space-y-2 text-white">
                <CircleAlert className="mx-auto h-8 w-8 text-amber-400" aria-hidden />
                <p className="text-sm font-semibold">{aviso}</p>
              </div>
            ) : (
              <div className="space-y-2 text-white/80">
                <Loader2 className="mx-auto h-7 w-7 animate-spin" aria-hidden />
                <p className="text-sm font-semibold">
                  {estado === "leyendo" ? "Leyendo la foto…" : "Abriendo la cámara…"}
                </p>
              </div>
            )}
          </div>
        )}
      </div>

      <footer className="space-y-2 p-4 pb-[calc(var(--safe-bottom)+1rem)]">
        <label className="flex min-h-12 w-full cursor-pointer items-center justify-center gap-2 rounded-xl bg-white/10 text-sm font-bold text-white active:scale-[0.98]">
          {estado === "sin-camara" ? (
            <Camera className="h-4 w-4" aria-hidden />
          ) : (
            <ImageUp className="h-4 w-4" aria-hidden />
          )}
          Sacar una foto en vez de escanear
          <input
            type="file"
            accept="image/*"
            capture="environment"
            onChange={desdeArchivo}
            className="sr-only"
          />
        </label>
        <p className="text-center text-[11px] leading-snug text-white/50">
          La imagen se procesa en este dispositivo. No se sube a ningún servidor.
        </p>
      </footer>
    </div>
  );
}
