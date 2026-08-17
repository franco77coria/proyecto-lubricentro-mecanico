"use client";

import { ArrowLeft, CalendarDays, Car, Clock } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { PatenteInput } from "@/components/campos/PatenteInput";
import { SelectorVehiculo, type ValorVehiculo } from "@/components/campos/SelectorVehiculo";
import { useIsla } from "@/components/isla/IslaContext";
import { type OpcionCatalogo, resolverDesdeCedula } from "@/lib/actions/catalogo";
import { crearVehiculo } from "@/lib/actions/vehiculos";
import { crearTurno, type DatosNuevoTurno } from "@/lib/actions/turnos";

const VEHICULO_VACIO: ValorVehiculo = { marcaId: "", modeloId: "", motorizacionId: "" };

const HORAS_RAPIDAS = ["08:30", "09:30", "11:00", "14:00", "15:30", "17:00"];

export function FormNuevoTurno({ marcas }: { marcas: OpcionCatalogo[] }) {
  const router = useRouter();
  const { notificar } = useIsla();
  const [isPending, startTransition] = useTransition();
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const [fecha, setFecha] = useState(() => new Date().toISOString().split("T")[0]);
  const [hora, setHora] = useState("09:00");
  const [motivo, setMotivo] = useState("");
  const [notas, setNotas] = useState("");

  const [patente, setPatente] = useState("");
  const [formatoEspecial, setFormatoEspecial] = useState(false);
  const [vehiculo, setVehiculo] = useState<ValorVehiculo>(VEHICULO_VACIO);
  const [anio, setAnio] = useState("");
  const [clienteNombre, setClienteNombre] = useState("");
  const [clienteTelefono, setClienteTelefono] = useState("");
  const [buscandoPatente, setBuscandoPatente] = useState(false);

  // Auto-fill on patente blur
  const handlePatenteBlur = async () => {
    if (!patente || patente.length < 6) return;
    setBuscandoPatente(true);
    try {
      const formDataVehiculo = new FormData();
      formDataVehiculo.append("patente", patente);
      if (formatoEspecial) formDataVehiculo.append("formatoEspecial", "on");

      const res = await crearVehiculo({}, formDataVehiculo);
      if (res.duplicado) {
        notificar({ tipo: "exito", mensaje: `Auto encontrado: ${res.duplicado.descripcion}` });
      }
    } catch (e) {
      console.error(e);
    } finally {
      setBuscandoPatente(false);
    }
  };

  // Botones de fechas rápidas
  const getFechaOffset = (dias: number) => {
    const d = new Date();
    d.setDate(d.getDate() + dias);
    return d.toISOString().split("T")[0];
  };

  const hoyStr = getFechaOffset(0);
  const mananaStr = getFechaOffset(1);
  const pasadoStr = getFechaOffset(2);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!fecha || !hora) {
      setErrorMsg("Debe seleccionar fecha y hora.");
      return;
    }

    if (!motivo.trim()) {
      setErrorMsg("Debe ingresar un motivo.");
      return;
    }

    setErrorMsg(null);

    startTransition(async () => {
      let vehiculoId = null;
      let clienteId = null;

      if (patente) {
        const formDataVehiculo = new FormData();
        formDataVehiculo.append("patente", patente);
        if (formatoEspecial) formDataVehiculo.append("formatoEspecial", "on");
        if (vehiculo.marcaId) formDataVehiculo.append("marcaId", vehiculo.marcaId);
        if (vehiculo.modeloId) formDataVehiculo.append("modeloId", vehiculo.modeloId);
        if (vehiculo.motorizacionId) formDataVehiculo.append("motorizacionId", vehiculo.motorizacionId);
        if (anio) formDataVehiculo.append("anio", anio);
        if (clienteNombre) formDataVehiculo.append("clienteNombre", clienteNombre);
        if (clienteTelefono) formDataVehiculo.append("clienteTelefono", clienteTelefono);

        const resVehiculo = await crearVehiculo({}, formDataVehiculo);
        vehiculoId = resVehiculo.creado?.id || resVehiculo.duplicado?.id;
        clienteId = resVehiculo.clienteId || resVehiculo.creado?.clienteId || resVehiculo.duplicado?.clienteId || null;

        if (!vehiculoId) {
          setErrorMsg(resVehiculo.error || "Error al registrar el vehículo.");
          return;
        }
      }

      const fechaHora = new Date(`${fecha}T${hora}:00`).toISOString();
      const datosReq: DatosNuevoTurno = {
        vehiculoId,
        clienteId,
        fechaHora,
        motivo,
        notas: notas.trim() || undefined,
      };

      const res = await crearTurno(datosReq);

      if (res.error) {
        setErrorMsg(res.error);
        return;
      }

      notificar({ tipo: "exito", mensaje: "Turno agendado con éxito" });
      router.push(`/turnos`);
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-2xl mx-auto pb-16">
      <div className="flex items-center gap-2">
        <Link
          href="/turnos"
          className="p-2 rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
        >
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div>
          <h1 className="text-xl font-bold tracking-tight text-foreground">Nuevo Turno</h1>
          <p className="text-caption text-muted-foreground">Agendar cita de servicio o mantenimiento</p>
        </div>
      </div>

      {errorMsg && (
        <div className="rounded-2xl border border-destructive/50 bg-destructive/10 p-4 text-xs font-semibold text-destructive">
          {errorMsg}
        </div>
      )}

      {/* 1. Fecha y Hora */}
      <section className="space-y-4 rounded-3xl border border-border/80 bg-card p-5 shadow-sm">
        <div className="flex items-center gap-2 border-b border-border pb-3">
          <CalendarDays className="h-4 w-4 text-accent" />
          <h2 className="text-xs font-bold uppercase tracking-wider text-foreground">Día y Horario</h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="text-caption text-muted-foreground font-semibold">Fecha</label>
            <input
              type="date"
              value={fecha}
              onChange={(e) => setFecha(e.target.value)}
              className="mt-1 min-h-12 w-full rounded-2xl border border-border/80 bg-card px-3.5 text-base font-semibold text-foreground shadow-sm focus:border-accent focus:ring-1 focus:ring-accent focus:outline-none"
            />
            {/* Accesos rápidos */}
            <div className="flex gap-1.5 mt-2">
              <button
                type="button"
                onClick={() => setFecha(getFechaOffset(0))}
                className="text-[11px] font-bold px-2 py-1 bg-muted hover:bg-accent/10 hover:text-accent rounded-lg transition-colors text-muted-foreground"
              >
                Hoy
              </button>
              <button
                type="button"
                onClick={() => setFecha(getFechaOffset(1))}
                className="text-[11px] font-bold px-2 py-1 bg-muted hover:bg-accent/10 hover:text-accent rounded-lg transition-colors text-muted-foreground"
              >
                Mañana
              </button>
              <button
                type="button"
                onClick={() => setFecha(getFechaOffset(2))}
                className="text-[11px] font-bold px-2 py-1 bg-muted hover:bg-accent/10 hover:text-accent rounded-lg transition-colors text-muted-foreground"
              >
                Pasado
              </button>
            </div>
          </div>

          <div>
            <label className="text-caption text-muted-foreground font-semibold">Hora de Entrada</label>
            <div className="relative">
              <input
                type="time"
                value={hora}
                onChange={(e) => setHora(e.target.value)}
                className="mt-1 min-h-12 w-full rounded-2xl border border-border/80 bg-card px-3.5 text-base font-semibold text-foreground shadow-sm focus:border-accent focus:ring-1 focus:ring-accent focus:outline-none"
              />
              <Clock className="absolute right-3.5 top-4 h-5 w-5 text-muted-foreground pointer-events-none" />
            </div>
            {/* Horas rápidas */}
            <div className="flex flex-wrap gap-1.5 mt-2">
              {HORAS_RAPIDAS.map((h) => (
                <button
                  key={h}
                  type="button"
                  onClick={() => setHora(h)}
                  className={`text-[11px] font-bold px-2 py-1 rounded-lg transition-colors ${
                    hora === h ? "bg-accent text-accent-foreground" : "bg-muted text-muted-foreground hover:bg-accent/10 hover:text-accent"
                  }`}
                >
                  {h}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div>
          <label className="text-caption text-muted-foreground font-semibold">Motivo del Servicio</label>
          <input
            type="text"
            required
            placeholder="Ej: Cambio de aceite y filtros, Frenos, Service 50.000km..."
            value={motivo}
            onChange={(e) => setMotivo(e.target.value)}
            className="mt-1 min-h-12 w-full rounded-2xl border border-border/80 bg-card px-3.5 text-base font-semibold text-foreground shadow-sm focus:border-accent focus:ring-1 focus:ring-accent focus:outline-none"
          />
        </div>

        <div>
          <label className="text-caption text-muted-foreground font-semibold">Notas adicionales (opcional)</label>
          <textarea
            placeholder="Detalles sobre ruidos, repuestos que trae el cliente o aclaraciones..."
            value={notas}
            onChange={(e) => setNotas(e.target.value)}
            rows={2}
            className="mt-1 min-h-20 w-full rounded-2xl border border-border/80 bg-card p-3.5 text-sm font-medium text-foreground shadow-sm focus:border-accent focus:ring-1 focus:ring-accent focus:outline-none"
          />
        </div>
      </section>

      {/* 2. Vehículo y Cliente */}
      <section className="space-y-4 rounded-3xl border border-border/80 bg-card p-5 shadow-sm">
        <div className="flex items-center justify-between border-b border-border pb-3">
          <div className="flex items-center gap-2">
            <Car className="h-4 w-4 text-accent" />
            <h2 className="text-xs font-bold uppercase tracking-wider text-foreground">Auto y Contacto</h2>
          </div>
          {buscandoPatente && <span className="text-xs text-accent font-bold animate-pulse">Buscando historial...</span>}
        </div>

        <div onBlur={handlePatenteBlur}>
          <PatenteInput
            value={patente}
            onChange={setPatente}
            formatoEspecial={formatoEspecial}
            onFormatoEspecialChange={setFormatoEspecial}
            onCedulaDetectada={(d) => {
              if (d.patente) setPatente(d.patente);
              if (d.anio) setAnio(String(d.anio));
              if (d.titularNombre && !clienteNombre) {
                setClienteNombre(d.titularNombre);
              }
              if (d.marca || d.modelo) {
                startTransition(async () => {
                  const resuelto = await resolverDesdeCedula(d.marca || "", d.modelo || "");
                  if (resuelto.marcaId) {
                    setVehiculo({
                      marcaId: resuelto.marcaId,
                      modeloId: resuelto.modeloId,
                      motorizacionId: "",
                    });
                  }
                });
              }
              notificar({
                tipo: "exito",
                mensaje: `✨ Cédula Verde detectada: ${d.patente} (${d.marca || ""} ${d.modelo || ""})`,
              });
            }}
          />
        </div>

        {patente && (
          <>
            <SelectorVehiculo marcas={marcas} valor={vehiculo} onChange={setVehiculo} />

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="text-caption text-muted-foreground font-semibold">Año (Opcional)</label>
                <input
                  type="number"
                  inputMode="numeric"
                  min="1900"
                  max={new Date().getFullYear() + 1}
                  placeholder="Ej: 2018"
                  value={anio}
                  onChange={(e) => setAnio(e.target.value)}
                  className="mt-1 min-h-12 w-full rounded-2xl border border-border/80 bg-card px-3.5 text-base font-semibold text-foreground shadow-sm focus:border-accent focus:ring-1 focus:ring-accent focus:outline-none"
                />
              </div>
              <div>
                <label className="text-caption text-muted-foreground font-semibold">Nombre del Cliente</label>
                <input
                  type="text"
                  placeholder="Ej: Marcelo"
                  value={clienteNombre}
                  onChange={(e) => setClienteNombre(e.target.value)}
                  className="mt-1 min-h-12 w-full rounded-2xl border border-border/80 bg-card px-3.5 text-base font-semibold text-foreground shadow-sm focus:border-accent focus:ring-1 focus:ring-accent focus:outline-none"
                />
              </div>
              <div>
                <label className="text-caption text-muted-foreground font-semibold">Teléfono</label>
                <input
                  type="tel"
                  placeholder="Ej: 11 2345-6789"
                  value={clienteTelefono}
                  onChange={(e) => setClienteTelefono(e.target.value)}
                  className="mt-1 min-h-12 w-full rounded-2xl border border-border/80 bg-card px-3.5 text-base font-semibold text-foreground shadow-sm focus:border-accent focus:ring-1 focus:ring-accent focus:outline-none"
                />
              </div>
            </div>
          </>
        )}
      </section>

      {/* Botón de Confirmación */}
      <button
        type="submit"
        disabled={isPending}
        className="flex min-h-12 w-full items-center justify-center rounded-2xl bg-accent px-6 text-base font-bold text-accent-foreground shadow-lg transition-transform active:scale-[0.98] disabled:opacity-50"
      >
        {isPending ? "Guardando turno..." : "Confirmar y Agendar Turno"}
      </button>
    </form>
  );
}
