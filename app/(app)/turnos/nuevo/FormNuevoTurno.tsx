"use client";

import { ArrowLeft, CalendarDays, Car, Clock } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { PatenteInput } from "@/components/campos/PatenteInput";
import { SelectorVehiculo, type ValorVehiculo } from "@/components/campos/SelectorVehiculo";
import { useIsla } from "@/components/isla/IslaContext";
import { type OpcionCatalogo } from "@/lib/actions/catalogo";
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
          className="inline-flex items-center gap-1 text-xs font-bold text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Volver a Turnos</span>
        </Link>
      </div>

      <header className="space-y-1">
        <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Agenda de Fosa & Taller</p>
        <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-foreground">Nuevo Turno</h1>
      </header>

      {errorMsg && (
        <div className="rounded-2xl border border-destructive/30 bg-destructive/10 p-3.5 text-xs font-bold text-destructive">
          {errorMsg}
        </div>
      )}

      {/* Cuándo y Qué */}
      <section className="space-y-4 rounded-3xl border border-border/80 bg-card p-5 sm:p-6 shadow-sm">
        <div className="flex items-center gap-2 border-b border-border/60 pb-3">
          <CalendarDays className="h-4 w-4 text-accent" />
          <h2 className="text-xs font-bold uppercase tracking-wider text-foreground">Fecha y Horario</h2>
        </div>

        {/* Accesos rápidos de fecha */}
        <div className="space-y-2">
          <label className="text-caption text-muted-foreground font-semibold">Día del Turno</label>
          <div className="grid grid-cols-3 gap-2">
            {[
              { label: "Hoy", val: hoyStr },
              { label: "Mañana", val: mananaStr },
              { label: "Pasado", val: pasadoStr },
            ].map((d) => (
              <button
                key={d.val}
                type="button"
                onClick={() => setFecha(d.val)}
                className={`min-h-11 rounded-xl text-xs font-bold transition-all ${
                  fecha === d.val
                    ? "bg-accent text-accent-foreground shadow-sm"
                    : "bg-muted/60 text-muted-foreground hover:bg-muted"
                }`}
              >
                {d.label}
              </button>
            ))}
          </div>

          <input
            type="date"
            required
            value={fecha}
            onChange={(e) => setFecha(e.target.value)}
            className="min-h-12 w-full rounded-2xl border border-border/80 bg-card px-3.5 text-base font-semibold text-foreground shadow-sm focus:border-accent focus:ring-1 focus:ring-accent focus:outline-none"
          />
        </div>

        {/* Accesos rápidos de hora */}
        <div className="space-y-2">
          <label className="text-caption text-muted-foreground font-semibold flex items-center gap-1.5">
            <Clock className="h-3.5 w-3.5 text-accent" />
            Horario
          </label>
          <div className="flex flex-wrap gap-2">
            {HORAS_RAPIDAS.map((h) => (
              <button
                key={h}
                type="button"
                onClick={() => setHora(h)}
                className={`min-h-10 px-3 rounded-xl text-xs font-bold transition-all ${
                  hora === h
                    ? "bg-accent text-accent-foreground shadow-sm"
                    : "bg-muted/60 text-muted-foreground hover:bg-muted"
                }`}
              >
                {h} hs
              </button>
            ))}
          </div>

          <input
            type="time"
            required
            value={hora}
            onChange={(e) => setHora(e.target.value)}
            className="min-h-12 w-full rounded-2xl border border-border/80 bg-card px-3.5 text-base font-semibold text-foreground shadow-sm focus:border-accent focus:ring-1 focus:ring-accent focus:outline-none"
          />
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

      {/* Auto y Cliente */}
      <section className="space-y-4 rounded-3xl border border-border/80 bg-card p-5 sm:p-6 shadow-sm">
        <div className="flex items-center justify-between border-b border-border/60 pb-3">
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
          />
        </div>

        {patente && (
          <>
            <SelectorVehiculo marcas={marcas} valor={vehiculo} onChange={setVehiculo} />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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
                <label className="text-caption text-muted-foreground font-semibold">Teléfono (WhatsApp)</label>
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
