"use client";

import { useActionState } from "react";
import Link from "next/link";
import {
  RefreshCw,
  ShieldCheck,
  Printer,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
} from "lucide-react";
import {
  solicitarArrepentimientoAction,
  type ResultadoSolicitudLegal,
} from "@/lib/actions/legales";

interface FormularioArrepentimientoProps {
  emailDefault?: string;
  nombreDefault?: string;
}

export function FormularioArrepentimiento({
  emailDefault = "",
  nombreDefault = "",
}: FormularioArrepentimientoProps) {
  const [estado, accion, pendiente] = useActionState<
    ResultadoSolicitudLegal,
    FormData
  >(solicitarArrepentimientoAction, {});

  if (estado.ok && estado.codigoTramite) {
    return (
      <div className="rounded-2xl border-2 border-amber-500/30 bg-amber-50/60 p-6 sm:p-8 space-y-6 animate-in fade-in zoom-in-95 duration-300">
        <div className="flex items-center gap-3 text-amber-900">
          <div className="h-12 w-12 rounded-full bg-amber-100 flex items-center justify-center shrink-0">
            <CheckCircle2 className="h-6 w-6 text-amber-600" />
          </div>
          <div>
            <h2 className="text-xl font-black text-amber-950">
              Constancia de Arrepentimiento Emitida
            </h2>
            <p className="text-xs text-amber-800">
              Revocación registrada de conformidad con el Art. 2° de la Resolución 424/2020 SCI.
            </p>
          </div>
        </div>

        <div className="rounded-xl border border-amber-300 bg-white p-5 space-y-4 shadow-sm text-zinc-900">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-zinc-200 pb-3">
            <div>
              <p className="text-[11px] uppercase tracking-wider text-zinc-500 font-bold">
                Número de Trámite de Revocación
              </p>
              <p className="text-2xl font-mono font-black text-zinc-950">
                {estado.codigoTramite}
              </p>
            </div>
            <span className="self-start sm:self-center inline-flex items-center gap-1 rounded-full bg-amber-100 px-3 py-1 text-xs font-bold text-amber-800">
              <ShieldCheck className="h-3.5 w-3.5" /> Estado: Registrado
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div>
              <span className="text-zinc-500 block">Fecha y Hora de Emisión:</span>
              <strong className="text-zinc-900">{estado.fecha}</strong>
            </div>
            {estado.canceloMP && (
              <div>
                <span className="text-zinc-500 block">Suscripción Mercado Pago:</span>
                <strong className="text-emerald-700">✓ Débito cancelado</strong>
              </div>
            )}
          </div>

          <p className="text-xs text-zinc-600 leading-relaxed border-t border-zinc-100 pt-3">
            {estado.mensaje} Guardá este comprobante fehaciente de revocación. Se dará curso al reintegro de importes correspondientes de acuerdo a las modalidades previstas por la Ley 24.240.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3 pt-2">
          <button
            type="button"
            onClick={() => window.print()}
            className="inline-flex items-center gap-2 rounded-xl bg-white border border-zinc-300 px-4 py-2.5 text-xs font-bold text-zinc-800 shadow-sm hover:bg-zinc-50 transition-colors"
          >
            <Printer className="h-4 w-4" />
            Imprimir Constancia
          </button>
          <Link
            href="/"
            className="inline-flex items-center gap-2 rounded-xl bg-zinc-950 px-4 py-2.5 text-xs font-bold text-white shadow-sm hover:bg-zinc-800 transition-colors"
          >
            Volver a la portada
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </div>
    );
  }

  return (
    <form action={accion} className="space-y-6">
      {estado.error && (
        <div className="rounded-xl bg-red-50 border border-red-200 p-4 text-xs font-semibold text-red-800 flex items-center gap-2">
          <AlertTriangle className="h-4 w-4 text-red-600 shrink-0" />
          <span>{estado.error}</span>
        </div>
      )}

      <div className="space-y-4">
        <div>
          <label htmlFor="email" className="block text-xs font-bold uppercase tracking-wider text-zinc-700 mb-1.5">
            Correo Electrónico con el que Contrataste *
          </label>
          <input
            id="email"
            name="email"
            type="email"
            required
            defaultValue={emailDefault}
            placeholder="vos@taller.com"
            className="w-full rounded-xl border border-zinc-300 bg-white px-3.5 py-2.5 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-zinc-950 focus:outline-none focus:ring-1 focus:ring-zinc-950"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label htmlFor="nombre" className="block text-xs font-bold uppercase tracking-wider text-zinc-700 mb-1.5">
              Nombre y Apellido / Razón Social *
            </label>
            <input
              id="nombre"
              name="nombre"
              type="text"
              required
              defaultValue={nombreDefault}
              placeholder="Tu nombre completo"
              className="w-full rounded-xl border border-zinc-300 bg-white px-3.5 py-2.5 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-zinc-950 focus:outline-none focus:ring-1 focus:ring-zinc-950"
            />
          </div>
          <div>
            <label htmlFor="telefono" className="block text-xs font-bold uppercase tracking-wider text-zinc-700 mb-1.5">
              Teléfono de Contacto (Opcional)
            </label>
            <input
              id="telefono"
              name="telefono"
              type="tel"
              placeholder="11 2345-6789"
              className="w-full rounded-xl border border-zinc-300 bg-white px-3.5 py-2.5 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-zinc-950 focus:outline-none focus:ring-1 focus:ring-zinc-950"
            />
          </div>
        </div>

        <div>
          <label htmlFor="motivo" className="block text-xs font-bold uppercase tracking-wider text-zinc-700 mb-1.5">
            Motivo de la Revocación (Opcional)
          </label>
          <textarea
            id="motivo"
            name="motivo"
            rows={3}
            placeholder="No es obligatorio justificar el motivo dentro de los 10 días, pero tus comentarios nos ayudan a mejorar."
            className="w-full rounded-xl border border-zinc-300 bg-white px-3.5 py-2.5 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-zinc-950 focus:outline-none focus:ring-1 focus:ring-zinc-950 resize-none"
          />
        </div>

        <div className="pt-2">
          <label className="flex items-start gap-2.5 cursor-pointer text-xs text-zinc-700 select-none">
            <input
              type="checkbox"
              required
              className="mt-0.5 rounded border-zinc-300 text-amber-600 focus:ring-amber-500 h-4 w-4"
            />
            <span>
              Manifiesto mi voluntad expresa de revocar la contratación efectuada dentro del plazo legal de 10 (diez) días corridos conforme a la Resolución 424/2020 de la Secretaría de Comercio Interior.
            </span>
          </label>
        </div>
      </div>

      <div className="pt-2">
        <button
          type="submit"
          disabled={pendiente}
          className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-sm px-6 py-3 shadow-md shadow-amber-600/20 transition-all disabled:opacity-50"
        >
          {pendiente ? (
            <>
              <RefreshCw className="h-4 w-4 animate-spin" />
              <span>Registrando Revocación...</span>
            </>
          ) : (
            <>
              <RefreshCw className="h-4 w-4" />
              <span>Confirmar Arrepentimiento de Compra</span>
            </>
          )}
        </button>
      </div>
    </form>
  );
}
