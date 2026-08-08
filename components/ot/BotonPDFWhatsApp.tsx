"use client";

import { FileText, Printer, Send, X } from "lucide-react";
import { useEffect, useState } from "react";

import { ComprobanteOT, type DatosComprobante } from "@/components/ot/ComprobanteOT";
import { armarLinkWhatsApp } from "@/lib/whatsapp";

export type DatosOTPDF = DatosComprobante & { id: string; tipo: string };

/**
 * Vista previa del comprobante y salida a PDF o WhatsApp.
 *
 * La vista previa muestra exactamente el mismo documento que se imprime, no
 * una aproximación: es el mismo componente, con las mismas medidas en
 * milímetros. Nada de "en pantalla se veía distinto".
 */
export function BotonPDFWhatsApp({ ot }: { ot: DatosOTPDF }) {
  const [abierto, setAbierto] = useState(false);

  const linkWa = armarLinkWhatsApp({
    numero: ot.numero,
    estado: ot.estado,
    total: ot.total,
    vehiculo: ot.vehiculo,
    cliente: ot.cliente,
    tallerNombre: ot.taller.nombre,
  });

  // Escape cierra, y el fondo no scrollea mientras la vista previa está abierta.
  useEffect(() => {
    if (!abierto) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setAbierto(false);
    document.addEventListener("keydown", onKey);
    const previo = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = previo;
    };
  }, [abierto]);

  return (
    <>
      <button
        type="button"
        onClick={() => setAbierto(true)}
        className="inline-flex min-h-11 items-center gap-2 rounded-[var(--radius-sm)] bg-muted px-3.5 text-sm font-semibold text-foreground transition-transform active:scale-95"
      >
        <FileText className="h-4 w-4 text-accent" aria-hidden />
        Comprobante
      </button>

      {abierto && (
        <div
          className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 p-0 backdrop-blur-sm sm:p-6"
          role="dialog"
          aria-modal="true"
          aria-label={`Comprobante de la orden ${ot.numero}`}
        >
          <div className="mx-auto max-w-4xl">
            {/* Barra de acciones. `print:hidden` no alcanza por sí sola: el CSS
                del comprobante oculta todo lo que no sea el documento. */}
            <div className="sticky top-0 z-10 flex flex-wrap items-center justify-between gap-2 border-b border-border bg-card px-4 py-3 sm:rounded-t-[var(--radius-md)] print:hidden">
              <div className="flex items-center gap-2">
                <FileText className="h-4.5 w-4.5 text-accent" aria-hidden />
                <span className="text-sm font-semibold text-foreground">
                  Comprobante {ot.numero}
                </span>
              </div>

              <div className="flex items-center gap-2">
                {linkWa ? (
                  <a
                    href={linkWa}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex min-h-10 items-center gap-1.5 rounded-[var(--radius-sm)] bg-emerald-600 px-3 text-sm font-semibold text-white transition-transform active:scale-95"
                  >
                    <Send className="h-3.5 w-3.5" aria-hidden />
                    WhatsApp
                  </a>
                ) : (
                  <span className="text-caption text-muted-foreground">
                    Cargá el teléfono del cliente para enviarlo
                  </span>
                )}

                <button
                  type="button"
                  onClick={() => window.print()}
                  className="inline-flex min-h-10 items-center gap-1.5 rounded-[var(--radius-sm)] bg-accent px-3 text-sm font-semibold text-accent-foreground transition-transform active:scale-95"
                >
                  <Printer className="h-3.5 w-3.5" aria-hidden />
                  Imprimir o guardar
                </button>

                <button
                  type="button"
                  onClick={() => setAbierto(false)}
                  aria-label="Cerrar"
                  className="grid h-10 w-10 place-items-center rounded-[var(--radius-sm)] text-muted-foreground hover:bg-muted"
                >
                  <X className="h-4.5 w-4.5" aria-hidden />
                </button>
              </div>
            </div>

            <div className="bg-white pb-10 shadow-[var(--sombra-alta)] sm:rounded-b-[var(--radius-md)]">
              <ComprobanteOT ot={ot} />
            </div>
          </div>
        </div>
      )}
    </>
  );
}
