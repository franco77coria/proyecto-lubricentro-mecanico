"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Pencil, UserCog, X } from "lucide-react";

import { useIsla } from "@/components/isla/IslaContext";
import { actualizarVehiculo, cambiarDuenoVehiculo } from "@/lib/actions/clientes";

export interface DatosVehiculo {
  id: string;
  anio?: number | null;
  color?: string | null;
  vin?: string | null;
  km_actual?: number | null;
  combustible?: string | null;
}

export interface OpcionCliente {
  id: string;
  nombre: string;
  apellido: string | null;
}

const COMBUSTIBLES = [
  { v: "", t: "Sin especificar" },
  { v: "nafta", t: "Nafta" },
  { v: "diesel", t: "Diésel" },
  { v: "gnc", t: "GNC" },
  { v: "hibrido", t: "Híbrido" },
  { v: "electrico", t: "Eléctrico" },
];

/**
 * Corrección de datos del vehículo y cambio de dueño.
 *
 * La patente no aparece: es la identidad del auto en el sistema. Si está mal
 * cargada, el camino correcto es dar de alta el auto bien y no reescribir la
 * chapa de uno que ya tiene historial colgado.
 */
export function EditarVehiculo({
  vehiculo,
  clientes,
  duenoActualId,
}: {
  vehiculo: DatosVehiculo;
  clientes: OpcionCliente[];
  duenoActualId?: string | null;
}) {
  const router = useRouter();
  const { notificar } = useIsla();
  const [abierto, setAbierto] = useState<"datos" | "dueno" | null>(null);
  const [pendiente, iniciar] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const [f, setF] = useState({
    anio: vehiculo.anio?.toString() ?? "",
    color: vehiculo.color ?? "",
    vin: vehiculo.vin ?? "",
    km: vehiculo.km_actual?.toString() ?? "",
    combustible: vehiculo.combustible ?? "",
  });
  const [nuevoDueno, setNuevoDueno] = useState(duenoActualId ?? "");

  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setF((prev) => ({ ...prev, [k]: e.target.value }));

  function guardarDatos(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    iniciar(async () => {
      const res = await actualizarVehiculo(vehiculo.id, {
        anio: f.anio ? Number(f.anio) : null,
        color: f.color,
        vin: f.vin,
        km: f.km ? Number(f.km) : null,
        combustible: f.combustible,
      });
      if (res.error) return setError(res.error);
      notificar({ tipo: "exito", mensaje: "Datos del auto actualizados" });
      setAbierto(null);
      router.refresh();
    });
  }

  function guardarDueno(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!nuevoDueno) return setError("Elegí un cliente");

    iniciar(async () => {
      const res = await cambiarDuenoVehiculo(vehiculo.id, nuevoDueno);
      if (res.error) return setError(res.error);
      notificar({ tipo: "exito", mensaje: "Dueño actualizado" });
      setAbierto(null);
      router.refresh();
    });
  }

  return (
    <>
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => setAbierto("datos")}
          className="flex min-h-10 items-center gap-1.5 rounded-[var(--radius-sm)] bg-muted px-3 text-caption font-semibold text-foreground transition-transform active:scale-[0.98]"
        >
          <Pencil className="h-3.5 w-3.5" aria-hidden />
          Editar datos
        </button>
        <button
          type="button"
          onClick={() => setAbierto("dueno")}
          className="flex min-h-10 items-center gap-1.5 rounded-[var(--radius-sm)] bg-muted px-3 text-caption font-semibold text-foreground transition-transform active:scale-[0.98]"
        >
          <UserCog className="h-3.5 w-3.5" aria-hidden />
          Cambiar dueño
        </button>
      </div>

      {abierto && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-slate-900/50 sm:items-center sm:p-4"
          role="dialog"
          aria-modal="true"
        >
          <div className="max-h-[88dvh] w-full overflow-y-auto rounded-t-[var(--radius-lg)] bg-card p-5 pb-[calc(var(--safe-bottom)+1.25rem)] shadow-[var(--sombra-alta)] sm:max-w-md sm:rounded-[var(--radius-lg)] sm:pb-5">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-base font-semibold text-foreground">
                {abierto === "datos" ? "Datos del vehículo" : "Cambiar dueño"}
              </h3>
              <button
                type="button"
                onClick={() => setAbierto(null)}
                aria-label="Cerrar"
                className="grid h-9 w-9 place-items-center rounded-full text-muted-foreground hover:bg-muted"
              >
                <X className="h-4.5 w-4.5" aria-hidden />
              </button>
            </div>

            {abierto === "datos" ? (
              <form onSubmit={guardarDatos} className="space-y-3">
                <div className="grid gap-3 sm:grid-cols-2">
                  <Campo etiqueta="Año" type="number" min="1900" max="2100" value={f.anio} onChange={set("anio")} />
                  <Campo etiqueta="Color" value={f.color} onChange={set("color")} />
                </div>
                <Campo
                  etiqueta="Kilómetros"
                  type="number"
                  min="0"
                  inputMode="numeric"
                  value={f.km}
                  onChange={set("km")}
                />
                <label className="block space-y-1.5">
                  <span className="text-caption font-medium text-muted-foreground">Combustible</span>
                  <select
                    value={f.combustible}
                    onChange={set("combustible")}
                    className="min-h-11 w-full rounded-[var(--radius-sm)] border border-border bg-card px-3 text-base text-foreground outline-none focus:border-accent"
                  >
                    {COMBUSTIBLES.map((c) => (
                      <option key={c.v} value={c.v}>
                        {c.t}
                      </option>
                    ))}
                  </select>
                </label>
                <Campo etiqueta="Número de chasis" value={f.vin} onChange={set("vin")} />

                {error && (
                  <p role="alert" className="text-caption text-destructive">
                    {error}
                  </p>
                )}
                <Enviar pendiente={pendiente} texto="Guardar cambios" />
              </form>
            ) : (
              <form onSubmit={guardarDueno} className="space-y-3">
                <label className="block space-y-1.5">
                  <span className="text-caption font-medium text-muted-foreground">
                    Nuevo dueño
                  </span>
                  <select
                    value={nuevoDueno}
                    onChange={(e) => setNuevoDueno(e.target.value)}
                    className="min-h-11 w-full rounded-[var(--radius-sm)] border border-border bg-card px-3 text-base text-foreground outline-none focus:border-accent"
                  >
                    <option value="">Elegir cliente…</option>
                    {clientes.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.nombre} {c.apellido ?? ""}
                      </option>
                    ))}
                  </select>
                </label>

                <p className="text-caption text-muted-foreground">
                  El dueño anterior queda registrado con su fecha de fin. El historial
                  de trabajos no se mueve: pertenece al auto.
                </p>

                {clientes.length === 0 && (
                  <p className="text-caption text-muted-foreground">
                    No hay clientes cargados todavía. Agregá uno desde la pantalla de
                    Clientes.
                  </p>
                )}

                {error && (
                  <p role="alert" className="text-caption text-destructive">
                    {error}
                  </p>
                )}
                <Enviar pendiente={pendiente} texto="Cambiar dueño" />
              </form>
            )}
          </div>
        </div>
      )}
    </>
  );
}

function Campo({
  etiqueta,
  ...props
}: { etiqueta: string } & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <label className="block space-y-1.5">
      <span className="text-caption font-medium text-muted-foreground">{etiqueta}</span>
      <input
        className="min-h-11 w-full rounded-[var(--radius-sm)] border border-border bg-card px-3 text-base text-foreground outline-none focus:border-accent"
        {...props}
      />
    </label>
  );
}

function Enviar({ pendiente, texto }: { pendiente: boolean; texto: string }) {
  return (
    <button
      type="submit"
      disabled={pendiente}
      className="min-h-11 w-full rounded-[var(--radius-sm)] bg-accent text-sm font-semibold text-accent-foreground transition-transform active:scale-[0.98] disabled:opacity-60"
    >
      {pendiente ? "Guardando…" : texto}
    </button>
  );
}
