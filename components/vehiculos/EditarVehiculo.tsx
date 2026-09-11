"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Fuel, Pencil, User, UserCog, Zap } from "lucide-react";

import { useIsla } from "@/components/isla/IslaContext";
import { Sheet } from "@/components/sheet/Sheet";
import { actualizarVehiculo, cambiarDuenoVehiculo } from "@/lib/actions/clientes";
import { DesplegableModerno, type OpcionDesplegable } from "@/components/ui/DesplegableModerno";

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

const OPCIONES_COMBUSTIBLE: OpcionDesplegable[] = COMBUSTIBLES.map((c) => ({
  valor: c.v,
  etiqueta: c.t,
  icono: c.v === "hibrido" || c.v === "electrico" ? Zap : Fuel,
}));

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
  const [prevVehiculo, setPrevVehiculo] = useState(vehiculo);
  if (vehiculo !== prevVehiculo) {
    setPrevVehiculo(vehiculo);
    setF({
      anio: vehiculo.anio?.toString() ?? "",
      color: vehiculo.color ?? "",
      vin: vehiculo.vin ?? "",
      km: vehiculo.km_actual?.toString() ?? "",
      combustible: vehiculo.combustible ?? "",
    });
  }

  const [nuevoDueno, setNuevoDueno] = useState(duenoActualId ?? "");
  const [prevDueno, setPrevDueno] = useState(duenoActualId);
  if (duenoActualId !== prevDueno) {
    setPrevDueno(duenoActualId);
    setNuevoDueno(duenoActualId ?? "");
  }

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
            <Campo etiqueta="Año" type="number" min="1900" max="2100" value={f.anio} onChange={set("anio")} disabled={pendiente} />
            <Campo etiqueta="Color" value={f.color} onChange={set("color")} disabled={pendiente} />
          </div>
          <Campo
            etiqueta="Kilómetros"
            type="number"
            min="0"
            inputMode="numeric"
            value={f.km}
            onChange={set("km")}
            disabled={pendiente}
          />
          <div>
            <label className="text-caption font-semibold text-muted-foreground block mb-1.5">
              Combustible
            </label>
            <DesplegableModerno
              valor={f.combustible || ""}
              onChange={(v) => setF((prev) => ({ ...prev, combustible: v }))}
              opciones={OPCIONES_COMBUSTIBLE}
              className="w-full"
              botonClassName="min-h-12 rounded-xl text-sm font-semibold"
              disabled={pendiente}
            />
          </div>
          <Campo etiqueta="Número de Chasis / VIN" value={f.vin} onChange={set("vin")} disabled={pendiente} />

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
          <div>
            <label className="text-caption font-semibold text-muted-foreground block mb-1.5">
              Nuevo titular
            </label>
            <DesplegableModerno
              valor={nuevoDueno}
              onChange={setNuevoDueno}
              opciones={clientes.map((c) => ({
                valor: c.id,
                etiqueta: [c.nombre, c.apellido].filter(Boolean).join(" ") || "Cliente sin nombre",
                icono: User,
              }))}
              placeholder="Seleccioná un cliente…"
              className="w-full"
              botonClassName="min-h-12 rounded-xl text-sm font-semibold"
              disabled={pendiente}
            />
          </div>

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
        className="min-h-12 w-full rounded-xl border border-border bg-card px-3.5 text-base text-foreground outline-none focus:border-accent disabled:opacity-50"
        {...props}
      />
    </label>
  );
}
