"use client";

import { ArrowLeft, Car, Plus, Trash2, User } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { PatenteInput } from "@/components/campos/PatenteInput";
import { SelectorVehiculo, type ValorVehiculo } from "@/components/campos/SelectorVehiculo";
import type { OpcionCatalogo } from "@/lib/actions/catalogo";
import { crearOrdenTrabajo } from "@/lib/actions/ot";
import { crearVehiculo } from "@/lib/actions/vehiculos";

const VEHICULO_VACIO: ValorVehiculo = { marcaId: "", modeloId: "", motorizacionId: "" };

export function FormNuevaOT({ marcas }: { marcas: OpcionCatalogo[] }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Form campos
  const [patente, setPatente] = useState("");
  const [formatoEspecial, setFormatoEspecial] = useState(false);
  const [vehiculo, setVehiculo] = useState<ValorVehiculo>(VEHICULO_VACIO);
  const [km, setKm] = useState("");
  const [tipo, setTipo] = useState<"lubricentro" | "mecanica" | "mixto">("lubricentro");
  const [clienteNombre, setClienteNombre] = useState("");
  const [clienteTelefono, setClienteTelefono] = useState("");
  const [anomaliaTexto, setAnomaliaTexto] = useState("");
  const [anomalias, setAnomalias] = useState<string[]>([]);
  const [observaciones, setObservaciones] = useState("");

  const handleAgregarAnomalia = () => {
    if (!anomaliaTexto.trim()) return;
    setAnomalias((prev) => [...prev, anomaliaTexto.trim()]);
    setAnomaliaTexto("");
  };

  const handleQuitarAnomalia = (index: number) => {
    setAnomalias((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    startTransition(async () => {
      // 1. Crear o buscar vehículo
      const formDataVehiculo = new FormData();
      formDataVehiculo.append("patente", patente);
      if (formatoEspecial) formDataVehiculo.append("formatoEspecial", "on");
      if (vehiculo.marcaId) formDataVehiculo.append("marcaId", vehiculo.marcaId);
      if (vehiculo.modeloId) formDataVehiculo.append("modeloId", vehiculo.modeloId);
      if (vehiculo.motorizacionId)
        formDataVehiculo.append("motorizacionId", vehiculo.motorizacionId);
      if (km) formDataVehiculo.append("km", km);
      if (clienteNombre) formDataVehiculo.append("clienteNombre", clienteNombre);
      if (clienteTelefono) formDataVehiculo.append("clienteTelefono", clienteTelefono);

      const resVehiculo = await crearVehiculo({}, formDataVehiculo);

      const vehiculoId = resVehiculo.creado?.id || resVehiculo.duplicado?.id;

      if (!vehiculoId) {
        setErrorMsg(resVehiculo.error || "Error al registrar el vehículo.");
        return;
      }

      // 2. Crear la Orden de Trabajo
      const resOT = await crearOrdenTrabajo({
        vehiculoId,
        tipo,
        kmIngreso: km ? Number(km) : 0,
        observaciones: observaciones.trim() || undefined,
        anomalias: anomalias.length > 0 ? anomalias : undefined,
      });

      if (resOT.error || !resOT.otId) {
        setErrorMsg(resOT.error || "No se pudo generar la Orden de Trabajo.");
        return;
      }

      // Redirigir a la OT creada
      router.push(`/ot/${resOT.otId}`);
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Header Back */}
      <div className="flex items-center gap-2">
        <Link
          href="/tablero"
          className="inline-flex items-center gap-1 text-xs font-semibold text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Cancelar</span>
        </Link>
      </div>

      <header className="space-y-1">
        <p className="text-caption text-muted-foreground">Recepción</p>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">
          Nueva Orden de Trabajo
        </h1>
      </header>

      {errorMsg && (
        <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-xs font-bold text-red-600">
          {errorMsg}
        </div>
      )}

      {/* Bloque 1: Vehículo */}
      <section className="space-y-4 rounded-2xl border border-border bg-card p-4 shadow-sm">
        <div className="flex items-center gap-2 border-b border-border pb-3">
          <Car className="h-4 w-4 text-accent" />
          <h2 className="text-sm font-bold text-foreground">Datos del Vehículo</h2>
        </div>

        <PatenteInput
          value={patente}
          onChange={setPatente}
          formatoEspecial={formatoEspecial}
          onFormatoEspecialChange={setFormatoEspecial}
        />

        <SelectorVehiculo marcas={marcas} valor={vehiculo} onChange={setVehiculo} />

        <div>
          <label htmlFor="km-ingreso" className="text-caption text-muted-foreground">
            KM de Ingreso
          </label>
          <input
            id="km-ingreso"
            type="number"
            inputMode="numeric"
            min="0"
            placeholder="Ej: 85000"
            value={km}
            onChange={(e) => setKm(e.target.value)}
            className="mt-1 min-h-11 w-full rounded-xl border border-border bg-muted px-3 text-base font-medium text-foreground focus:border-accent focus:outline-none"
          />
        </div>
      </section>

      {/* Bloque 2: Cliente */}
      <section className="space-y-4 rounded-2xl border border-border bg-card p-4 shadow-sm">
        <div className="flex items-center gap-2 border-b border-border pb-3">
          <User className="h-4 w-4 text-accent" />
          <h2 className="text-sm font-bold text-foreground">Cliente (Opcional)</h2>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-caption text-muted-foreground">Nombre</label>
            <input
              type="text"
              placeholder="Ej: Juan"
              value={clienteNombre}
              onChange={(e) => setClienteNombre(e.target.value)}
              className="mt-1 min-h-11 w-full rounded-xl border border-border bg-muted px-3 text-xs font-medium text-foreground focus:border-accent focus:outline-none"
            />
          </div>

          <div>
            <label className="text-caption text-muted-foreground">Teléfono (WhatsApp)</label>
            <input
              type="tel"
              placeholder="Ej: 11 4455 6677"
              value={clienteTelefono}
              onChange={(e) => setClienteTelefono(e.target.value)}
              className="mt-1 min-h-11 w-full rounded-xl border border-border bg-muted px-3 text-xs font-medium text-foreground focus:border-accent focus:outline-none"
            />
          </div>
        </div>
      </section>

      {/* Bloque 3: Trabajo y Anomalías */}
      <section className="space-y-4 rounded-2xl border border-border bg-card p-4 shadow-sm">
        <h2 className="text-sm font-bold text-foreground">Tipo de Servicio y Observaciones</h2>

        <div>
          <label className="text-caption text-muted-foreground">Tipo de OT</label>
          <select
            value={tipo}
            onChange={(e) => setTipo(e.target.value as typeof tipo)}
            className="mt-1 min-h-11 w-full rounded-xl border border-border bg-muted px-3 text-xs font-semibold text-foreground focus:border-accent focus:outline-none"
          >
            <option value="lubricentro">Lubricentro / Service Rápido</option>
            <option value="mecanica">Mecánica General</option>
            <option value="mixto">Mixto (Mecánica + Lubricentro)</option>
          </select>
        </div>

        <div>
          <label className="text-caption text-muted-foreground">Anomalías reportadas por cliente</label>
          <div className="mt-1 flex gap-2">
            <input
              type="text"
              placeholder="Ej: Hace un zumbido al pasar los 80 km/h"
              value={anomaliaTexto}
              onChange={(e) => setAnomaliaTexto(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  handleAgregarAnomalia();
                }
              }}
              className="min-h-11 flex-1 rounded-xl border border-border bg-muted px-3 text-xs text-foreground focus:border-accent focus:outline-none"
            />
            <button
              type="button"
              onClick={handleAgregarAnomalia}
              className="inline-flex min-h-11 items-center justify-center rounded-xl bg-muted px-3 text-xs font-bold text-foreground transition-transform active:scale-95"
            >
              <Plus className="h-4 w-4" />
            </button>
          </div>

          {anomalias.length > 0 && (
            <ul className="mt-2 space-y-1.5">
              {anomalias.map((anom, idx) => (
                <li key={idx} className="flex items-center justify-between rounded-lg bg-muted/60 px-3 py-1.5 text-xs text-foreground font-medium">
                  <span>• {anom}</span>
                  <button
                    type="button"
                    onClick={() => handleQuitarAnomalia(idx)}
                    className="text-muted-foreground hover:text-red-600"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* El campo ya se enviaba al servidor pero no había dónde escribirlo,
            así que llegaba siempre vacío. Va separado de las anomalías: eso es
            lo que dice el cliente, esto es lo que anota el taller. */}
        <div>
          <label htmlFor="obs-ot" className="text-caption text-muted-foreground">
            Observaciones internas (opcional)
          </label>
          <textarea
            id="obs-ot"
            rows={2}
            value={observaciones}
            onChange={(e) => setObservaciones(e.target.value)}
            placeholder="Ej. el cliente lo pasa a buscar el viernes"
            maxLength={500}
            className="mt-1 w-full resize-none rounded-xl border border-border bg-muted px-3 py-2 text-xs text-foreground focus:border-accent focus:outline-none"
          />
        </div>
      </section>

      <button
        type="submit"
        disabled={isPending || !patente.trim()}
        className="flex min-h-12 w-full items-center justify-center rounded-xl bg-accent text-sm font-bold text-white shadow-lg transition-transform active:scale-[0.98] disabled:opacity-50"
      >
        {isPending ? "Generando OT..." : "Iniciar Orden de Trabajo"}
      </button>
    </form>
  );
}
