import type { Metadata } from "next";
import Link from "next/link";
import { Database, ShieldAlert, Cpu, Server, CheckCircle2 } from "lucide-react";

export const metadata: Metadata = {
  title: "Recolección, Procesamiento y Seguridad de Datos",
  description:
    "Detalle de la arquitectura de seguridad, aislamiento multi-tenant, procesamiento de IA y resguardo de datos en Fierros.",
};

export default function DatosPage() {
  return (
    <article className="prose prose-zinc max-w-none space-y-8">
      {/* Encabezado */}
      <div className="border-b border-black/[0.08] pb-6 space-y-3">
        <div className="flex items-center gap-2 text-xs font-bold text-blue-600 uppercase tracking-wider">
          <Database className="w-4 h-4" />
          <span>Arquitectura & Seguridad de la Información</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-black text-zinc-950 tracking-tight">
          Política de Recolección, Procesamiento y Seguridad de Datos
        </h1>
        <p className="text-xs text-zinc-500">
          Especificación técnica del tratamiento de datos, aislamiento multi-tenant y procesamiento de inteligencia artificial.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="p-4 rounded-xl bg-white border border-black/[0.08] shadow-sm space-y-1">
          <Server className="w-5 h-5 text-blue-600" />
          <p className="text-xs font-bold text-zinc-950">Aislamiento RLS</p>
          <p className="text-[11px] text-zinc-500 leading-normal">
            PostgreSQL Row Level Security en cada consulta de la base.
          </p>
        </div>
        <div className="p-4 rounded-xl bg-white border border-black/[0.08] shadow-sm space-y-1">
          <ShieldAlert className="w-5 h-5 text-emerald-600" />
          <p className="text-xs font-bold text-zinc-950">PCI-DSS Compliant</p>
          <p className="text-[11px] text-zinc-500 leading-normal">
            Pagos procesados directamente por Mercado Pago sin guardar tarjetas.
          </p>
        </div>
        <div className="p-4 rounded-xl bg-white border border-black/[0.08] shadow-sm space-y-1">
          <Cpu className="w-5 h-5 text-orange-600" />
          <p className="text-xs font-bold text-zinc-950">IA Privada</p>
          <p className="text-[11px] text-zinc-500 leading-normal">
            Modelos de visión transitorios sin entrenamiento con datos de clientes.
          </p>
        </div>
      </div>

      <section className="space-y-5 text-sm text-zinc-700 leading-relaxed">
        <h2 className="text-lg font-black text-zinc-950 border-b border-black/[0.06] pb-2">
          1. Principio de Minimización de Datos
        </h2>
        <p>
          En <strong>Fierros</strong> aplicamos el estándar internacional de minimización: solo recolectamos aquellos atributos de datos estrictamente necesarios para operar la fosa, registrar el kilometraje, llevar el historial del vehículo y permitir que el taller emita presupuestos y comprobantes claros.
        </p>
        <p>
          No solicitamos ni almacenamos datos sensibles en los términos del artículo 2 de la Ley N° 25.326 (origen racial o étnico, opiniones políticas, convicciones religiosas, pertenencia sindical, etc.).
        </p>

        <h2 className="text-lg font-black text-zinc-950 border-b border-black/[0.06] pb-2 pt-4">
          2. Aislamiento Tecnológico Multi-Tenant (Row-Level Security)
        </h2>
        <p>
          Nuestra base de datos relacional utiliza la tecnología <strong>Row-Level Security (RLS)</strong> a nivel de motor de PostgreSQL:
        </p>
        <ul className="list-disc pl-5 space-y-2">
          <li>
            Cada registro (cliente, vehículo, orden de trabajo, ítem de stock, comprobante de pago) está indefectiblemente vinculado a un identificador único de taller (<code>taller_id</code>).
          </li>
          <li>
            Las políticas de seguridad del motor impiden física y lógicamente que cualquier consulta ejecutada por un taller acceda, modifique o visualice información perteneciente a otro taller.
          </li>
          <li>
            La segregación de roles interna (Dueño vs. Mecánico) asegura además que los mecánicos en la fosa no tengan visibilidad sobre costos de compra de mercadería ni sobre la recaudación de la caja diaria.
          </li>
        </ul>

        <h2 className="text-lg font-black text-zinc-950 border-b border-black/[0.06] pb-2 pt-4">
          3. Tratamiento de Pagos y Datos Financieros
        </h2>
        <p>
          Toda la operatoria de cobros de suscripciones y pagos mensuales se encuentra delegada en <strong>Mercado Pago</strong> (MercadoLibre S.R.L. / Mercado Pago S.A.), entidad de pagos regulada por el Banco Central de la República Argentina (BCRA).
        </p>
        <div className="p-4 rounded-xl bg-zinc-50 border border-zinc-200 text-xs text-zinc-700 space-y-2">
          <p className="font-bold text-zinc-950">Garantía de Seguridad Bancaria:</p>
          <p>
            Fierros <strong>NUNCA</strong> tiene acceso, almacena, procesa ni registra en sus bases de datos los números de 16 dígitos de tarjetas de crédito o débito, códigos de seguridad (CVV/CVC) ni claves bancarias de los talleres. Toda la tokenización y débito ocurre dentro del entorno seguro de Mercado Pago bajo la certificación internacional <strong>PCI-DSS Nivel 1</strong>.
          </p>
        </div>

        <h2 className="text-lg font-black text-zinc-950 border-b border-black/[0.06] pb-2 pt-4">
          4. Procesamiento de Inteligencia Artificial (Visión y Fichas Técnicas)
        </h2>
        <p>
          Fierros incorpora modelos avanzados de Inteligencia Artificial multimodal para asistir en tareas operativas como la lectura de cédula verde por foto, la extracción de comprobantes de compras y el diagnóstico asistido de fallas mecánicas:
        </p>
        <ul className="list-disc pl-5 space-y-2">
          <li>
            <strong>Procesamiento en Tránsito:</strong> Las imágenes enviadas se procesan de forma inmediata y en memoria a través de conexiones cifradas TLS 1.3 con APIs empresariales de Google Cloud / Gemini.
          </li>
          <li>
            <strong>Sin Entrenamiento de Modelos Públicos:</strong> Garantizamos expresamente que los datos, textos, fotos de cédulas, presupuestos y fotos de vehículos procesados en Fierros <strong>NO</strong> son utilizados por Google ni por terceros para el re-entrenamiento o aprendizaje de modelos de inteligencia artificial públicos.
          </li>
          <li>
            <strong>Acceso Restringido:</strong> Los archivos fotográficos de comprobantes y órdenes se almacenan en buckets privados con políticas de lectura firmadas temporalmente (Signed URLs).
          </li>
        </ul>

        <h2 className="text-lg font-black text-zinc-950 border-b border-black/[0.06] pb-2 pt-4">
          5. Protocolo de Retención y Destrucción Segura de Datos
        </h2>
        <p>
          Los datos se conservan mientras la cuenta del taller permanezca activa para garantizar el acceso al historial vehicular de sus clientes.
        </p>
        <p>
          En caso de que el Usuario solicite la baja definitiva del servicio a través de nuestro{" "}
          <Link href="/legales/baja" className="font-semibold text-red-600 underline">
            Botón de Baja
          </Link>{" "}
          o ejerza su derecho de supresión bajo la Ley 25.326, Fierros iniciará el protocolo de baja:
        </p>
        <div className="space-y-2 pt-1 text-xs text-zinc-700">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>Cancelación inmediata del débito automático en Mercado Pago.</span>
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>Período de gracia de 30 días para exportación de datos en formatos estándar (Excel/PDF).</span>
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>Depuración criptográfica y destrucción irreversible de los registros tras el período legal.</span>
          </div>
        </div>
      </section>

      <div className="pt-6 border-t border-black/[0.06] flex items-center justify-between text-xs text-zinc-500">
        <Link href="/legales/terminos" className="font-semibold text-zinc-900 hover:underline">
          ← Ver Términos y Condiciones
        </Link>
        <Link href="/legales/privacidad" className="font-semibold text-zinc-900 hover:underline">
          Ver Política de Privacidad →
        </Link>
      </div>
    </article>
  );
}
