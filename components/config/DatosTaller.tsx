"use client";

import { useActionState } from "react";
import { Check, TriangleAlert } from "lucide-react";

import { actualizarTaller, type ResultadoConfig } from "@/lib/actions/config";

export interface Taller {
  nombre: string;
  cuit: string | null;
  direccion: string | null;
  telefono: string | null;
}

/**
 * Datos que salen en el encabezado del PDF que se le entrega al cliente.
 * Por eso se aclara en la pantalla: si no, quedan vacíos y el comprobante
 * sale sin forma de contactar al taller.
 */
export function DatosTaller({ taller, editable }: { taller: Taller; editable: boolean }) {
  const [estado, accion, pendiente] = useActionState<ResultadoConfig, FormData>(
    actualizarTaller,
    {},
  );

  return (
    <section className="tarjeta space-y-4 p-4">
      <div>
        <h2 className="t-seccion">Datos del taller</h2>
        <p className="mt-1 text-caption text-muted-foreground">
          Aparecen en el encabezado del comprobante que recibe el cliente.
        </p>
      </div>

      <form action={accion} className="space-y-3">
        <Campo etiqueta="Nombre" name="nombre" defaultValue={taller.nombre} required disabled={!editable} />
        <div className="grid gap-3 sm:grid-cols-2">
          <Campo etiqueta="CUIT" name="cuit" defaultValue={taller.cuit ?? ""} disabled={!editable} placeholder="Opcional" />
          <Campo
            etiqueta="Teléfono"
            name="telefono"
            type="tel"
            inputMode="tel"
            defaultValue={taller.telefono ?? ""}
            disabled={!editable}
            placeholder="Opcional"
          />
        </div>
        <Campo
          etiqueta="Dirección"
          name="direccion"
          defaultValue={taller.direccion ?? ""}
          disabled={!editable}
          placeholder="Opcional"
        />

        {estado.error && (
          <p role="alert" className="flex items-start gap-2 text-caption text-destructive">
            <TriangleAlert className="mt-px h-3.5 w-3.5 shrink-0" aria-hidden />
            {estado.error}
          </p>
        )}
        {estado.ok && (
          <p className="flex items-center gap-2 text-caption text-estado-ok">
            <Check className="h-3.5 w-3.5 shrink-0" aria-hidden />
            Datos guardados
          </p>
        )}

        {editable && (
          <button
            type="submit"
            disabled={pendiente}
            className="min-h-11 rounded-[var(--radius-sm)] bg-primary px-4 text-sm font-semibold text-primary-foreground transition-transform active:scale-[0.98] disabled:opacity-60"
          >
            {pendiente ? "Guardando…" : "Guardar cambios"}
          </button>
        )}
      </form>
    </section>
  );
}

function Campo({
  etiqueta,
  name,
  ...props
}: { etiqueta: string; name: string } & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <label className="block space-y-1.5">
      <span className="text-caption font-medium text-muted-foreground">{etiqueta}</span>
      <input
        name={name}
        className="min-h-11 w-full rounded-[var(--radius-sm)] border border-border bg-card px-3 text-base text-foreground outline-none transition-shadow focus:border-accent focus:shadow-[0_0_0_3px_color-mix(in_srgb,var(--accent)_18%,transparent)] disabled:bg-muted disabled:text-muted-foreground"
        {...props}
      />
    </label>
  );
}
