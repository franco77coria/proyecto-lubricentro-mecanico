"use client";

import { FileText, Printer, Send, X } from "lucide-react";
import { useEffect, useState } from "react";

import { ComprobanteOT, type DatosComprobante } from "@/components/ot/ComprobanteOT";
import { armarLinkWhatsApp } from "@/lib/whatsapp";
import { useI18n } from "@/lib/i18n/I18nContext";

export type DatosOTPDF = DatosComprobante & { id: string; tipo: string };

/**
 * Vista previa del comprobante y salida a PDF o WhatsApp.
 *
 * La vista previa muestra exactamente el mismo documento que se imprime, no
 * una aproximación: es el mismo componente, con las mismas medidas en
 * milímetros. Nada de "en pantalla se veía distinto".
 */
export function BotonPDFWhatsApp({ ot }: { ot: DatosOTPDF }) {
  const { idioma, moneda } = useI18n();
  const [abierto, setAbierto] = useState(false);
  const [modo, setModo] = useState<"a4" | "termico">("a4");

  const linkWa = armarLinkWhatsApp({
    numero: ot.numero,
    estado: ot.estado,
    total: ot.total,
    totalManoObra: ot.total_mano_obra,
    totalRepuestos: ot.total_repuestos,
    vehiculo: ot.vehiculo,
    cliente: ot.cliente,
    tallerNombre: ot.taller.nombre,
    idioma,
    moneda,
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
        className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-card border border-border/80 px-3.5 text-xs font-bold text-foreground transition-transform active:scale-95 hover:border-accent"
      >
        <FileText className="h-4 w-4 text-accent" aria-hidden />
        <span>Comprobante</span>
      </button>

      {abierto && (
        <div
          className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/70 p-0 backdrop-blur-sm sm:p-6"
          role="dialog"
          aria-modal="true"
          aria-label={`Comprobante de la orden ${ot.numero}`}
        >
          <div className="mx-auto max-w-4xl">
            <div className="sticky top-0 z-10 flex flex-wrap items-center justify-between gap-2 border-b border-border bg-card px-4 py-3 sm:rounded-t-2xl print:hidden">
              <div className="flex items-center gap-3">
                <FileText className="h-5 w-5 text-accent" aria-hidden />
                <span className="text-sm font-black text-foreground">
                  Comprobante #{ot.numero}
                </span>

                <div className="flex rounded-xl bg-muted p-0.5 border border-border">
                  <button
                    type="button"
                    onClick={() => setModo("a4")}
                    className={`rounded-lg px-2.5 py-1 text-xs font-bold transition-all ${
                      modo === "a4" ? "bg-card text-accent shadow-sm" : "text-muted-foreground"
                    }`}
                  >
                    Hoja A4
                  </button>
                  <button
                    type="button"
                    onClick={() => setModo("termico")}
                    className={`rounded-lg px-2.5 py-1 text-xs font-bold transition-all ${
                      modo === "termico" ? "bg-card text-accent shadow-sm" : "text-muted-foreground"
                    }`}
                  >
                    Ticket 80mm
                  </button>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {linkWa ? (
                  <a
                    href={linkWa}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex min-h-10 items-center gap-1.5 rounded-xl bg-emerald-600 px-3.5 text-xs font-bold text-white transition-transform active:scale-95 shadow-sm"
                  >
                    <Send className="h-3.5 w-3.5" aria-hidden />
                    <span>WhatsApp</span>
                  </a>
                ) : (
                  <span className="text-caption text-muted-foreground">
                    Cargá el teléfono para enviarlo
                  </span>
                )}

                <button
                  type="button"
                  onClick={() => window.print()}
                  className="inline-flex min-h-10 items-center gap-1.5 rounded-xl bg-accent px-4 text-xs font-bold text-white transition-transform active:scale-95 shadow-sm"
                >
                  <Printer className="h-3.5 w-3.5" aria-hidden />
                  <span>Imprimir / PDF</span>
                </button>

                <button
                  type="button"
                  onClick={() => setAbierto(false)}
                  aria-label="Cerrar"
                  className="grid h-10 w-10 place-items-center rounded-xl text-muted-foreground hover:bg-muted"
                >
                  <X className="h-5 w-5" aria-hidden />
                </button>
              </div>
            </div>

            <div className="bg-white pb-10 shadow-2xl sm:rounded-b-2xl flex justify-center">
              <ComprobanteOT ot={ot} modo={modo} />
            </div>
          </div>
        </div>
      )}
    </>
  );
}
