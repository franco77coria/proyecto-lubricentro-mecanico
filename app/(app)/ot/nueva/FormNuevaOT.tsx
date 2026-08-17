"use client";

import { ArrowLeft, Car, Plus, RotateCcw, ScanLine, Trash2, User } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState, useTransition } from "react";

import { LectorCodigo } from "@/components/campos/LectorCodigo";
import { PatenteInput } from "@/components/campos/PatenteInput";
import { SelectorVehiculo, type ValorVehiculo } from "@/components/campos/SelectorVehiculo";
import { useIsla } from "@/components/isla/IslaContext";
import { interpretarCedula } from "@/lib/cedula";
import { FORMATOS_CEDULA } from "@/lib/codigo";
import { resolverDesdeCedula, type OpcionCatalogo } from "@/lib/actions/catalogo";
import { crearOrdenTrabajo } from "@/lib/actions/ot";
import { crearVehiculo } from "@/lib/actions/vehiculos";

const VEHICULO_VACIO: ValorVehiculo = { marcaId: "", modeloId: "", motorizacionId: "" };
const DRAFT_KEY = "draft_nueva_ot";

export function FormNuevaOT({ marcas }: { marcas: OpcionCatalogo[] }) {
  const router = useRouter();
  const { notificar } = useIsla();
  const [isPending, startTransition] = useTransition();
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Form campos
  const [patente, setPatente] = useState("");
  const [formatoEspecial, setFormatoEspecial] = useState(false);
  const [vehiculo, setVehiculo] = useState<ValorVehiculo>(VEHICULO_VACIO);
  const [km, setKm] = useState("");
  const [anio, setAnio] = useState("");
  const [vin, setVin] = useState("");
  const [escaneando, setEscaneando] = useState(false);
  const [cedulaPayload, setCedulaPayload] = useState<string | null>(null);
  const [cedulaResumen, setCedulaResumen] = useState<string | null>(null);
  const [tipo, setTipo] = useState<"lubricentro" | "mecanica" | "mixto">("lubricentro");
  const [clienteNombre, setClienteNombre] = useState("");
  const [clienteApellido, setClienteApellido] = useState("");
  const [clienteTelefono, setClienteTelefono] = useState("");
  const [anomaliaTexto, setAnomaliaTexto] = useState("");
  const [anomalias, setAnomalias] = useState<string[]>([]);
  const [observaciones, setObservaciones] = useState("");
  const [tieneBorrador, setTieneBorrador] = useState(false);

  // Cargar borrador al montar
  useEffect(() => {
    try {
      const draft = localStorage.getItem(DRAFT_KEY);
      if (draft) {
        const d = JSON.parse(draft);
        if (d.patente) setPatente(d.patente);
        if (d.vehiculo) setVehiculo(d.vehiculo);
        if (d.km) setKm(d.km);
        if (d.anio) setAnio(d.anio);
        if (d.vin) setVin(d.vin);
        if (d.tipo) setTipo(d.tipo);
        if (d.clienteNombre) setClienteNombre(d.clienteNombre);
        if (d.clienteApellido) setClienteApellido(d.clienteApellido);
        if (d.clienteTelefono) setClienteTelefono(d.clienteTelefono);
        if (d.anomalias) setAnomalias(d.anomalias);
        if (d.observaciones) setObservaciones(d.observaciones);
        setTieneBorrador(true);
      }
    } catch {
      // Ignorar errores de parseo
    }
  }, []);

  // Guardar borrador automáticamente al cambiar cualquier campo
  useEffect(() => {
    if (patente.trim() || clienteNombre.trim() || anomalias.length > 0 || observaciones.trim()) {
      const dataToSave = {
        patente,
        vehiculo,
        km,
        anio,
        vin,
        tipo,
        clienteNombre,
        clienteApellido,
        clienteTelefono,
        anomalias,
        observaciones,
      };
      localStorage.setItem(DRAFT_KEY, JSON.stringify(dataToSave));
      setTieneBorrador(true);
    }
  }, [patente, vehiculo, km, anio, vin, tipo, clienteNombre, clienteApellido, clienteTelefono, anomalias, observaciones]);

  const limpiarBorrador = () => {
    localStorage.removeItem(DRAFT_KEY);
    setPatente("");
    setVehiculo(VEHICULO_VACIO);
    setKm("");
    setAnio("");
    setVin("");
    setClienteNombre("");
    setClienteApellido("");
    setClienteTelefono("");
    setAnomalias([]);
    setObservaciones("");
    setCedulaResumen(null);
    setTieneBorrador(false);
    notificar({ tipo: "alerta", mensaje: "Borrador limpiado." });
  };

  /**
   * Llega el texto crudo del código de la cédula.
   */
  const handleCedula = (texto: string) => {
    const datos = interpretarCedula(texto);
    setEscaneando(false);
    setCedulaPayload(datos.crudo);

    if (datos.patente && !patente.trim()) setPatente(datos.patente);
    if (datos.vin && !vin.trim()) setVin(datos.vin);
    if (datos.anio && !anio) setAnio(String(datos.anio));

    if (datos.titular && !clienteNombre.trim()) {
      const partes = datos.titular.trim().split(/\s+/);
      if (partes.length >= 2) {
        setClienteApellido(partes[0]);
        setClienteNombre(partes.slice(1).join(" "));
      } else {
        setClienteNombre(datos.titular);
      }
    }

    startTransition(async () => {
      const resuelto = await resolverDesdeCedula(
        datos.marca ?? datos.crudo,
        datos.modelo ?? datos.crudo,
      );

      if (resuelto.marcaId) {
        setVehiculo((prev) =>
          prev.marcaId
            ? prev
            : { marcaId: resuelto.marcaId, modeloId: resuelto.modeloId, motorizacionId: "" },
        );
      }

      const partes = [
        datos.patente,
        resuelto.descripcion || undefined,
        datos.anio ? String(datos.anio) : undefined,
        datos.titular ? `Titular: ${datos.titular}` : undefined,
      ].filter(Boolean);

      if (partes.length === 0) {
        setCedulaResumen(null);
        notificar({
          tipo: "alerta",
          mensaje: "Se leyó el código pero no se reconoció ningún dato. Cargalo a mano.",
        });
        return;
      }

      const resumen = partes.join(" · ");
      setCedulaResumen(resumen);
      notificar({ tipo: "exito", mensaje: `Cédula leída: ${resumen}` });
    });
  };

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
      if (anio) formDataVehiculo.append("anio", anio);
      if (vin) formDataVehiculo.append("vin", vin);
      if (clienteNombre) formDataVehiculo.append("clienteNombre", clienteNombre);
      if (clienteApellido) formDataVehiculo.append("clienteApellido", clienteApellido);
      if (clienteTelefono) formDataVehiculo.append("clienteTelefono", clienteTelefono);

      const resVehiculo = await crearVehiculo({}, formDataVehiculo);

      const vehiculoId = resVehiculo.creado?.id || resVehiculo.duplicado?.id;

      if (!vehiculoId) {
        setErrorMsg(resVehiculo.error || "Error al registrar el vehículo.");
        return;
      }

      if (resVehiculo.duplicado) {
        notificar({
          tipo: "alerta",
          mensaje: `${resVehiculo.duplicado.patente} ya estaba cargado como ${resVehiculo.duplicado.descripcion}. La orden va sobre esa ficha.`,
        });
      }

      const clienteId = resVehiculo.clienteId || resVehiculo.creado?.clienteId || resVehiculo.duplicado?.clienteId;

      // 2. Crear la Orden de Trabajo
      const resOT = await crearOrdenTrabajo({
        vehiculoId,
        clienteId,
        tipo,
        kmIngreso: km ? Number(km) : 0,
        observaciones: observaciones.trim() || undefined,
        anomalias: anomalias.length > 0 ? anomalias : undefined,
        cedulaPayload: cedulaPayload || undefined,
      });

      if (resOT.error || !resOT.otId) {
        setErrorMsg(resOT.error || "No se pudo generar la Orden de Trabajo.");
        return;
      }

      // Limpiar borrador al guardar exitosamente
      localStorage.removeItem(DRAFT_KEY);

      // Redirigir a la OT creada
      router.push(`/ot/${resOT.otId}`);
    });
  };

  return (
    <>
      {escaneando && (
        <LectorCodigo
          titulo="Escanear cédula verde"
          ayuda="Apuntá al código QR o PDF417 del dorso de la cédula del vehículo."
          formatos={FORMATOS_CEDULA}
          onLeido={handleCedula}
          onCerrar={() => setEscaneando(false)}
        />
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Header Back & Borrador */}
        <div className="flex items-center justify-between">
          <Link
            href="/tablero"
            className="inline-flex items-center gap-1 text-xs font-semibold text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Cancelar</span>
          </Link>
          {tieneBorrador && (
            <button
              type="button"
              onClick={limpiarBorrador}
              className="inline-flex items-center gap-1 text-caption font-semibold text-amber-500 hover:text-amber-400"
            >
              <RotateCcw className="h-3 w-3" />
              <span>Limpiar borrador</span>
            </button>
          )}
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

          <button
            type="button"
            onClick={() => setEscaneando(true)}
            className="flex min-h-12 w-full items-center justify-center gap-2 rounded-xl border border-accent/40 bg-accent/10 text-sm font-bold text-accent transition-transform active:scale-[0.98]"
          >
            <ScanLine className="h-4.5 w-4.5" aria-hidden />
            Escanear cédula verde
          </button>

          {cedulaResumen && (
            <p className="rounded-xl bg-emerald-500/10 border border-emerald-500/20 px-3 py-2 text-caption font-semibold text-emerald-400">
              ✓ Leído de la cédula: {cedulaResumen}
            </p>
          )}

          <PatenteInput
            value={patente}
            onChange={setPatente}
            formatoEspecial={formatoEspecial}
            onFormatoEspecialChange={setFormatoEspecial}
          />

          <SelectorVehiculo marcas={marcas} valor={vehiculo} onChange={setVehiculo} />

          <div className="grid grid-cols-2 gap-3">
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
            <div>
              <label htmlFor="anio-ingreso" className="text-caption text-muted-foreground">
                Año
              </label>
              <input
                id="anio-ingreso"
                type="number"
                inputMode="numeric"
                min="1950"
                placeholder="Ej: 2018"
                value={anio}
                onChange={(e) => setAnio(e.target.value)}
                className="mt-1 min-h-11 w-full rounded-xl border border-border bg-muted px-3 text-base font-medium text-foreground focus:border-accent focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label htmlFor="vin-ingreso" className="text-caption text-muted-foreground">
              Chasis / VIN (opcional)
            </label>
            <input
              id="vin-ingreso"
              type="text"
              placeholder="17 caracteres alfanuméricos"
              value={vin}
              onChange={(e) => setVin(e.target.value.toUpperCase())}
              maxLength={17}
              className="mt-1 min-h-11 w-full rounded-xl border border-border bg-muted px-3 text-xs font-mono font-medium text-foreground focus:border-accent focus:outline-none"
            />
          </div>
        </section>

        {/* Bloque 2: Cliente */}
        <section className="space-y-4 rounded-2xl border border-border bg-card p-4 shadow-sm">
          <div className="flex items-center gap-2 border-b border-border pb-3">
            <User className="h-4 w-4 text-accent" />
            <h2 className="text-sm font-bold text-foreground">Cliente / Titular</h2>
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
              <label className="text-caption text-muted-foreground">Apellido</label>
              <input
                type="text"
                placeholder="Ej: Pérez"
                value={clienteApellido}
                onChange={(e) => setClienteApellido(e.target.value)}
                className="mt-1 min-h-11 w-full rounded-xl border border-border bg-muted px-3 text-xs font-medium text-foreground focus:border-accent focus:outline-none"
              />
            </div>
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
    </>
  );
}
