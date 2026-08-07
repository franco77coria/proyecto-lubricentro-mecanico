"use client";

import { FileText, Printer, Send, X } from "lucide-react";
import { useState } from "react";

import { armarLinkWhatsApp } from "@/lib/whatsapp";

interface ItemOT {
  descripcion: string;
  tipo: string;
  cantidad: number;
  precio_unitario: number;
  subtotal: number;
}

interface ChecklistItemOT {
  etiqueta_snapshot: string;
  estado: "ok" | "observado" | "critico" | "no_aplica" | null;
  nota?: string | null;
}

export interface DatosOTPDF {
  id: string;
  numero: string;
  fecha_ingreso: string;
  estado: string;
  tipo: string;
  km_ingreso?: number | null;
  observaciones?: string | null;
  total_mano_obra: number;
  total_repuestos: number;
  total: number;
  taller: {
    nombre: string;
    direccion?: string | null;
    telefono?: string | null;
    cuit?: string | null;
  };
  vehiculo: {
    patente: string;
    marca?: string | null;
    modelo?: string | null;
    anio?: number | null;
    color?: string | null;
  };
  cliente?: {
    nombre: string;
    apellido?: string | null;
    telefono?: string | null;
  } | null;
  items?: ItemOT[];
  checklist?: ChecklistItemOT[];
}

