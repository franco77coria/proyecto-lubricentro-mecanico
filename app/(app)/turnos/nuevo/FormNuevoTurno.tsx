"use client";

import { ArrowLeft, CalendarDays, Car, User } from "lucide-react";
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

export function FormNuevoTurno({ marcas }: { marcas: OpcionCatalogo[] }) {
  const router = useRouter();
  const { notificar } = useIsla();
  const [isPending, startTransition] = useTransition();
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const [fecha, setFecha] = useState(() => new Date().toISOString().split("T")[0]);
  const [hora, setHora] = useState("");
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
      // Usamos el formData simulado para invocar crearVehiculo (que en realidad lo busca primero)
      const formDataVehiculo = new FormData();
      formDataVehiculo.append("patente", patente);
      if (formatoEspecial) formDataVehiculo.append("formatoEspecial", "on");
      
      const res = await crearVehiculo({}, formDataVehiculo);
      if (res.duplicado) {
        // Encontramos un vehículo existente, lo pre-cargamos
        const [marca, modelo, motor] = res.duplicado.descripcion.split(" ");
        // Lógica ideal sería tener los IDs para SelectorVehiculo.
        // Como no tenemos los IDs en la respuesta simplificada, 
        // notificamos al usuario.
        notificar({ tipo: "exito", mensaje: `Auto encontrado: ${res.duplicado.descripcion}` });
      }
    } catch (e) {
      console.error(e);
    } finally {
      setBuscandoPatente(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!fecha || !hora || !motivo) {
      setErrorMsg("Fecha, hora y motivo son obligatorios.");
      return;
    }
    
    setErrorMsg(null);

    startTransition(async () => {
      // 1. Crear/Buscar vehículo si hay patente
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
        
        if (!vehiculoId) {
          setErrorMsg(resVehiculo.error || "Error al registrar el vehículo.");
          return;
        }
      }

      // 2. Crear turno
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

      notificar({ tipo: "exito", mensaje: "Turno agendado" });
      router.push(`/turnos`);
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="flex items-center gap-2">
        <Link
          href="/turnos"
          className="inline-flex items-center gap-1 text-xs font-semibold text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Cancelar</span>
        </Link>
      </div>

      <header className="space-y-1">
        <p className="text-caption text-muted-foreground">Calendario</p>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Nuevo Turno</h1>
      </header>

      {errorMsg && (
        <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-xs font-bold text-red-600">
          {errorMsg}
        </div>
      )}

      {/* Cuando y Qué */}
      <section className="space-y-4 rounded-2xl border border-border bg-card p-4 shadow-sm">
        <div className="flex items-center gap-2 border-b border-border pb-3">
          <CalendarDays className="h-4 w-4 text-accent" />
          <h2 className="text-sm font-bold text-foreground">Fecha y Motivo</h2>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-caption text-muted-foreground">Fecha</label>
            <input
              type="date"
              required
              value={fecha}
              onChange={(e) => setFecha(e.target.value)}
              className="mt-1 flex h-11 w-full rounded-xl border border-input bg-transparent px-3 py-2 text-base focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            />
          </div>
          <div>
            <label className="text-caption text-muted-foreground">Hora</label>
            <input
              type="time"
              required
              value={hora}
              onChange={(e) => setHora(e.target.value)}
              className="mt-1 flex h-11 w-full rounded-xl border border-input bg-transparent px-3 py-2 text-base focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            />
          </div>
        </div>
        
        <div>
          <label className="text-caption text-muted-foreground">Motivo Corto</label>
          <input
            type="text"
            required
            placeholder="Ej: Service 10k, Revisar frenos..."
            value={motivo}
            onChange={(e) => setMotivo(e.target.value)}
            className="mt-1 flex h-11 w-full rounded-xl border border-input bg-transparent px-3 py-2 text-base focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
          />
        </div>

        <div>
          <label className="text-caption text-muted-foreground">Notas adicionales (opcional)</label>
          <textarea
            placeholder="Hace ruido al doblar..."
            value={notas}
            onChange={(e) => setNotas(e.target.value)}
            rows={2}
            className="mt-1 flex w-full rounded-xl border border-input bg-transparent p-3 text-base focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
          />
        </div>
      </section>

      {/* Auto y Cliente (Opcional) */}
      <section className="space-y-4 rounded-2xl border border-border bg-card p-4 shadow-sm">
        <div className="flex items-center justify-between border-b border-border pb-3">
          <div className="flex items-center gap-2">
            <Car className="h-4 w-4 text-accent" />
            <h2 className="text-sm font-bold text-foreground">Auto y Cliente (Opcional)</h2>
          </div>
          {buscandoPatente && <span className="text-xs text-muted-foreground animate-pulse">Buscando...</span>}
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

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-caption text-muted-foreground">Nombre / Apodo</label>
                <input
                  type="text"
                  placeholder="Ej: Juan Pérez"
                  value={clienteNombre}
                  onChange={(e) => setClienteNombre(e.target.value)}
                  className="mt-1 flex h-11 w-full rounded-xl border border-input bg-transparent px-3 py-2 text-base focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                />
              </div>
              <div>
                <label className="text-caption text-muted-foreground">WhatsApp</label>
                <input
                  type="tel"
                  placeholder="Ej: 1123456789"
                  value={clienteTelefono}
                  onChange={(e) => setClienteTelefono(e.target.value)}
                  className="mt-1 flex h-11 w-full rounded-xl border border-input bg-transparent px-3 py-2 text-base focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                />
              </div>
            </div>
          </>
        )}
      </section>

      <button
        type="submit"
        disabled={isPending}
        className="flex min-h-14 w-full items-center justify-center gap-2 rounded-xl bg-accent text-lg font-bold text-white shadow-lg transition-transform active:scale-[0.98] disabled:pointer-events-none disabled:opacity-50"
      >
        Agendar Turno
      </button>
    </form>
  );
}
