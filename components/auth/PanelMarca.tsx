import { ClipboardCheck, Package, Send, Wrench } from "lucide-react";

import { Tacometro } from "./Tacometro";

const VALOR = [
  { icono: ClipboardCheck, titulo: "Órdenes de trabajo", detalle: "Checklist, descargo y estados del auto" },
  { icono: Package, titulo: "Stock con costos", detalle: "Saldos reales y aviso de mínimos" },
  { icono: Send, titulo: "PDF por WhatsApp", detalle: "El comprobante al cliente en un toque" },
];

/**
 * Panel de marca del login.
 *
 * Existe solo en escritorio. Antes el formulario quedaba centrado en una
 * columna angosta con el resto de la pantalla vacío; acá ese espacio pasa a
 * decir qué hace el producto, que es lo que se espera de la primera pantalla.
 *
 * El fondo es oscuro a propósito: es el único lugar de la app donde el
 * contraste alto y el gradiente tienen sentido. Adentro, con el portón del
 * taller abierto y sol, todo va en claro.
 */
export function PanelMarca() {
  return (
    <section className="relative hidden overflow-hidden lg:flex lg:flex-col lg:justify-between lg:p-10 xl:p-12">
      {/* Gradiente base: grafito hacia un naranja quemado, no un degradé de
          colores planos. */}
      <div
        className="absolute inset-0 -z-10"
        style={{ background: "linear-gradient(158deg, #0b1220 0%, #171310 52%, #3b1a08 100%)" }}
      />
      {/* Dos glows desenfocados dan profundidad sin dibujar nada. */}
      <div
        className="pointer-events-none absolute -right-24 -top-24 -z-10 h-96 w-96 rounded-full blur-[110px]"
        style={{ background: "rgb(194 65 12 / 0.55)" }}
      />
      <div
        className="pointer-events-none absolute -bottom-32 -left-20 -z-10 h-96 w-96 rounded-full blur-[120px]"
        style={{ background: "rgb(56 89 168 / 0.35)" }}
      />

      <div className="flex items-center gap-2.5">
        <span className="grid h-10 w-10 place-items-center rounded-[var(--radius-sm)] bg-accent text-accent-foreground">
          <Wrench className="h-5 w-5" aria-hidden />
        </span>
        <span className="text-display text-2xl tracking-wide text-white">TALLER</span>
      </div>

      <div className="flex flex-col items-center gap-6 py-6">
        <div className="h-52 w-52 xl:h-60 xl:w-60">
          <Tacometro tema="oscuro" />
        </div>
        <div className="max-w-sm space-y-2 text-center">
          <h2 className="text-3xl font-bold leading-tight tracking-tight text-white">
            El taller entero, en el celular
          </h2>
          <p className="text-sm leading-relaxed text-white/70">
            Dejá la planilla. Recibí el auto, cargá el trabajo y entregá el
            comprobante sin volver a la computadora.
          </p>
        </div>
      </div>

      <ul className="space-y-3">
        {VALOR.map(({ icono: Icono, titulo, detalle }) => (
          <li key={titulo} className="flex items-start gap-3">
            <span className="mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-[var(--radius-sm)] bg-white/10 text-accent-suave">
              <Icono className="h-4 w-4" aria-hidden />
            </span>
            <span>
              <span className="block text-sm font-semibold text-white">{titulo}</span>
              <span className="block text-caption text-white/60">{detalle}</span>
            </span>
          </li>
        ))}
      </ul>
    </section>
  );
}
