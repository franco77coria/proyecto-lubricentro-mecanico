import type { Metadata } from "next";
import Link from "next/link";
import { XCircle, HelpCircle } from "lucide-react";
import { obtenerSesion, crearClienteServidor } from "@/lib/supabase/server";
import { FormularioBaja } from "./FormularioBaja";

export const metadata: Metadata = {
  title: "Botón de Baja — Cancelación del Servicio (Ley 24.240)",
  description:
    "Formulario oficial del Botón de Baja para rescisión inmediata del servicio y cancelación de suscripciones conforme a la Ley N° 24.240 y Res. 271/2020.",
};

export default async function BajaPage() {
  const sesion = await obtenerSesion();
  let emailDefault = "";
  let nombreDefault = "";
  let nombreTaller = "";
  let tieneSuscripcionActiva = false;
  let esDueno = false;

  if (sesion?.perfil) {
    emailDefault = sesion.user?.email ?? "";
    nombreDefault = sesion.perfil.nombre ?? "";
    esDueno = sesion.perfil.rol === "dueno";

    const supabase = await crearClienteServidor();
    const { data: taller } = await supabase
      .from("taller")
      .select("nombre, mp_preapproval_id, estado_suscripcion")
      .eq("id", sesion.perfil.taller_id)
      .maybeSingle();

    if (taller) {
      nombreTaller = taller.nombre ?? "";
      tieneSuscripcionActiva =
        taller.estado_suscripcion === "activo" && !!taller.mp_preapproval_id;
    }
  }

  return (
    <article className="max-w-none space-y-8">
      {/* Encabezado */}
      <div className="border-b border-black/[0.08] pb-6 space-y-3">
        <div className="flex items-center gap-2 text-xs font-bold text-red-600 uppercase tracking-wider">
          <XCircle className="w-4 h-4" />
          <span>Ley N° 24.240 — Art. 10 ter & Res. 271/2020 SCI</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-black text-zinc-950 tracking-tight">
          Botón de Baja — Rescisión del Servicio
        </h1>
        <p className="text-xs text-zinc-500">
          Cancelación directa, inmediata y sin penalidades de tu cuenta y suscripciones activas.
        </p>
      </div>

      <div className="rounded-2xl bg-zinc-50 border border-zinc-200/80 p-4 sm:p-5 text-xs sm:text-sm text-zinc-700 space-y-2">
        <p className="leading-relaxed">
          En cumplimiento con la <strong>Ley de Defensa del Consumidor (Ley N° 24.240)</strong> y las{" "}
          <strong>Resoluciones 271/2020 y 316/2020 de la Secretaría de Comercio Interior</strong>, podés solicitar la rescisión de tu servicio en cualquier momento.
        </p>
        <p className="text-xs text-zinc-500">
          Al completar este formulario, recibirás de forma instantánea en pantalla y por constancia digital tu{" "}
          <strong>Código Único de Identificación de Trámite de Baja</strong>. Si poseías un débito automático activo mediante Mercado Pago, la suscripción se cancelará de forma inmediata.
        </p>
      </div>

      {/* Formulario */}
      <div className="rounded-2xl bg-white border border-black/[0.08] shadow-sm p-6 sm:p-8">
        <FormularioBaja
          emailDefault={emailDefault}
          nombreDefault={nombreDefault}
          nombreTaller={nombreTaller}
          tieneSuscripcionActiva={tieneSuscripcionActiva}
          esDueno={esDueno}
        />
      </div>

      {/* Preguntas frecuentes sobre la baja */}
      <div className="rounded-2xl bg-zinc-50 border border-zinc-200 p-5 space-y-3">
        <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-zinc-800">
          <HelpCircle className="w-4 h-4 text-orange-600" />
          <span>¿Qué sucede al solicitar la baja?</span>
        </div>
        <ul className="list-disc pl-5 text-xs text-zinc-600 space-y-1.5 leading-relaxed">
          <li>
            <strong>Sin cargos futuros:</strong> Tu débito en Mercado Pago se cancela inmediatamente para el siguiente período de facturación.
          </li>
          <li>
            <strong>Período ya abonado:</strong> Si contás con días restantes del mes en curso ya pagados, tendrás acceso hasta el vencimiento de dicho ciclo.
          </li>
          <li>
            <strong>Resguardo de datos:</strong> Dispondrás de 30 días para solicitar la exportación de tus órdenes de trabajo históricas en formato CSV o PDF.
          </li>
        </ul>
      </div>

      <div className="pt-4 border-t border-black/[0.06] flex items-center justify-between text-xs text-zinc-500">
        <Link href="/legales/terminos" className="font-semibold text-zinc-900 hover:underline">
          ← Volver a Términos y Condiciones
        </Link>
        <Link href="/legales/arrepentimiento" className="font-semibold text-amber-800 hover:underline">
          Botón de Arrepentimiento →
        </Link>
      </div>
    </article>
  );
}
