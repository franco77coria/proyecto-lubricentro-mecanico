import type { Metadata } from "next";
import Link from "next/link";
import { RefreshCw, HelpCircle } from "lucide-react";
import { obtenerSesion } from "@/lib/supabase/server";
import { FormularioArrepentimiento } from "./FormularioArrepentimiento";

export const metadata: Metadata = {
  title: "Botón de Arrepentimiento — Resolución 424/2020",
  description:
    "Formulario oficial de revocación de contratación y arrepentimiento conforme a la Resolución 424/2020 de la Secretaría de Comercio Interior.",
};

export default async function ArrepentimientoPage() {
  const sesion = await obtenerSesion();
  const emailDefault = sesion?.user?.email ?? "";
  const nombreDefault = sesion?.perfil?.nombre ?? "";

  return (
    <article className="max-w-none space-y-8">
      {/* Encabezado */}
      <div className="border-b border-black/[0.08] pb-6 space-y-3">
        <div className="flex items-center gap-2 text-xs font-bold text-amber-700 uppercase tracking-wider">
          <RefreshCw className="w-4 h-4" />
          <span>Resolución N° 424/2020 SCI — Derecho de Revocación</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-black text-zinc-950 tracking-tight">
          Botón de Arrepentimiento
        </h1>
        <p className="text-xs text-zinc-500">
          Revocación de la aceptación de servicios contratados a distancia dentro de los 10 (diez) días corridos.
        </p>
      </div>

      <div className="rounded-2xl bg-zinc-50 border border-zinc-200/80 p-4 sm:p-5 text-xs sm:text-sm text-zinc-700 space-y-2">
        <p className="leading-relaxed">
          En los términos del <strong>artículo 34 de la Ley N° 24.240</strong>, el <strong>artículo 1.110 del Código Civil y Comercial de la Nación</strong> y la <strong>Resolución N° 424/2020 de la Secretaría de Comercio Interior</strong>, los consumidores tienen derecho a revocar la aceptación del servicio contratado durante el plazo de <strong>diez (10) días corridos</strong> contados a partir de la fecha de suscripción.
        </p>
        <p className="text-xs text-zinc-500">
          La revocación es sin costo ni penalidad alguna. Al enviar tu solicitud, el sistema te otorgará de forma inmediata un <strong>número identificador del trámite</strong> de arrepentimiento.
        </p>
      </div>

      {/* Formulario */}
      <div className="rounded-2xl bg-white border border-black/[0.08] shadow-sm p-6 sm:p-8">
        <FormularioArrepentimiento
          emailDefault={emailDefault}
          nombreDefault={nombreDefault}
        />
      </div>

      {/* Preguntas frecuentes */}
      <div className="rounded-2xl bg-zinc-50 border border-zinc-200 p-5 space-y-3">
        <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-zinc-800">
          <HelpCircle className="w-4 h-4 text-amber-600" />
          <span>Condiciones del Derecho de Arrepentimiento</span>
        </div>
        <ul className="list-disc pl-5 text-xs text-zinc-600 space-y-1.5 leading-relaxed">
          <li>
            <strong>Plazo aplicable:</strong> Hasta 10 días corridos contados desde la contratación inicial o renovación.
          </li>
          <li>
            <strong>Reintegro de dinero:</strong> En caso de que se hubiera efectuado un cobro dentro de este plazo, se dará curso al reintegro inmediato por el mismo medio de pago utilizado a través de Mercado Pago.
          </li>
          <li>
            <strong>¿Ya pasaron los 10 días?</strong> Si tu período de contratación supera los 10 días, podés cancelar tu suscripción sin costo para el ciclo siguiente utilizando nuestro{" "}
            <Link href="/legales/baja" className="font-bold text-red-600 underline">
              Botón de Baja
            </Link>
            .
          </li>
        </ul>
      </div>

      <div className="pt-4 border-t border-black/[0.06] flex items-center justify-between text-xs text-zinc-500">
        <Link href="/legales/baja" className="font-semibold text-red-600 hover:underline">
          ← Ir al Botón de Baja
        </Link>
        <Link href="/legales/terminos" className="font-semibold text-zinc-900 hover:underline">
          Términos y Condiciones →
        </Link>
      </div>
    </article>
  );
}
