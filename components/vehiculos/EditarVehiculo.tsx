"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Pencil, UserCog } from "lucide-react";

import { useIsla } from "@/components/isla/IslaContext";
import { Sheet } from "@/components/sheet/Sheet";
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
          className="flex min-h-11 items-center gap-1.5 rounded-xl bg-card border border-border/80 px-4 text-xs font-bold text-foreground shadow-sm transition-transform active:scale-[0.98] hover:border-accent"
        >
          <Pencil className="h-4 w-4 text-accent" aria-hidden />
          <span>Editar datos</span>
        </button>
        <button
          type="button"
          onClick={() => setAbierto("dueno")}
          className="flex min-h-11 items-center gap-1.5 rounded-xl bg-card border border-border/80 px-4 text-xs font-bold text-foreground shadow-sm transition-transform active:scale-[0.98] hover:border-accent"
        >
          <UserCog className="h-4 w-4 text-accent" aria-hidden />
          <span>Cambiar dueño</span>
        </button>
      </div>

      <Sheet
        abierto={abierto === "datos"}
        onCerrar={() => setAbierto(null)}
        titulo="Datos del Vehículo"
      >
        <form onSubmit={guardarDatos} className="space-y-4 p-5">
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
            <span className="text-caption font-semibold text-muted-foreground">Combustible</span>
            <select
              value={f.combustible}
              onChange={set("combustible")}
              className="min-h-12 w-full rounded-xl border border-border bg-card px-3.5 text-base font-medium text-foreground outline-none focus:border-accent"
            >
              {COMBUSTIBLES.map((c) => (
                <option key={c.v} value={c.v}>
                  {c.t}
                </option>
              ))}
            </select>
          </label>
          <Campo etiqueta="Número de Chasis / VIN" value={f.vin} onChange={set("vin")} />

          {error && (
            <p role="alert" className="text-caption text-destructive font-bold">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={pendiente}
            className="min-h-12 w-full rounded-2xl bg-accent text-base font-bold text-white shadow-md transition-transform active:scale-[0.98] disabled:opacity-60"
          >
            {pendiente ? "Guardando…" : "Guardar cambios"}
          </button>
        </form>
      </Sheet>

      <Sheet
        abierto={abierto === "dueno"}
        onCerrar={() => setAbierto(null)}
        titulo="Cambiar Dueño del Vehículo"
      >
        <form onSubmit={guardarDueno} className="space-y-4 p-5">
          <label className="block space-y-1.5">
            <span className="text-caption font-semibold text-muted-foreground">Nuevo titular</span>
            <select
              value={nuevoDueno}
              onChange={(e) => setNuevoDueno(e.target.value)}
              className="min-h-12 w-full rounded-xl border border-border bg-card px-3.5 text-base font-semibold text-foreground outline-none focus:border-accent"
            >
              <option value="">Seleccioná un cliente…</option>
              {clientes.map((c) => (
                <option key={c.id} value={c.id}>
                  {[c.nombre, c.apellido].filter(Boolean).join(" ")}
                </option>
              ))}
            </select>
          </label>

          <p className="text-caption text-muted-foreground">
            El cambio queda registrado con la fecha de hoy. El historial mecánico previo se conserva intacto.
          </p>

          {error && (
            <p role="alert" className="text-caption text-destructive font-bold">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={pendiente}
            className="min-h-12 w-full rounded-2xl bg-accent text-base font-bold text-white shadow-md transition-transform active:scale-[0.98] disabled:opacity-60"
          >
            {pendiente ? "Guardando…" : "Asignar nuevo titular"}
          </button>
        </form>
      </Sheet>
    </>
  );
}

function Campo({
  etiqueta,
  ...props
}: { etiqueta: string } & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <label className="block space-y-1.5">
      <span className="text-caption font-semibold text-muted-foreground">{etiqueta}</span>
      <input
        className="min-h-12 w-full rounded-xl border border-border bg-card px-3.5 text-base text-foreground outline-none focus:border-accent"
        {...props}
      />
    </label>
  );
}