export function BotonPDFWhatsApp({ ot }: { ot: DatosOTPDF }) {
  const [modalAbierto, setModalAbierto] = useState(false);

  const linkWa = armarLinkWhatsApp({
    numero: ot.numero,
    estado: ot.estado,
    total: ot.total,
    vehiculo: ot.vehiculo,
    cliente: ot.cliente,
    tallerNombre: ot.taller.nombre,
  });

  const handlePrint = () => {
    window.print();
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setModalAbierto(true)}
        className="inline-flex min-h-11 items-center gap-2 rounded-[var(--radius-sm)] bg-muted px-3 text-sm font-semibold text-foreground transition-transform active:scale-95"
      >
        <FileText className="h-4 w-4 text-accent" />
        <span>Comprobante PDF</span>
      </button>

      {modalAbierto && (
        <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-slate-900/60 p-4 backdrop-blur-sm print:p-0 print:bg-white print:static">
          <div className="relative flex max-h-[90vh] w-full max-w-3xl flex-col rounded-2xl bg-card shadow-2xl print:max-h-none print:shadow-none print:w-full print:rounded-none">
            {/* Header modal */}
            <div className="flex items-center justify-between border-b border-border p-4 print:hidden">
              <div className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-accent" />
                <h2 className="text-lg font-semibold text-foreground">
                  Vista Previa PDF — OT #{ot.numero}
                </h2>
              </div>
              <div className="flex items-center gap-2">
                {linkWa ? (
                  <a
                    href={linkWa}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex h-9 items-center gap-2 rounded-lg bg-emerald-600 px-3 text-xs font-semibold text-white shadow transition-transform hover:bg-emerald-700 active:scale-95"
                  >
                    <Send className="h-3.5 w-3.5" />
                    Enviar por WhatsApp
                  </a>
                ) : (
                  <span className="text-xs text-muted-foreground" title="Sin teléfono de cliente">
                    WhatsApp no disponible
                  </span>
                )}
                <button
                  type="button"
                  onClick={handlePrint}
                  className="inline-flex h-9 items-center gap-2 rounded-lg bg-primary px-3 text-xs font-semibold text-white shadow transition-transform active:scale-95"
                >
                  <Printer className="h-3.5 w-3.5" />
                  Imprimir PDF
                </button>
                <button
                  type="button"
                  onClick={() => setModalAbierto(false)}
                  className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            {/* Documento Printable */}
            <div className="printable-document overflow-y-auto p-8 text-slate-800 print:overflow-visible print:p-0">
              {/* Encabezado Taller */}
              <div className="flex items-start justify-between border-b border-slate-200 pb-6">
                <div>
                  <h1 className="text-2xl font-bold text-slate-900">{ot.taller.nombre}</h1>
                  {ot.taller.direccion && (
                    <p className="text-sm text-slate-600">{ot.taller.direccion}</p>
                  )}
                  {ot.taller.telefono && (
                    <p className="text-sm text-slate-600">Tel: {ot.taller.telefono}</p>
                  )}
                  {ot.taller.cuit && (
                    <p className="text-xs text-slate-400">CUIT: {ot.taller.cuit}</p>
                  )}
                </div>
                <div className="text-right">
                  <span className="inline-block rounded-md bg-slate-900 px-3 py-1 text-xs font-bold uppercase tracking-wider text-white">
                    ORDEN DE TRABAJO
                  </span>
                  <p className="mt-2 text-2xl font-black text-slate-900">#{ot.numero}</p>
                  <p className="text-xs text-slate-500">
                    Fecha: {new Date(ot.fecha_ingreso).toLocaleDateString("es-AR")}
                  </p>
                </div>
              </div>

              {/* Datos Cliente y Vehículo */}
              <div className="mt-6 grid grid-cols-2 gap-6 rounded-xl bg-slate-50 p-4 border border-slate-200">
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-slate-500">Cliente</p>
                  <p className="mt-1 font-semibold text-slate-900">
                    {ot.cliente ? `${ot.cliente.nombre} ${ot.cliente.apellido || ""}` : "Consumidor Final"}
                  </p>
                  {ot.cliente?.telefono && (
                    <p className="text-xs text-slate-600">Tel: {ot.cliente.telefono}</p>
                  )}
                </div>
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-slate-500">Vehículo</p>
                  <p className="mt-1 font-semibold text-slate-900">
                    {[ot.vehiculo.marca, ot.vehiculo.modelo, ot.vehiculo.anio]
                      .filter(Boolean)
                      .join(" ")}
                  </p>
                  <p className="text-sm font-bold text-accent">Patente: {ot.vehiculo.patente}</p>
                  {ot.km_ingreso != null && (
                    <p className="text-xs text-slate-600">KM Ingreso: {ot.km_ingreso.toLocaleString("es-AR")} km</p>
                  )}
                </div>
              </div>

              {/* Items / Trabajos */}
              <div className="mt-6">
                <h3 className="text-sm font-bold uppercase tracking-wider text-slate-700">Detalle de Trabajos y Repuestos</h3>
                <table className="mt-2 w-full border-collapse text-left text-sm">
                  <thead>
                    <tr className="border-b-2 border-slate-300 bg-slate-100 text-xs uppercase font-bold text-slate-600">
                      <th className="py-2 px-3">Descripción</th>
                      <th className="py-2 px-3">Tipo</th>
                      <th className="py-2 px-3 text-right">Cant.</th>
                      <th className="py-2 px-3 text-right">P. Unit.</th>
                      <th className="py-2 px-3 text-right">Subtotal</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {ot.items && ot.items.length > 0 ? (
                      ot.items.map((it, idx) => (
                        <tr key={idx} className="hover:bg-slate-50 print:break-inside-avoid">
                          <td className="py-2 px-3 font-medium text-slate-900">{it.descripcion}</td>
                          <td className="py-2 px-3 text-xs capitalize text-slate-500">{it.tipo.replace("_", " ")}</td>
                          <td className="py-2 px-3 text-right text-slate-700">{it.cantidad}</td>
                          <td className="py-2 px-3 text-right text-slate-700">$ {(it.precio_unitario || 0).toLocaleString("es-AR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                          <td className="py-2 px-3 text-right font-semibold text-slate-900">$ {(it.subtotal || 0).toLocaleString("es-AR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={5} className="py-4 text-center text-xs italic text-slate-400">
                          Sin ítems cargados
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* Summary Checklist */}
              {ot.checklist && ot.checklist.length > 0 && (
                <div className="mt-6 border-t border-slate-200 pt-4 print:break-inside-avoid">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">Resumen de Inspección</h3>
                  <div className="mt-2 grid grid-cols-2 gap-2 text-xs">
                    {ot.checklist.map((chk, i) => (
                      <div key={i} className="flex items-center justify-between rounded bg-slate-50 px-2 py-1">
                        <span className="text-slate-700">{chk.etiqueta_snapshot}</span>
                        <span className={`font-bold capitalize ${
                          chk.estado === "ok" ? "text-emerald-700" :
                          chk.estado === "critico" ? "text-red-700" :
                          chk.estado === "observado" ? "text-amber-700" : "text-slate-400"
                        }`}>
                          {chk.estado || "No rev."}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Totales */}
              <div className="mt-6 flex justify-end border-t-2 border-slate-900 pt-4 print:break-inside-avoid">
                <div className="w-64 space-y-2 text-sm">
                  <div className="flex justify-between text-slate-600">
                    <span>Mano de obra:</span>
                    <span>$ {(ot.total_mano_obra || 0).toLocaleString("es-AR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                  </div>
                  <div className="flex justify-between text-slate-600">
                    <span>Repuestos / Insumos:</span>
                    <span>$ {(ot.total_repuestos || 0).toLocaleString("es-AR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                  </div>
                  <div className="flex justify-between border-t border-slate-300 pt-2 text-lg font-black text-slate-900">
                    <span>TOTAL:</span>
                    <span className="text-accent">$ {(ot.total || 0).toLocaleString("es-AR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="mt-8 border-t border-slate-200 pt-4 text-center text-xs text-slate-400 print:break-inside-avoid">
                <p>Comprobante generado por {ot.taller.nombre} — Gracias por su confianza.</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Estilos de Impresión */}
      <style jsx global>{`
        @media print {
          @page {
            size: A4 portrait;
            margin: 10mm;
          }
          body * {
            visibility: hidden !important;
          }
          .printable-document, .printable-document * {
            visibility: visible !important;
          }
          .printable-document {
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            width: 100% !important;
            padding: 0 !important;
            background: white !important;
            color: black !important;
          }
        }
      `}</style>
    </>
  );
}
