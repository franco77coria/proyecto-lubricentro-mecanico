"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Plus, ScanLine } from "lucide-react";
import { Sheet } from "@/components/sheet/Sheet";
import dynamic from "next/dynamic";

const LectorCodigo = dynamic(
  () => import("@/components/campos/LectorCodigo").then((mod) => mod.LectorCodigo),
  { ssr: false },
);
import { crearVehiculo } from "@/lib/actions/vehiculos";
import { escanearCedulaVerdeAction } from "@/lib/actions/cedula-verde";
import { useIsla } from "@/components/isla/IslaContext";

export function ModalNuevoVehiculo() {
  const router = useRouter();
  const { notificar } = useIsla();
  const [abierto, setAbierto] = useState(false);
  const [escaneando, setEscaneando] = useState(false);
  const [isPending, startTransition] = useTransition();

  const [patenteNueva, setPatenteNueva] = useState("");
  const [vinNuevo, setVinNuevo] = useState("");
  const [anioNuevo, setAnioNuevo] = useState("");

  const limpiar = () => {
    setPatenteNueva("");
    setVinNuevo("");
    setAnioNuevo("");
    setAbierto(false);
  };

  const handleCedulaIA = async (dataUri: string) => {
    setEscaneando(false);
    try {
      const res = await escanearCedulaVerdeAction(dataUri);
      if (res.datos) {
        if (res.datos.patente) setPatenteNueva(res.datos.patente);
        if (res.datos.vin) setVinNuevo(res.datos.vin);
        if (res.datos.anio) setAnioNuevo(String(res.datos.anio));
        notificar({ tipo: "exito", mensaje: `✨ Cédula leída con IA: ${res.datos.patente || "Leída"}` });
      } else if (res.error) {
        notificar({ tipo: "alerta", mensaje: res.error });
      }
    } catch {
      notificar({ tipo: "error", mensaje: "No se pudo leer la cédula con IA." });
    }
  };

  const handleCrear = (e: React.FormEvent) => {
    e.preventDefault();
    if (!patenteNueva.trim()) return;

    startTransition(async () => {
      const formData = new FormData();
      formData.append("patente", patenteNueva.trim());
      if (vinNuevo.trim()) formData.append("vin", vinNuevo.trim());
      if (anioNuevo.trim()) formData.append("anio", anioNuevo.trim());

      const res = await crearVehiculo({}, formData);

      if (res.error) {
        notificar({ tipo: "error", mensaje: res.error || "No se pudo registrar el auto." });
        return;
      }

      if (res.duplicado) {
        notificar({
          tipo: "alerta",
          mensaje: `La patente ${res.duplicado.patente} ya existe en el taller (${res.duplicado.descripcion}).`,
        });
        limpiar();
        return;
      }

      if (res.creado) {
        notificar({ tipo: "exito", mensaje: `Vehículo ${res.creado.patente} registrado con éxito.` });
        limpiar();
        router.refresh();
      }
    });
  };

  return (
    <>
      {escaneando && (
        <LectorCodigo
          titulo="Escanear cédula (IA)"
          ayuda="Encuadrá la cédula y presioná Capturar con IA, o elegí una foto de la galería."
          onCapturaFotoIA={handleCedulaIA}
          onCerrar={() => setEscaneando(false)}
        />
      )}

      <button
        type="button"
        onClick={() => setAbierto(true)}
        className="flex min-h-11 items-center gap-2 rounded-[var(--radius-sm)] border border-border bg-card px-4 text-sm font-semibold text-foreground shadow-[var(--sombra-sutil)] transition-all hover:bg-muted active:scale-[0.98]"
      >
        <Plus className="h-4 w-4" strokeWidth={2.5} aria-hidden />
        <span>Nuevo auto</span>
      </button>

      <Sheet
        abierto={abierto}
        onCerrar={limpiar}
        titulo="Registrar Nuevo Auto"
      >
        <div className="p-1">
          <form onSubmit={handleCrear} className="space-y-4">
            <button
              type="button"
              onClick={() => setEscaneando(true)}
              className="flex min-h-11 w-full items-center justify-center gap-2 rounded-xl border border-accent/40 bg-accent/10 text-xs font-bold text-accent active:scale-98 transition-transform"
            >
              <ScanLine className="h-4 w-4" />
              <span>Escanear Cédula Verde</span>
            </button>

            <div>
              <label className="text-caption font-semibold text-muted-foreground block mb-1">
                Patente *
              </label>
              <input
                type="text"
                required
                placeholder="Ej: AA123BB"
                value={patenteNueva}
                onChange={(e) => setPatenteNueva(e.target.value.toUpperCase())}
                className="w-full rounded-xl border border-border bg-muted px-3 py-2.5 text-sm font-bold font-mono text-foreground focus:border-accent focus:outline-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-caption font-semibold text-muted-foreground block mb-1">
                  Año (opcional)
                </label>
                <input
                  type="number"
                  placeholder="Ej: 2020"
                  value={anioNuevo}
                  onChange={(e) => setAnioNuevo(e.target.value)}
                  className="w-full rounded-xl border border-border bg-muted px-3 py-2 text-xs font-medium text-foreground focus:border-accent focus:outline-none"
                />
              </div>
              <div>
                <label className="text-caption font-semibold text-muted-foreground block mb-1">
                  VIN / Chasis (opcional)
                </label>
                <input
                  type="text"
                  placeholder="17 caracteres"
                  value={vinNuevo}
                  onChange={(e) => setVinNuevo(e.target.value.toUpperCase())}
                  maxLength={17}
                  className="w-full rounded-xl border border-border bg-muted px-3 py-2 text-xs font-mono font-medium text-foreground focus:border-accent focus:outline-none"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isPending || !patenteNueva.trim()}
              className="flex min-h-12 w-full items-center justify-center rounded-2xl bg-accent text-sm font-bold text-white shadow-md active:scale-98 transition-transform disabled:opacity-50 mt-2"
            >
              {isPending ? "Guardando..." : "Registrar Vehículo"}
            </button>
          </form>
        </div>
      </Sheet>
    </>
  );
}
