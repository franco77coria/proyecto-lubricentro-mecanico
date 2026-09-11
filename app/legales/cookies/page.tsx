import type { Metadata } from "next";
import Link from "next/link";
import { Cookie, ShieldCheck, AlertCircle } from "lucide-react";

export const metadata: Metadata = {
  title: "Política de Cookies y Almacenamiento",
  description:
    "Información transparente sobre las cookies técnicas y almacenamiento local utilizados en la plataforma Fierros.",
};

export default function CookiesPage() {
  return (
    <article className="prose prose-zinc max-w-none space-y-8">
      {/* Encabezado */}
      <div className="border-b border-black/[0.08] pb-6 space-y-3">
        <div className="flex items-center gap-2 text-xs font-bold text-amber-600 uppercase tracking-wider">
          <Cookie className="w-4 h-4" />
          <span>Almacenamiento Local & Cookies</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-black text-zinc-950 tracking-tight">
          Política de Cookies y Almacenamiento
        </h1>
        <p className="text-xs text-zinc-500">
          Uso responsable, transparente y seguro de tecnologías de almacenamiento en el navegador.
        </p>
      </div>

      <div className="rounded-2xl bg-emerald-50 border border-emerald-200/80 p-4 sm:p-5 text-xs sm:text-sm text-emerald-950 space-y-2">
        <div className="flex items-center gap-2 font-bold text-emerald-900">
          <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>Política Cero Rastreo Publicitario</span>
        </div>
        <p className="leading-relaxed">
          En <strong>Fierros</strong> NO utilizamos cookies de terceros para publicidad comportamental, ni vendemos información de navegación a anunciantes. Todas las cookies y elementos de almacenamiento local tienen como único propósito garantizar que puedas acceder a tu taller de forma segura y rápida.
        </p>
      </div>

      <section className="space-y-5 text-sm text-zinc-700 leading-relaxed">
        <h2 className="text-lg font-black text-zinc-950 border-b border-black/[0.06] pb-2">
          1. ¿Qué son las Cookies y el Almacenamiento Local?
        </h2>
        <p>
          Las <strong>cookies</strong> son pequeños archivos de texto que los sitios web guardan en tu dispositivo para recordar información sobre tu visita. El <strong>almacenamiento local (localStorage)</strong> es una tecnología moderna del navegador que permite almacenar datos de forma persistente y rápida sin transmitirlos innecesariamente en cada petición de red.
        </p>

        <h2 className="text-lg font-black text-zinc-950 border-b border-black/[0.06] pb-2 pt-4">
          2. Tabla de Cookies y Almacenamiento en Fierros
        </h2>
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-xs border border-black/[0.08] rounded-xl overflow-hidden">
            <thead className="bg-zinc-100 font-bold text-zinc-950">
              <tr>
                <th className="p-3 border-b border-black/[0.08]">Nombre</th>
                <th className="p-3 border-b border-black/[0.08]">Tipo</th>
                <th className="p-3 border-b border-black/[0.08]">Duración</th>
                <th className="p-3 border-b border-black/[0.08]">Finalidad</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-black/[0.06] text-zinc-700">
              <tr>
                <td className="p-3 font-mono font-bold text-zinc-900">sb-*-auth-token</td>
                <td className="p-3">Cookie Técnica Esencial</td>
                <td className="p-3">Sesión / Persistente</td>
                <td className="p-3">
                  Autenticación criptográfica segura del usuario y su rol (dueño/mecánico) con banderas <code>HttpOnly</code>, <code>Secure</code> y <code>SameSite=Lax</code>.
                </td>
              </tr>
              <tr>
                <td className="p-3 font-mono font-bold text-zinc-900">fierros_consent_v1</td>
                <td className="p-3">LocalStorage</td>
                <td className="p-3">1 año</td>
                <td className="p-3">
                  Registra tu elección en el banner de cookies para no volver a mostrártelo en cada visita.
                </td>
              </tr>
              <tr>
                <td className="p-3 font-mono font-bold text-zinc-900">zxing_reader.wasm</td>
                <td className="p-3">Caché Local PWA</td>
                <td className="p-3">Persistente</td>
                <td className="p-3">
                  Permite el funcionamiento offline y rápido del escáner de códigos de barras y cédula verde en la fosa del taller con baja señal.
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <h2 className="text-lg font-black text-zinc-950 border-b border-black/[0.06] pb-2 pt-4">
          3. Cómo Gestionar o Bloquear Cookies
        </h2>
        <p>
          Podés configurar tu navegador web para rechazar cookies o eliminarlas en cualquier momento. A continuación te indicamos los enlaces directos a las instrucciones de los principales navegadores:
        </p>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
          {[
            { nombre: "Google Chrome", url: "https://support.google.com/chrome/answer/95647" },
            { nombre: "Mozilla Firefox", url: "https://support.mozilla.org/kb/cookies-information-websites-store-on-your-computer" },
            { nombre: "Apple Safari", url: "https://support.apple.com/guide/safari/manage-cookies-sfri11471/mac" },
            { nombre: "Microsoft Edge", url: "https://support.microsoft.com/microsoft-edge/delete-cookies-in-microsoft-edge-63947406-40ac-c3b8-57b9-2a946a29ae09" },
          ].map((nav) => (
            <a
              key={nav.nombre}
              href={nav.url}
              target="_blank"
              rel="noopener noreferrer"
              className="p-2.5 rounded-lg bg-zinc-50 border border-zinc-200 text-xs font-semibold text-zinc-800 hover:bg-zinc-100 text-center transition-colors"
            >
              {nav.nombre} ↗
            </a>
          ))}
        </div>

        <div className="rounded-xl bg-amber-50 p-4 border border-amber-200 text-xs text-amber-900 space-y-1 mt-4">
          <div className="flex items-center gap-1.5 font-bold">
            <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
            <span>Nota sobre Cookies Esenciales:</span>
          </div>
          <p>
            Si bloqueás todas las cookies técnicas en tu navegador, no podrás iniciar sesión ni acceder al panel de control de tu taller, ya que las cookies de sesión son indispensables para verificar tu identidad y mantener la conexión segura con la base de datos.
          </p>
        </div>
      </section>

      <div className="pt-6 border-t border-black/[0.06] flex items-center justify-between text-xs text-zinc-500">
        <Link href="/legales/privacidad" className="font-semibold text-zinc-900 hover:underline">
          ← Ver Política de Privacidad
        </Link>
        <Link href="/legales/baja" className="font-semibold text-red-600 hover:underline">
          Botón de Baja →
        </Link>
      </div>
    </article>
  );
}
