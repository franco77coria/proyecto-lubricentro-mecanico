"use client";

import { useState, useTransition } from "react";
import { Plus, Search, ScanLine } from "lucide-react";
import { Sheet } from "@/components/sheet/Sheet";
import { PlacaPatente } from "@/components/ui/PlacaPatente";
import { LectorCodigo } from "@/components/campos/LectorCodigo";
import { FORMATOS_CEDULA } from "@/lib/codigo";
import { interpretarCedula } from "@/lib/cedula";
import { vincularVehiculoACliente, crearVehiculo } from "@/lib/actions/vehiculos";
import { useIsla } from "@/components/isla/IslaContext";
import { formatearVehiculoBadge } from "@/lib/vehiculo";

interface VehiculoOpcion {
  id: string;
  patente: string;
  marca?: string | null;
  modelo?: string | null;
  anio?: number | string | null;
  motorizacion?: string | null;
}

export function ModalAsociarVehiculo({
  clienteId,
  vehiculosTaller,
}: {
  clienteId: string;
  vehiculosTaller: VehiculoOpcion[];
}) {
  const [abierto, setAbierto] = useState(false);
  const [tab, setTab] = useState<"existente" | "nuevo">("existente");
  const [busqueda, setBusqueda] = useState("");
  const [patenteNueva, setPatenteNueva] = useState("");
  const [vinNuevo, setVinNuevo] = useState("");
  const [anioNuevo, setAnioNuevo] = useState("");
  const [escaneando, setEscaneando] = useState(false);
  const [isPending, startTransition] = useTransition();
  const { notificar } = useIsla();

  const filtrados = vehiculosTaller.filter((v) =>
    v.patente.toLowerCase().includes(busqueda.toLowerCase()) ||
    v.marca?.toLowerCase().includes(busqueda.toLowerCase()) ||
    v.modelo?.toLowerCase().includes(busqueda.toLowerCase())
  );

  const handleVincularExistente = (vehiculoId: string, patente: string) => {
    startTransition(async () => {
      const res = await vincularVehiculoACliente(clienteId, vehiculoId);
      if (res.error) {
        notificar({ tipo: "error", mensaje: res.error });
      } else {
        notificar({ tipo: "exito", mensaje: `Vehículo ${patente} vinculado al cliente.` });
        setAbierto(false);
      }
    });
  };

  const handleCedulaLeida = (texto: string) => {
    const d = interpretarCedula(texto);
    setEscaneando(false);
    if (d.patente) setPatenteNueva(d.patente);
    if (d.vin) setVinNuevo(d.vin);
    if (d.anio) setAnioNuevo(String(d.anio));
    notificar({ tipo: "exito", mensaje: `Cédula escaneada: ${d.patente || "Leída"}` });
  };

  const handleCrearYNuevo = (e: React.FormEvent) => {
    e.preventDefault();
    if (!patenteNueva.trim()) return;

    startTransition(async () => {
      const formData = new FormData();
      formData.append("patente", patenteNueva.trim());
      if (vinNuevo.trim()) formData.append("vin", vinNuevo.trim());
      if (anioNuevo.trim()) formData.append("anio", anioNuevo.trim());

      const res = await crearVehiculo({}, formData);
      const vehiculoId = res.creado?.id || res.duplicado?.id;

      if (!vehiculoId) {
        notificar({ tipo: "error", mensaje: res.error || "No se pudo registrar el auto." });
        return;
      }

      await vincularVehiculoACliente(clienteId, vehiculoId);
      notificar({ tipo: "exito", mensaje: `Vehículo ${patenteNueva} agregado y vinculado.` });
      setAbierto(false);
      setPatenteNueva("");
      setVinNuevo("");
      setAnioNuevo("");
    });
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setAbierto(true)}
        className="flex items-center gap-1.5 rounded-xl bg-accent px-3 py-1.5 text-xs font-bold text-white shadow-sm hover:opacity-90 active:scale-95 transition-all"
      >
        <Plus className="h-4 w-4" />
        <span>Vincular Vehículo</span>
      </button>

      {escaneando && (
        <LectorCodigo
          titulo="Escanear cédula verde"
          ayuda="Apuntá al QR o PDF417 de la cédula."
          formatos={FORMATOS_CEDULA}
          onLeido={handleCedulaLeida}
          onCerrar={() => setEscaneando(false)}
        />
      )}

      <Sheet abierto={abierto} onCerrar={() => setAbierto(false)} titulo="Vincular Vehículo al Cliente">
        <div className="space-y-4 p-4">
          {/* Pestañas */}
          <div className="grid grid-cols-2 rounded-xl bg-muted p-1 text-xs font-bold">
            <button
              type="button"
              onClick={() => setTab("existente")}
              className={`rounded-lg py-2 transition-all ${
                tab === "existente" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Auto del Taller
            </button>
            <button
              type="button"
              onClick={() => setTab("nuevo")}
              className={`rounded-lg py-2 transition-all ${
                tab === "nuevo" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Nuevo / Escanear Cédula
            </button>
          </div>

          {tab === "existente" ? (
            <div className="space-y-3">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Buscar por patente, marca o modelo..."
                  value={busqueda}
                  onChange={(e) => setBusqueda(e.target.value)}
                  className="w-full rounded-xl border border-border bg-muted pl-9 pr-3 py-2 text-xs font-medium text-foreground focus:border-accent focus:outline-none"
                />
              </div>

              <div className="max-h-60 overflow-y-auto space-y-2">
                {filtrados.length === 0 ? (
                  <p className="text-center py-6 text-xs text-muted-foreground">No se encontraron vehículos.</p>
                ) : (
                  filtrados.slice(0, 15).map((v) => (
                    <div
                      key={v.id}
                      className="flex items-center justify-between rounded-xl border border-border bg-card p-3 shadow-xs"
                    >
                      <div className="flex items-center gap-2.5">
                        <PlacaPatente patente={v.patente} size="sm" />
                        <span className="text-xs font-bold text-foreground truncate">
                          {formatearVehiculoBadge(v)}
                        </span>
                      </div>
                      <button
                        type="button"
                        disabled={isPending}
                        onClick={() => handleVincularExistente(v.id, v.patente)}
                        className="rounded-lg bg-accent/15 px-3 py-1.5 text-xs font-bold text-accent hover:bg-accent hover:text-white transition-colors"
                      >
                        Vincular
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>
          ) : (
            <form onSubmit={handleCrearYNuevo} className="space-y-3">
              <button
                type="button"
                onClick={() => setEscaneando(true)}
                className="flex min-h-11 w-full items-center justify-center gap-2 rounded-xl border border-accent/40 bg-accent/10 text-xs font-bold text-accent active:scale-98 transition-transform"
              >
                <ScanLine className="h-4 w-4" />
                <span>Escanear Cédula Verde</span>
              </button>

              <div>
                <label className="text-caption text-muted-foreground">Patente</label>
                <input
                  type="text"
                  required
                  placeholder="Ej: AA123BB"
                  value={patenteNueva}
                  onChange={(e) => setPatenteNueva(e.target.value.toUpperCase())}
                  className="mt-1 w-full rounded-xl border border-border bg-muted px-3 py-2 text-sm font-bold font-mono text-foreground focus:border-accent focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-caption text-muted-foreground">Año (opcional)</label>
                  <input
                    type="number"
                    placeholder="Ej: 2020"
                    value={anioNuevo}
                    onChange={(e) => setAnioNuevo(e.target.value)}
                    className="mt-1 w-full rounded-xl border border-border bg-muted px-3 py-2 text-xs font-medium text-foreground focus:border-accent focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-caption text-muted-foreground">VIN / Chasis (opcional)</label>
                  <input
                    type="text"
                    placeholder="17 caracteres"
                    value={vinNuevo}
                    onChange={(e) => setVinNuevo(e.target.value.toUpperCase())}
                    maxLength={17}
                    className="mt-1 w-full rounded-xl border border-border bg-muted px-3 py-2 text-xs font-mono font-medium text-foreground focus:border-accent focus:outline-none"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isPending || !patenteNueva.trim()}
                className="flex min-h-11 w-full items-center justify-center rounded-xl bg-accent text-xs font-bold text-white shadow-md active:scale-98 transition-transform disabled:opacity-50"
              >
                {isPending ? "Guardando..." : "Crear y Asociar Vehículo"}
              </button>
            </form>
          )}
        </div>
      </Sheet>
    </>
  );
}
