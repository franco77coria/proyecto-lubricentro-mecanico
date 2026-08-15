"use client";

import { ArrowLeft, Car, Plus, ScanLine, Trash2, User } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

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
  const [escaneando, setEscaneando] = useState(false);
  const [cedulaPayload, setCedulaPayload] = useState<string | null>(null);
  const [cedulaResumen, setCedulaResumen] = useState<string | null>(null);
  const [tipo, setTipo] = useState<"lubricentro" | "mecanica" | "mixto">("lubricentro");
  const [clienteNombre, setClienteNombre] = useState("");
  const [clienteTelefono, setClienteTelefono] = useState("");
  const [anomaliaTexto, setAnomaliaTexto] = useState("");
  const [anomalias, setAnomalias] = useState<string[]>([]);
  const [observaciones, setObservaciones] = useState("");

  /**
   * Llega el texto crudo del código de la cédula.
   *
   * Se completa solo lo que está VACÍO: si el mostrador ya tipeó la patente
   * porque la cédula tardó en leer, el escaneo no se la pisa. Y el payload
   * crudo se guarda siempre, incluso si el parseo entendió poco: es la única
   * forma de ir descubriendo los formatos que cambian entre provincias.
   */
  const handleCedula = (texto: string) => {
    const datos = interpretarCedula(texto);
    setEscaneando(false);
    setCedulaPayload(datos.crudo);

    if (datos.patente && !patente.trim()) setPatente(datos.patente);
    if (datos.titular && !clienteNombre.trim()) setClienteNombre(datos.titular);

    // La marca y el modelo vienen como texto ("GOL TREND 1.6") y hay que
    // llevarlos a filas del catálogo, que es trabajo del servidor.
    //
    // Cuando el parseo no aisló los campos se le pasa el payload COMPLETO. Las
    // cédulas Mercosur usan el formato separado por comas y ahí no hay forma
    // confiable de decir qué campo es la marca — el orden cambia entre
    // provincias. Buscar la marca conocida dentro del texto entero resuelve el
    // caso sin adivinar posiciones.
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

      // El resumen se arma con lo que REALMENTE se resolvió, no con lo que dijo
      // el parseo: prometer "Volkswagen Gol Trend" y dejar los selects vacíos
      // es peor que no decir nada.
      const partes = [
        datos.patente,
        resuelto.descripcion || undefined,
        datos.anio ? String(datos.anio) : undefined,
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
      if (clienteNombre) formDataVehiculo.append("clienteNombre", clienteNombre);
      if (clienteTelefono) formDataVehiculo.append("clienteTelefono", clienteTelefono);

      const resVehiculo = await crearVehiculo({}, formDataVehiculo);

      const vehiculoId = resVehiculo.creado?.id || resVehiculo.duplicado?.id;

      if (!vehiculoId) {
        setErrorMsg(resVehiculo.error || "Error al registrar el vehículo.");
        return;
      }

      // El auto ya estaba en el sistema y la OT se cuelga de esa ficha, no de
      // los datos que se acaban de tipear. Hay que decirlo: si la patente se
      // cargó con un error en su momento, el mostrador estaría abriendo una
      // orden para el auto equivocado sin ninguna señal.
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

      // Redirigir a la OT creada
      router.push(`/ot/${resOT.otId}`);
    });
  };

  return (
    <>
      {escaneando && (
        <LectorCodigo
          titulo="Escanear cédula"
          ayuda="Apuntá al código de barras ancho del dorso, que entre completo en el marco."
          formatos={FORMATOS_CEDULA}
          onLeido={handleCedula}
          onCerrar={() => setEscaneando(false)}
        />
      )}

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

        {/* Va primero porque es el primer gesto de la recepción: el auto llega,
            se pide la cédula y se escanea. Todo lo de abajo se completa solo. */}
        <button
          type="button"
          onClick={() => setEscaneando(true)}
          className="flex min-h-12 w-full items-center justify-center gap-2 rounded-xl border border-accent/40 bg-accent/10 text-sm font-bold text-accent transition-transform active:scale-[0.98]"
        >
          <ScanLine className="h-4.5 w-4.5" aria-hidden />
          Escanear cédula
        </button>

        {cedulaResumen && (
          <p className="rounded-xl bg-emerald-50 px-3 py-2 text-caption font-semibold text-emerald-800">
            Leído de la cédula: {cedulaResumen}
          </p>
        )}

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
    </>
  );
}
