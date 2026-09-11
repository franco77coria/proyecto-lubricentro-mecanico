"use client";

import { useActionState } from "react";
import Link from "next/link";
import {
  XCircle,
  ShieldCheck,
  Printer,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  RefreshCcw,
} from "lucide-react";
import {
  solicitarBajaAction,
  type ResultadoSolicitudLegal,
} from "@/lib/actions/legales";

interface FormularioBajaProps {
  emailDefault?: string;
  nombreDefault?: string;
  nombreTaller?: string;
  tieneSuscripcionActiva?: boolean;
  esDueno?: boolean;
}

export function FormularioBaja({
  emailDefault = "",
  nombreDefault = "",
  nombreTaller = "",
  tieneSuscripcionActiva = false,
  esDueno = false,
}: FormularioBajaProps) {
  const [estado, accion, pendiente] = useActionState<ResultadoSolicitudLegal, FormData>(
    solicitarBajaAction,
    {}
  );

  if (estado.ok && estado.codigoTramite) {
    return (
      <div className="rounded-2xl border-2 border-emerald-500/30 bg-emerald-50/60 p-6 sm:p-8 space-y-6 animate-in fade-in zoom-in-95 duration-300">
        <div className="flex items-center gap-3 text-emerald-800">
          <div className="h-12 w-12 rounded-full bg-emerald-100 flex items-center justify-center shrink-0">
            <CheckCircle2 className="h-6 w-6 text-emerald-600" />
          </div>
          <div>
            <h2 className="text-xl font-black text-emerald-950">
              Solicitud de Baja Registrada
            </h2>
            <p className="text-xs text-emerald-700">
              Constancia oficial conforme al Art. 10 ter de la Ley 24.240 y Res. 271/2020.
            </p>
          </div>
        </div>

        {/* Recuadro de Comprobante Oficial */}
        <div className="rounded-xl border border-emerald-300 bg-white p-5 space-y-4 shadow-sm text-zinc-900">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-zinc-200 pb-3">
            <div>
              <p className="text-[11px] uppercase tracking-wider text-zinc-500 font-bold">
                Código Único de Identificación de Trámite
              </p>
              <p className="text-2xl font-mono font-black text-zinc-950">
                {estado.codigoTramite}
              </p>
            </div>
            <span className="self-start sm:self-center inline-flex items-center gap-1 rounded-full bg-emerald-100 px-3 py-1 text-xs font-bold text-emerald-800">
              <ShieldCheck className="h-3.5 w-3.5" /> Estado: Procesada
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div>
              <span className="text-zinc-500 block">Fecha y Hora de Emisión:</span>
              <strong className="text-zinc-900">{estado.fecha}</strong>
            </div>
            {estado.canceloMP && (
              <div>
                <span className="text-zinc-500 block">Débito Mercado Pago:</span>
                <strong className="text-emerald-700">✓ Suscripción cancelada con éxito</strong>
              </div>
            )}
          </div>

          <p className="text-xs text-zinc-600 leading-relaxed border-t border-zinc-100 pt-3">
            {estado.mensaje} Guardá o imprimí este código como constancia fehaciente. Conservarás acceso a tus datos durante el período de gracia para descargar tu información histórica.
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
      {/* Alerta si está autenticado con taller */}
      {nombreTaller && (
        <div className="rounded-xl bg-blue-50 border border-blue-200 p-4 text-xs text-blue-900 flex items-start gap-3">
          <ShieldCheck className="h-5 w-5 text-blue-600 shrink-0 mt-0.5" />
          <div>
            <p className="font-bold">Sesión identificada: {nombreTaller} {esDueno ? "(Titular)" : ""}</p>
            <p className="text-blue-700 mt-0.5">
              {tieneSuscripcionActiva
                ? "Tenés una suscripción activa. Al enviar esta solicitud, se cancelará inmediatamente el débito automático en Mercado Pago."
                : "Tu taller se encuentra en período de prueba o sin débito automático activo."}
            </p>
          </div>
        </div>
      )}

      {estado.error && (
        <div className="rounded-xl bg-red-50 border border-red-200 p-4 text-xs font-semibold text-red-800 flex items-center gap-2">
          <AlertTriangle className="h-4 w-4 text-red-600 shrink-0" />
          <span>{estado.error}</span>
        </div>
      )}

      <div className="space-y-4">
        <div>
          <label htmlFor="email" className="block text-xs font-bold uppercase tracking-wider text-zinc-700 mb-1.5">
            Correo Electrónico de la Cuenta *
          </label>
          <input
            id="email"
            name="email"
            type="email"
            required
            defaultValue={emailDefault}
            placeholder="ejemplo@taller.com"
            className="w-full rounded-xl border border-zinc-300 bg-white px-3.5 py-2.5 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-zinc-950 focus:outline-none focus:ring-1 focus:ring-zinc-950"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label htmlFor="nombre" className="block text-xs font-bold uppercase tracking-wider text-zinc-700 mb-1.5">
              Nombre Completo o Razón Social *
            </label>
            <input
              id="nombre"
              name="nombre"
              type="text"
              required
              defaultValue={nombreDefault}
              placeholder="Tu nombre o Razón Social"
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
            Motivo de la Baja *
          </label>
          <select
            id="motivo"
            name="motivo"
            required
            defaultValue=""
            className="w-full rounded-xl border border-zinc-300 bg-white px-3.5 py-2.5 text-sm text-zinc-900 focus:border-zinc-950 focus:outline-none focus:ring-1 focus:ring-zinc-950"
          >
            <option value="" disabled>
              Seleccioná una opción...
            </option>
            <option value="Cierre de taller o lubricentro">Cierre definitivo o temporal de taller / lubricentro</option>
            <option value="Costos o presupuesto">Costos o adecuación presupuestaria</option>
            <option value="Falta de uso del sistema">No estoy utilizando el sistema actualmente</option>
            <option value="Cambio a otro software">Migración a otro software o planilla manual</option>
            <option value="Dificultad de uso">Dificultad en la adopción por parte del equipo</option>
            <option value="Otro motivo">Otro motivo</option>
          </select>
        </div>

        <div>
          <label htmlFor="detalle" className="block text-xs font-bold uppercase tracking-wider text-zinc-700 mb-1.5">
            Comentarios Adicionales (Opcional)
          </label>
          <textarea
            id="detalle"
            name="detalle"
            rows={3}
            placeholder="¿Hay algo que podamos mejorar o alguna duda que quieras transmitirnos?"
            className="w-full rounded-xl border border-zinc-300 bg-white px-3.5 py-2.5 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-zinc-950 focus:outline-none focus:ring-1 focus:ring-zinc-950 resize-none"
          />
        </div>

        <div className="pt-2">
          <label className="flex items-start gap-2.5 cursor-pointer text-xs text-zinc-700 select-none">
            <input
              type="checkbox"
              required
              className="mt-0.5 rounded border-zinc-300 text-red-600 focus:ring-red-500 h-4 w-4"
            />
            <span>
              Confirmo que deseo solicitar la rescisión de mi cuenta y la cancelación de cualquier suscripción o cobro recurrente activo en Mercado Pago, conforme al Art. 10 ter de la Ley 24.240.
            </span>
          </label>
        </div>
      </div>

      <div className="pt-2">
        <button
          type="submit"
          disabled={pendiente}
          className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-sm px-6 py-3 shadow-md shadow-red-500/20 transition-all disabled:opacity-50"
        >
          {pendiente ? (
            <>
              <RefreshCcw className="h-4 w-4 animate-spin" />
              <span>Procesando Baja...</span>
            </>
          ) : (
            <>
              <XCircle className="h-4 w-4" />
              <span>Confirmar y Procesar Solicitud de Baja</span>
            </>
          )}
        </button>
      </div>
    </form>
  );
}
