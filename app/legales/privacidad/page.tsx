import type { Metadata } from "next";
import Link from "next/link";
import { Lock, ShieldCheck, Mail, CheckCircle2 } from "lucide-react";

export const metadata: Metadata = {
  title: "Política de Privacidad — Ley 25.326",
  description:
    "Política de Privacidad y Protección de Datos Personales de la plataforma Fierros conforme a la Ley N° 25.326 y disposiciones de la AAIP.",
};

export default function PrivacidadPage() {
  return (
    <article className="prose prose-zinc max-w-none space-y-8">
      {/* Encabezado */}
      <div className="border-b border-black/[0.08] pb-6 space-y-3">
        <div className="flex items-center gap-2 text-xs font-bold text-emerald-600 uppercase tracking-wider">
          <Lock className="w-4 h-4" />
          <span>Protección de Datos Personales & Habeas Data</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-black text-zinc-950 tracking-tight">
          Política de Privacidad y Tratamiento de Datos
        </h1>
        <p className="text-xs text-zinc-500">
          En estricto cumplimiento con la <strong>Ley N° 25.326</strong> y normativas de la{" "}
          <strong>Agencia de Acceso a la Información Pública (AAIP)</strong> de la República Argentina.
        </p>
      </div>

      {/* Recuadro Legal Obligatorio AAIP */}
      <div className="rounded-2xl bg-zinc-900 text-white p-5 sm:p-6 shadow-md space-y-3">
        <div className="flex items-center gap-2 text-emerald-400 text-xs font-bold uppercase tracking-wider">
          <ShieldCheck className="w-4 h-4" />
          <span>Información Legal Obligatoria — Órgano de Control</span>
        </div>
        <p className="text-xs sm:text-sm text-zinc-300 leading-relaxed">
          &ldquo;El titular de los datos personales tiene la facultad de ejercer el derecho de acceso a los mismos en forma gratuita a intervalos no inferiores a seis meses, salvo que se acredite un interés legítimo al efecto conforme lo establecido en el artículo 14, inciso 3 de la Ley Nº 25.326.&rdquo;
        </p>
        <p className="text-xs sm:text-sm text-zinc-300 leading-relaxed border-t border-zinc-800 pt-2">
          &ldquo;La <strong>AGENCIA DE ACCESO A LA INFORMACIÓN PÚBLICA</strong>, en su carácter de Órgano de Control de la Ley N° 25.326, tiene la atribución de atender las denuncias y reclamos que interpongan quienes resulten afectados en sus derechos por incumplimiento de las normas vigentes en materia de protección de datos personales.&rdquo;
        </p>
      </div>

      {/* Secciones de Privacidad */}
      <section className="space-y-5 text-sm text-zinc-700 leading-relaxed">
        <h2 className="text-lg font-black text-zinc-950 border-b border-black/[0.06] pb-2">
          1. Compromiso de Fierros con tu Privacidad
        </h2>
        <p>
          En <strong>Fierros</strong> valoramos profundamente la confianza de cada taller y de sus clientes. Esta Política de Privacidad describe de manera clara y transparente qué datos personales se recolectan, con qué finalidades operativas se tratan, cómo se almacenan de forma segura y qué mecanismos tenés para ejercer tus derechos de Habeas Data.
        </p>

        <h2 className="text-lg font-black text-zinc-950 border-b border-black/[0.06] pb-2 pt-4">
          2. Datos Recolectados
        </h2>
        <p>Recolectamos únicamente la información necesaria para la prestación del servicio:</p>
        <ul className="list-disc pl-5 space-y-2">
          <li>
            <strong>Datos del Taller y del Usuario:</strong> Nombre completo, correo electrónico, nombre comercial o de fantasía del taller, teléfono de contacto y CUIT/CUIL para identificación y facturación.
          </li>
          <li>
            <strong>Datos Operativos del Taller:</strong> Órdenes de trabajo, checklist de inspección vehicular en fosa, historial de service, consumos de lubricantes y repuestos.
          </li>
          <li>
            <strong>Datos de Vehículos y Clientes del Taller:</strong> Patentes de automotores, marca, modelo, año, motorización, nombre o razón social del titular y número de WhatsApp para envío de avisos y presupuestos a solicitud del taller.
          </li>
          <li>
            <strong>Datos de Navegación y Telemetría Técnica:</strong> Direcciones IP anonimizadas, identificadores de sesión cifrados y registros técnicos con la exclusiva finalidad de prevenir fraudes, ataques de denegación de servicio (DDoS) y asegurar la alta disponibilidad.
          </li>
        </ul>

        <h2 className="text-lg font-black text-zinc-950 border-b border-black/[0.06] pb-2 pt-4">
          3. Finalidad del Tratamiento de los Datos
        </h2>
        <p>Los datos recolectados se utilizan exclusivamente para:</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
          {[
            "Gestión y emisión de órdenes de trabajo y presupuestos en fosa.",
            "Consulta homologada de capacidades de cárter y litros por patente.",
            "Envío de avisos automáticos de service por WhatsApp a pedido del taller.",
            "Seguimiento en vivo para clientes a través de enlaces seguros.",
            "Cobro de suscripciones mediante la pasarela regulada de Mercado Pago.",
            "Soporte técnico, copias de respaldo y seguridad de la infraestructura.",
          ].map((item) => (
            <div
              key={item}
              className="flex items-start gap-2 p-3 rounded-xl bg-zinc-50 border border-zinc-200/70 text-xs text-zinc-800"
            >
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <span>{item}</span>
            </div>
          ))}
        </div>
        <p className="font-semibold text-zinc-900 pt-2">
          Garantía absoluta: Fierros NO comercializa, alquila ni cede bases de datos a agencias de publicidad, brokers de datos ni terceros con fines de prospección comercial ajenos a la herramienta.
        </p>

        <h2 className="text-lg font-black text-zinc-950 border-b border-black/[0.06] pb-2 pt-4">
          4. Rol de Fierros: Responsable y Encargado del Tratamiento
        </h2>
        <p>
          Respecto a los datos de la cuenta del Usuario, Fierros actúa como <strong>Responsable del Tratamiento</strong>.
        </p>
        <p>
          Respecto a los datos de los clientes y vehículos que el Taller carga en el sistema para sus órdenes de trabajo, el <strong>Taller es el Responsable del Tratamiento</strong> y Fierros actúa en calidad de <strong>Encargado del Tratamiento</strong>, procesando la información exclusivamente bajo las directivas del Taller y garantizando su aislamiento tecnológico absoluto (Row Level Security en base de datos).
        </p>

        <h2 className="text-lg font-black text-zinc-950 border-b border-black/[0.06] pb-2 pt-4">
          5. Derechos ARCO: Acceso, Rectificación, Actualización y Supresión
        </h2>
        <p>
          En cumplimiento de los artículos 14, 15 y 16 de la Ley N° 25.326, el titular de los datos personales puede ejercer en cualquier momento sus derechos de:
        </p>
        <ul className="list-disc pl-5 space-y-2">
          <li>
            <strong>Acceso:</strong> Solicitar constancia de los datos personales registrados en la base de datos de Fierros.
          </li>
          <li>
            <strong>Rectificación y Actualización:</strong> Corregir información errónea, desactualizada o incompleta directamente desde el perfil o solicitándolo a nuestro equipo.
          </li>
          <li>
            <strong>Supresión / Cancelación:</strong> Solicitar el borrado o destrucción segura de sus datos, en tanto no exista una obligación legal o fiscal de conservación.
          </li>
        </ul>
        <p>
          Para ejercer cualquiera de estos derechos, podés enviar un correo electrónico con el asunto &ldquo;Derecho ARCO - Ley 25.326&rdquo; a:
        </p>
        <div className="flex items-center gap-2 p-3.5 rounded-xl bg-zinc-100 border border-zinc-200 text-sm font-mono text-zinc-900">
          <Mail className="w-4 h-4 text-orange-600" />
          <a href="mailto:legales@fierros.app" className="hover:underline font-bold">
            legales@fierros.app
          </a>
          <span className="text-xs text-zinc-500 font-sans ml-auto">
            Respuesta garantizada dentro de los 10 días hábiles legales
          </span>
        </div>

        <h2 className="text-lg font-black text-zinc-950 border-b border-black/[0.06] pb-2 pt-4">
          6. Medidas de Seguridad y Cifrado
        </h2>
        <p>
          Implementamos medidas de seguridad técnicas, físicas y organizativas de última generación conforme a las recomendaciones de la AAIP:
        </p>
        <ul className="list-disc pl-5 space-y-2">
          <li>Cifrado en tránsito obligatorio mediante protocolos TLS 1.3 con certificados SSL clase A+.</li>
          <li>Cifrado en reposo para todos los registros y copias de respaldo (AES-256).</li>
          <li>Aislamiento estricto entre talleres a nivel de base de datos (PostgreSQL Row Level Security).</li>
          <li>Autenticación segura basada en tokens criptográficos con tiempo de expiración y contraseñas saladas mediante algoritmos modernos de derivación de claves.</li>
        </ul>
      </section>

      <div className="pt-6 border-t border-black/[0.06] flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-zinc-500">
        <Link href="/legales/datos" className="font-semibold text-zinc-900 hover:underline">
          ← Ver Política de Recolección y Seguridad
        </Link>
        <Link href="/legales/cookies" className="font-semibold text-zinc-900 hover:underline">
          Ver Política de Cookies →
        </Link>
      </div>
    </article>
  );
}
