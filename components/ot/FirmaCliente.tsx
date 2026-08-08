"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Check, Eraser, PenLine } from "lucide-react";

import { useIsla } from "@/components/isla/IslaContext";
import { guardarFirma } from "@/lib/actions/fotos";
import { crearClienteNavegador } from "@/lib/supabase/client";
import { BUCKET_FOTOS } from "@/lib/storage";

/**
 * Firma del cliente sobre el vidrio del celular.
 *
 * Es la conformidad de que el auto se entregó o se recibió en el estado que
 * dice la orden. Junto con las fotos de daños previos, es lo que evita la
 * discusión de "esto no lo tenía".
 */
export function FirmaCliente({
  otId,
  tallerId,
  momento = "recepcion",
  yaFirmada = false,
}: {
  otId: string;
  tallerId: string;
  momento?: "recepcion" | "entrega";
  yaFirmada?: boolean;
}) {
  const { notificar } = useIsla();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const dibujando = useRef(false);
  const [tieneTrazo, setTieneTrazo] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [listo, setListo] = useState(yaFirmada);

  /**
   * El canvas se dimensiona en píxeles reales del dispositivo.
   *
   * Sin multiplicar por devicePixelRatio, en un celular la firma sale borrosa:
   * el canvas mide en píxeles CSS y la pantalla tiene 2 o 3 veces esa densidad.
   */
  const preparar = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    if (!rect.width) return;

    canvas.width = Math.round(rect.width * dpr);
    canvas.height = Math.round(rect.height * dpr);

    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.scale(dpr, dpr);
    ctx.lineWidth = 2.2;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.strokeStyle = "#0f172a";
  }, []);

  useEffect(() => {
    preparar();
    window.addEventListener("resize", preparar);
    return () => window.removeEventListener("resize", preparar);
  }, [preparar]);

  const punto = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
  };

  const onDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    // Con captura, el trazo sigue aunque el dedo se salga del recuadro.
    e.currentTarget.setPointerCapture(e.pointerId);
    const ctx = e.currentTarget.getContext("2d");
    if (!ctx) return;
    const p = punto(e);
    ctx.beginPath();
    ctx.moveTo(p.x, p.y);
    dibujando.current = true;
    setTieneTrazo(true);
  };

  const onMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!dibujando.current) return;
    const ctx = e.currentTarget.getContext("2d");
    if (!ctx) return;
    const p = punto(e);
    ctx.lineTo(p.x, p.y);
    ctx.stroke();
  };

  const onUp = () => {
    dibujando.current = false;
  };

  function limpiar() {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setTieneTrazo(false);
  }

  async function guardar() {
    const canvas = canvasRef.current;
    if (!canvas || !tieneTrazo) return;

    setGuardando(true);
    try {
      const blob = await new Promise<Blob | null>((r) => canvas.toBlob(r, "image/png"));
      if (!blob) throw new Error("No se pudo generar la firma");

      // PNG y no WebP: es un trazo sobre fondo transparente, y el PNG lo
      // conserva sin los halos que deja la compresión con pérdida.
      const path = `${tallerId}/${otId}/firma-${momento}-${crypto.randomUUID()}.png`;
      const supabase = crearClienteNavegador();

      const { error } = await supabase.storage
        .from(BUCKET_FOTOS)
        .upload(path, blob, { contentType: "image/png", upsert: false });
      if (error) throw new Error(error.message);

      const res = await guardarFirma(otId, momento, path);
      if (res.error) throw new Error(res.error);

      setListo(true);
      notificar({ tipo: "exito", mensaje: "Firma guardada" });
    } catch (e) {
      notificar({
        tipo: "error",
        mensaje: e instanceof Error ? e.message : "No se pudo guardar la firma",
      });
    } finally {
      setGuardando(false);
    }
  }

  if (listo) {
    return (
      <div className="tarjeta flex items-center gap-2.5 p-4">
        <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-estado-ok/10 text-estado-ok">
          <Check className="h-4.5 w-4.5" aria-hidden />
        </span>
        <span className="text-sm font-medium text-foreground">
          Conformidad de {momento === "recepcion" ? "recepción" : "entrega"} firmada
        </span>
        <button
          type="button"
          onClick={() => {
            setListo(false);
            setTieneTrazo(false);
            requestAnimationFrame(preparar);
          }}
          className="ml-auto text-caption font-medium text-accent underline underline-offset-2"
        >
          Volver a firmar
        </button>
      </div>
    );
  }

  return (
    <section className="tarjeta space-y-3 p-4">
      <div className="flex items-center gap-2">
        <PenLine className="h-4 w-4 text-accent" aria-hidden />
        <h2 className="t-seccion">
          Firma de {momento === "recepcion" ? "recepción" : "entrega"}
        </h2>
      </div>

      <p className="text-caption text-muted-foreground">
        Que el cliente firme con el dedo sobre el recuadro.
      </p>

      <canvas
        ref={canvasRef}
        onPointerDown={onDown}
        onPointerMove={onMove}
        onPointerUp={onUp}
        onPointerCancel={onUp}
        // touch-none es obligatorio: sin esto el navegador interpreta el trazo
        // como un scroll y la firma se corta a la mitad.
        className="h-40 w-full touch-none rounded-[var(--radius-sm)] border border-dashed border-border bg-white"
      />

      <div className="flex gap-2">
        <button
          type="button"
          onClick={limpiar}
          disabled={!tieneTrazo || guardando}
          className="flex min-h-11 flex-1 items-center justify-center gap-2 rounded-[var(--radius-sm)] bg-muted text-sm font-medium text-foreground transition-transform active:scale-[0.98] disabled:opacity-50"
        >
          <Eraser className="h-4 w-4" aria-hidden />
          Borrar
        </button>
        <button
          type="button"
          onClick={guardar}
          disabled={!tieneTrazo || guardando}
          className="flex min-h-11 flex-[2] items-center justify-center gap-2 rounded-[var(--radius-sm)] bg-accent text-sm font-semibold text-accent-foreground transition-transform active:scale-[0.98] disabled:opacity-50"
        >
          <Check className="h-4 w-4" strokeWidth={2.5} aria-hidden />
          {guardando ? "Guardando…" : "Guardar firma"}
        </button>
      </div>
    </section>
  );
}
