"use client";

import { BadgeCheck, Droplets, Info, Loader2, Plus } from "lucide-react";
import { useRouter } from "next/navigation";
import { useTransition } from "react";

import { useIsla } from "@/components/isla/IslaContext";
import { cargarAceiteDeFicha, type FichaVehiculo } from "@/lib/actions/ficha";

/**
 * "Este auto lleva".
 *
 * El dato que el mecánico va a buscar al manual o a Google mientras el auto
 * está arriba del elevador. Cuelga de la motorización, así que es específico de
 * ESTE motor y no del modelo — que es la diferencia entre 6,3 y 8,5 litros en
 * una Amarok.
 *
 * Cuando el dato lo aportó un taller y nadie lo verificó, se dice. Presentar un
 * aporte con la misma autoridad que el manual es cómo un error de tipeo se
 * convierte en un motor cargado de menos.
 */
export function PanelFicha({
  ficha,
  otId,
  vehiculoId,
}: {
  ficha: FichaVehiculo | null;
  otId: string;
  vehiculoId: string;
}) {
  const router = useRouter();
  const { notificar } = useIsla();
  const [pendiente, iniciar] = useTransition();

  // Sin motorización no hay ficha posible. Se dice qué hacer, en vez de no
  // mostrar nada y dejar al usuario preguntándose.
  if (!ficha) {
    return (
      <section className="rounded-2xl border border-dashed border-border bg-card p-4">
        <h2 className="flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-foreground">
          <Droplets className="h-4 w-4 text-accent" aria-hidden />
          Este auto lleva
        </h2>
        <p className="mt-2 text-caption text-muted-foreground">
          Falta cargarle la motorización al vehículo. Sin saber qué motor es no se
          puede decir cuántos litros lleva: en el mismo modelo suele cambiar.
        </p>
      </section>
    );
  }

  const filas: [string, string | null][] = [
    [
      "Aceite de motor",
      ficha.aceite_litros && ficha.aceite_viscosidad
        ? `${ficha.aceite_litros} L · ${ficha.aceite_viscosidad}${ficha.aceite_norma ? ` · ${ficha.aceite_norma}` : ""}`
        : null,
    ],
    ["Filtro de aceite", ficha.filtro_aceite],
    ["Filtro de aire", ficha.filtro_aire],
    ["Filtro de combustible", ficha.filtro_combustible],
    ["Filtro de habitáculo", ficha.filtro_habitaculo],
    ["Caja", [ficha.caja_tipo, ficha.caja_aceite].filter(Boolean).join(" · ") || null],
    ["Refrigerante", ficha.refrigerante],
    ["Líquido de frenos", ficha.liquido_frenos],
    [
      "Service cada",
      ficha.service_km
        ? `${ficha.service_km.toLocaleString("es-AR")} km${ficha.service_meses ? ` o ${ficha.service_meses} meses` : ""}`
        : null,
    ],
  ];

  const conDato = filas.filter(([, v]) => v);
  const puedeCargarAceite = Boolean(ficha.aceite_litros && ficha.aceite_viscosidad);
  // Capturado en una const: TypeScript no arrastra el narrowing del guard de
  // arriba dentro de un callback asincrónico.
  const viscosidad = ficha.aceite_viscosidad;

  function cargar() {
    iniciar(async () => {
      const res = await cargarAceiteDeFicha(otId, vehiculoId);
      if (res.error) {
        notificar({ tipo: "error", mensaje: res.error });
        return;
      }
      notificar({
        tipo: res.sinStock ? "alerta" : "exito",
        mensaje: res.sinStock
          ? `Aceite cargado, pero no hay un ${viscosidad} en stock: no descuenta inventario`
          : `${res.productoUsado} cargado al presupuesto`,
      });
      router.refresh();
    });
  }

  return (
    <section className="space-y-3 rounded-2xl border border-border bg-card p-4">
      <div className="flex items-start justify-between gap-2">
        <h2 className="flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-foreground">
          <Droplets className="h-4 w-4 text-accent" aria-hidden />
          Este auto lleva
        </h2>
        {ficha.tiene_ficha &&
          (ficha.verificada ? (
            <span className="flex shrink-0 items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[0.6875rem] font-semibold text-emerald-700">
              <BadgeCheck className="h-3 w-3" aria-hidden />
              Verificado
            </span>
          ) : (
            <span className="flex shrink-0 items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 text-[0.6875rem] font-semibold text-amber-800">
              <Info className="h-3 w-3" aria-hidden />
              Cargado por el taller
            </span>
          ))}
      </div>

      <p className="text-caption text-muted-foreground">
        {ficha.modelo} · {ficha.motorizacion}
      </p>

      {conDato.length === 0 ? (
        <p className="text-caption text-muted-foreground">
          Todavía no hay ficha para este motor. Es esperable: las capacidades y
          los códigos de filtro se van cargando con el uso, y una ficha
          equivocada sería peor que ninguna.
        </p>
      ) : (
        <dl className="divide-y divide-border">
          {conDato.map(([etiqueta, valor]) => (
            <div key={etiqueta} className="flex items-baseline justify-between gap-3 py-2">
              <dt className="text-caption text-muted-foreground">{etiqueta}</dt>
              <dd className="text-right text-sm font-semibold text-foreground">{valor}</dd>
            </div>
          ))}
        </dl>
      )}

      {ficha.notas && (
        <p className="rounded-xl bg-muted px-3 py-2 text-caption text-muted-foreground">
          {ficha.notas}
        </p>
      )}

      {puedeCargarAceite && (
        <button
          type="button"
          onClick={cargar}
          disabled={pendiente}
          className="flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-accent/10 text-sm font-bold text-accent transition-transform active:scale-[0.98] disabled:opacity-60"
        >
          {pendiente ? (
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
          ) : (
            <Plus className="h-4 w-4" aria-hidden />
          )}
          Cargar {ficha.aceite_litros} L de {ficha.aceite_viscosidad} al presupuesto
        </button>
      )}

      {conDato.length > 0 && !ficha.verificada && (
        <p className="text-caption text-muted-foreground">
          Este dato lo cargó un taller y nadie lo verificó todavía. Chequealo
          contra el manual antes de confiarle un motor.
        </p>
      )}
    </section>
  );
}
