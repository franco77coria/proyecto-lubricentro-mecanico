import type { Metadata } from "next";
import Link from "next/link";
import { FileText, ShieldCheck, AlertCircle } from "lucide-react";

export const metadata: Metadata = {
  title: "Términos y Condiciones de Uso",
  description:
    "Términos y condiciones de uso de la plataforma SaaS Fierros para lubricentros y talleres mecánicos.",
};

export default function TerminosPage() {
  return (
    <article className="prose prose-zinc max-w-none space-y-8">
      {/* Encabezado */}
      <div className="border-b border-black/[0.08] pb-6 space-y-3">
        <div className="flex items-center gap-2 text-xs font-bold text-orange-600 uppercase tracking-wider">
          <FileText className="w-4 h-4" />
          <span>Marco Contractual & Licencia de Uso</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-black text-zinc-950 tracking-tight">
          Términos y Condiciones del Servicio
        </h1>
        <p className="text-xs text-zinc-500">
          Última actualización: Septiembre de 2026 — Vigente en toda la República Argentina.
        </p>
      </div>

      <div className="rounded-2xl bg-orange-50/70 border border-orange-200/80 p-4 sm:p-5 text-xs sm:text-sm text-orange-950 space-y-2">
        <div className="flex items-center gap-2 font-bold text-orange-900">
          <AlertCircle className="w-4 h-4 text-orange-600 shrink-0" />
          <span>Resumen de Confianza y Transparencia</span>
        </div>
        <p className="leading-relaxed">
          En <strong>Fierros</strong> creemos en relaciones comerciales claras: podés probar la plataforma 7 días gratis sin poner ninguna tarjeta; tus datos y los de tus clientes son 100% tuyos y están aislados con seguridad de grado bancario; y podés darte de baja en cualquier momento con 1 solo clic desde nuestro{" "}
          <Link href="/legales/baja" className="font-bold underline">
            Botón de Baja
          </Link>
          , sin penalidades ni llamadas molestas.
        </p>
      </div>

      {/* Secciones Legales */}
      <section className="space-y-4 text-sm text-zinc-700 leading-relaxed">
        <h2 className="text-lg font-black text-zinc-950 border-b border-black/[0.06] pb-2">
          1. Aceptación y Objeto del Servicio
        </h2>
        <p>
          El presente contrato regula los términos y condiciones de uso del software como servicio (SaaS) denominado <strong>Fierros</strong> (en adelante, la &ldquo;Plataforma&rdquo; o &ldquo;Fierros&rdquo;), operado para brindar asistencia técnica, gestión operativa de órdenes de trabajo, consultas homologadas de cárter y lubricación por patente, y control de stock a talleres mecánicos, lubricentros y profesionales automotrices (en adelante, el &ldquo;Taller&rdquo; o &ldquo;Usuario&rdquo;).
        </p>
        <p>
          Al registrarse, acceder o utilizar la Plataforma, el Usuario declara haber leído, comprendido y aceptado en su totalidad estos Términos y Condiciones, así como nuestra{" "}
          <Link href="/legales/privacidad" className="font-semibold text-zinc-900 underline">
            Política de Privacidad
          </Link>{" "}
          y{" "}
          <Link href="/legales/datos" className="font-semibold text-zinc-900 underline">
            Política de Recolección de Datos
          </Link>
          .
        </p>

        <h2 className="text-lg font-black text-zinc-950 border-b border-black/[0.06] pb-2 pt-4">
          2. Capacidad Legal y Registro de Cuenta
        </h2>
        <p>
          El servicio está destinado exclusivamente a personas humanas con plena capacidad legal para contratar o personas jurídicas debidamente constituidas bajo las leyes de su respectiva jurisdicción.
        </p>
        <p>
          El Usuario es el único responsable de la exactitud y veracidad de los datos aportados durante el registro, así como de la custodia confidencial de sus credenciales de acceso (correo electrónico y contraseña). Cualquier actividad realizada a través de su cuenta se considerará efectuada por el Usuario o por terceros autorizados por él.
        </p>

        <h2 className="text-lg font-black text-zinc-950 border-b border-black/[0.06] pb-2 pt-4">
          3. Período de Prueba Gratuita (Free Trial)
        </h2>
        <p>
          Fierros ofrece a los nuevos talleres un período de prueba gratuito de <strong>7 (siete) días corridos</strong> a partir de la fecha de alta de la cuenta. Durante este período, el Usuario tiene acceso a todas las funcionalidades del plan asignado sin necesidad de ingresar datos de tarjetas de crédito o débito ni asumir compromisos de permanencia.
        </p>
        <p>
          Finalizado el período de prueba, el acceso a las funciones operativas del taller requerirá la contratación de uno de los planes disponibles. Si el Usuario decide no suscribirse, su cuenta quedará en modo de solo lectura o suspendida temporalmente, sin que ello implique cargo económico alguno.
        </p>

        <h2 className="text-lg font-black text-zinc-950 border-b border-black/[0.06] pb-2 pt-4">
          4. Suscripción, Pagos y Facturación (Mercado Pago)
        </h2>
        <p>
          Los servicios pagos de Fierros se abonan de manera mensual y por adelantado a través de la pasarela de pagos integrada de <strong>Mercado Pago</strong> (entidad debidamente autorizada y regulada). Fierros no almacena en sus servidores números de tarjeta ni claves de seguridad bancarias (PCI-DSS Compliant).
        </p>
        <ul className="list-disc pl-5 space-y-2">
          <li>
            <strong>Suscripción Recurrente:</strong> El débito mensual se realiza de forma automática contra el medio de pago seleccionado hasta tanto el Usuario decida pausar o cancelar el servicio.
          </li>
          <li>
            <strong>Pago Mensual Único (Checkout Pro):</strong> Permite abonar períodos individuales utilizando saldo en cuenta de Mercado Pago, Mercado Crédito o tarjetas.
          </li>
          <li>
            <strong>Modificación de Precios:</strong> Cualquier actualización tarifaria será informada con al menos 30 (treinta) días corridos de anticipación a la dirección de correo electrónico registrada.
          </li>
        </ul>

        <h2 className="text-lg font-black text-zinc-950 border-b border-black/[0.06] pb-2 pt-4">
          5. Cancelación, Rescisión y Botón de Baja (Ley 24.240)
        </h2>
        <p>
          Conforme a las exigencias del <strong>artículo 10 ter de la Ley N° 24.240 de Defensa del Consumidor</strong> y las <strong>Resoluciones 271/2020 y 316/2020 de la Secretaría de Comercio Interior</strong>, el Usuario tiene derecho a rescindir el servicio en cualquier momento, de forma inmediata y sin penalización económica alguna.
        </p>
        <p>
          Para ejercer este derecho, el Usuario puede utilizar el{" "}
          <Link href="/legales/baja" className="font-bold text-red-600 underline">
            Botón de Baja
          </Link>{" "}
          disponible en el pie de página de la Plataforma o en el panel de configuración de su cuenta. Tras la solicitud, el sistema cancelará de inmediato las suscripciones activas en Mercado Pago y emitirá una constancia fehaciente con código de trámite identificador.
        </p>
        <p>
          Asimismo, de conformidad con la <strong>Resolución 424/2020 de la Secretaría de Comercio Interior</strong>, los usuarios que contraten el servicio tienen derecho a revocar la contratación dentro del plazo de 10 (diez) días corridos desde la suscripción a través del{" "}
          <Link href="/legales/arrepentimiento" className="font-bold text-amber-700 underline">
            Botón de Arrepentimiento
          </Link>
          .
        </p>

        <h2 className="text-lg font-black text-zinc-950 border-b border-black/[0.06] pb-2 pt-4">
          6. Responsabilidad Operativa en Fosa y Mecánica Automotriz
        </h2>
        <p>
          Fierros es un sistema de asistencia informática y optimización administrativa. La información técnica provista (capacidades de cárter en litros, viscosidades recomendadas, tablas de equivalencias de filtros y manuales) proviene de especificaciones de fabricantes y catálogos comerciales actualizados.
        </p>
        <p className="rounded-xl bg-zinc-100 p-3.5 border border-zinc-200 text-zinc-800">
          <strong>Aviso Técnico Importante:</strong> El diagnóstico definitivo, el control de nivel en varilla de aceite, el peritaje vehicular, el torque de tapón de cárter y la ejecución mecánica en fosa son de exclusiva incumbencia y responsabilidad del taller y del profesional actuante. Fierros no reemplaza el criterio pericial ni la inspección ocular del mecánico calificado.
        </p>

        <h2 className="text-lg font-black text-zinc-950 border-b border-black/[0.06] pb-2 pt-4">
          7. Propiedad Intelectual
        </h2>
        <p>
          El software, código fuente, diseño visual, logotipos, marcas comerciales, estructura de bases de datos y algoritmos de normalización de patentes son propiedad exclusiva de Fierros y están protegidos por la Ley N° 11.723 de Propiedad Intelectual de la República Argentina y convenios internacionales. Queda terminantemente prohibida su reproducción, descompilación, ingeniería inversa o explotación no autorizada.
        </p>
        <p>
          <strong>Propiedad de los Datos del Taller:</strong> Toda la información de clientes, órdenes de trabajo, presupuestos e historial de vehículos cargada por el Usuario es y seguirá siendo propiedad exclusiva del Usuario. Fierros no comercializa ni cede estos datos bajo ninguna circunstancia.
        </p>

        <h2 className="text-lg font-black text-zinc-950 border-b border-black/[0.06] pb-2 pt-4">
          8. Ley Aplicable y Jurisdicción
        </h2>
        <p>
          Estos Términos y Condiciones se rigen e interpretan conforme a las leyes de la <strong>República Argentina</strong>. Ante cualquier controversia que pudiera suscitarse con motivo de la validez, interpretación, cumplimiento o resolución del presente, las partes se someterán a la jurisdicción de los Tribunales Ordinarios competentes, con renuncia expresa a cualquier otro fuero o jurisdicción que pudiera corresponderles.
        </p>
      </section>

      <div className="pt-6 border-t border-black/[0.06] flex items-center justify-between text-xs text-zinc-500">
        <span className="flex items-center gap-1.5">
          <ShieldCheck className="w-4 h-4 text-emerald-600" />
          Fierros Software — Plataforma Certificada
        </span>
        <Link href="/legales/privacidad" className="font-semibold text-zinc-900 hover:underline">
          Ver Política de Privacidad →
        </Link>
      </div>
    </article>
  );
}
