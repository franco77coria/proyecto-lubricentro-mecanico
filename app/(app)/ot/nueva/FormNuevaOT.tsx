"use client";

import {
  ArrowLeft,
  Car,
  Plus,
  RotateCcw,
  ScanLine,
  Trash2,
  User,
  Sparkles,
  Camera,
  CheckCircle2,
  Loader2,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, useTransition } from "react";

import dynamic from "next/dynamic";

const LectorCodigo = dynamic(
  () => import("@/components/campos/LectorCodigo").then((mod) => mod.LectorCodigo),
  { ssr: false },
);
import { PatenteInput } from "@/components/campos/PatenteInput";
import { SelectorVehiculo, type ValorVehiculo } from "@/components/campos/SelectorVehiculo";
import { useIsla } from "@/components/isla/IslaContext";
import { desglosarTitular } from "@/lib/cedula";
import { resolverDesdeCedula, type OpcionCatalogo } from "@/lib/actions/catalogo";
import { crearOrdenTrabajo } from "@/lib/actions/ot";
import { crearVehiculo, buscarVehiculoPorPatente } from "@/lib/actions/vehiculos";
import { escanearCedulaVerdeAction } from "@/lib/actions/cedula-verde";
import { comprimirParaOCR } from "@/lib/imagen";
import { esPatenteValida, normalizarPatente } from "@/lib/patente";
import { SelectorCliente } from "@/components/clientes/SelectorCliente";
import { DesplegableModerno, type OpcionDesplegable } from "@/components/ui/DesplegableModerno";
import { Fuel, Layers, Wrench } from "lucide-react";

const OPCIONES_TIPO_OT: OpcionDesplegable[] = [
  { valor: "lubricentro", etiqueta: "Lubricentro / Service Rápido", descripcion: "Filtros, fluidos y lubricación", icono: Fuel },
  { valor: "mecanica", etiqueta: "Mecánica General", descripcion: "Tren delantero, frenos, motor", icono: Wrench },
  { valor: "mixto", etiqueta: "Mixto (Mecánica + Lubricentro)", descripcion: "Service completo integral", icono: Layers },
];

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
  const [motor, setMotor] = useState("");
  const [escaneando, setEscaneando] = useState(false);
  const [procesandoFoto, setProcesandoFoto] = useState(false);
  const [vehiculoEncontradoBadge, setVehiculoEncontradoBadge] = useState<string | null>(null);
  const [mostrarSugerenciaFoto, setMostrarSugerenciaFoto] = useState(false);
  const inputFotoCedulaRef = useRef<HTMLInputElement>(null);
  const [cedulaPayload, setCedulaPayload] = useState<string | null>(null);
  const [cedulaResumen, setCedulaResumen] = useState<string | null>(null);
  const [tipo, setTipo] = useState<"lubricentro" | "mecanica" | "mixto">("lubricentro");
  const [clienteNombre, setClienteNombre] = useState("");
  const [clienteApellido, setClienteApellido] = useState("");
  const [clienteTelefono, setClienteTelefono] = useState("");
  const [clienteDocumento, setClienteDocumento] = useState("");
  const [anomaliaTexto, setAnomaliaTexto] = useState("");
  const [anomalias, setAnomalias] = useState<string[]>([]);
  const [observaciones, setObservaciones] = useState("");

  // Recuperar el borrador guardado en el navegador.
  //
  // Esto es exactamente lo que un efecto tiene que hacer: sincronizar React
  // con un sistema externo (localStorage) al montar. No se puede hacer en el
  // inicializador de useState porque este componente también se renderiza en
  // el servidor, donde no hay localStorage: leerlo ahí daría un HTML distinto
  // del que el cliente hidrata.
  //
  // La regla no puede distinguir este caso del setState en cascada que sí es
  // un problema, así que se desactiva acá y solo acá.
  /* eslint-disable react-hooks/set-state-in-effect */
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
        if (d.motor) setMotor(d.motor);
        if (d.tipo) setTipo(d.tipo);
        if (d.clienteNombre) setClienteNombre(d.clienteNombre);
        if (d.clienteApellido) setClienteApellido(d.clienteApellido);
        if (d.clienteTelefono) setClienteTelefono(d.clienteTelefono);
        if (d.clienteDocumento) setClienteDocumento(d.clienteDocumento);
        if (d.anomalias) setAnomalias(d.anomalias);
        if (d.observaciones) setObservaciones(d.observaciones);
      }
    } catch {
      // Ignorar errores de parseo
    }
  }, []);
  /* eslint-enable react-hooks/set-state-in-effect */

  // Guardar borrador automáticamente al cambiar cualquier campo
  useEffect(() => {
    if (patente.trim() || clienteNombre.trim() || anomalias.length > 0 || observaciones.trim()) {
      const dataToSave = {
        patente,
        vehiculo,
        km,
        anio,
        vin,
        motor,
        tipo,
        clienteNombre,
        clienteApellido,
        clienteTelefono,
        clienteDocumento,
        anomalias,
        observaciones,
      };
      localStorage.setItem(DRAFT_KEY, JSON.stringify(dataToSave));
    }
  }, [patente, vehiculo, km, anio, vin, motor, tipo, clienteNombre, clienteApellido, clienteTelefono, clienteDocumento, anomalias, observaciones]);

  // Hay borrador si hay algo cargado. Antes esto era un estado que un efecto
  // encendía, lo que obligaba a un render extra por cada tecla escrita.
  const tieneBorrador =
    Boolean(patente.trim()) ||
    Boolean(clienteNombre.trim()) ||
    anomalias.length > 0 ||
    Boolean(observaciones.trim());

  const limpiarBorrador = () => {
    localStorage.removeItem(DRAFT_KEY);
    setPatente("");
    setVehiculo(VEHICULO_VACIO);
    setKm("");
    setAnio("");
    setVin("");
    setMotor("");
    setClienteNombre("");
    setClienteApellido("");
    setClienteTelefono("");
    setClienteDocumento("");
    setAnomalias([]);
    setObservaciones("");
    setCedulaResumen(null);
    setVehiculoEncontradoBadge(null);
    setMostrarSugerenciaFoto(false);
    notificar({ tipo: "alerta", mensaje: "Borrador limpiado." });
  };

  /**
   * Busca si la patente ya existe en la base de datos del taller.
   * Si existe, precarga automáticamente Marca, Modelo, Motorización, Año, VIN y Cliente.
   */
  const buscarEnTaller = async (patenteBuscada: string): Promise<boolean> => {
    const limpia = normalizarPatente(patenteBuscada);
    if (!limpia || limpia.length < 5) return false;

    try {
      const res = await buscarVehiculoPorPatente(limpia);
      if (res.encontrado && res.vehiculo) {
        const v = res.vehiculo;
        if (v.marcaId) {
          setVehiculo({
            marcaId: v.marcaId,
            modeloId: v.modeloId || "",
            motorizacionId: v.motorizacionId || "",
          });
        }
        if (v.anio) setAnio(String(v.anio));
        if (v.vin) setVin(v.vin);
        if (v.motor) setMotor(v.motor);
        if (v.kmActual && !km) setKm(String(v.kmActual));
        if (v.cliente) {
          if (v.cliente.nombre) setClienteNombre(v.cliente.nombre);
          if (v.cliente.apellido) setClienteApellido(v.cliente.apellido);
          if (v.cliente.telefono) setClienteTelefono(v.cliente.telefono);
          if (v.cliente.documento) setClienteDocumento(v.cliente.documento);
        }
        setVehiculoEncontradoBadge(
          `✓ Encontrado en taller: ${v.descripcion}${v.motor ? ` · Motor: ${v.motor}` : ""}${v.cliente?.nombre ? ` · Titular: ${v.cliente.nombre} ${v.cliente.apellido || ""}` : ""}`
        );
        setMostrarSugerenciaFoto(false);
        notificar({
          tipo: "exito",
          mensaje: `Vehículo identificado en el taller: ${v.descripcion}`,
        });
        return true;
      }
    } catch (err) {
      console.warn("[buscarEnTaller]", err);
    }
    return false;
  };

  // Búsqueda reactiva automática cuando se ingresa una patente válida
  useEffect(() => {
    const norm = normalizarPatente(patente);
    if (!esPatenteValida(norm)) return;

    const timer = setTimeout(() => {
      buscarEnTaller(norm);
    }, 400);
    return () => clearTimeout(timer);
  }, [patente]);

  const handleCambioPatente = (val: string) => {
    setPatente(val);
    if (vehiculoEncontradoBadge) setVehiculoEncontradoBadge(null);
  };

  /**
   * Ejecuta el OCR completo con IA (Gemini Vision) sobre la foto de la cédula verde.
   * Acepta un data URI (ya comprimido) o un objeto File (que se comprime antes de enviar).
   */
  const ejecutarOCR = async (origen: File | string) => {
    setProcesandoFoto(true);
    setMostrarSugerenciaFoto(false);
    try {
      const dataUri =
        typeof origen === "string" ? origen : await comprimirParaOCR(origen);

      const res = await escanearCedulaVerdeAction(dataUri);
      if (res.error) {
        notificar({ tipo: "alerta", mensaje: res.error });
        return;
      }
      if (res.datos) {
        const d = res.datos;
        setCedulaPayload(JSON.stringify(d));
        if (d.patente) {
          setPatente(d.patente);
          await buscarEnTaller(d.patente);
        }
        if (d.anio) setAnio(String(d.anio));
        if (d.vin) setVin(d.vin);
        if (d.motor) setMotor(d.motor);
        if (d.titularDocumento) setClienteDocumento(d.titularDocumento);
        if (d.titularNombre) {
          const desglose = desglosarTitular(d.titularNombre);
          if (desglose.apellido) setClienteApellido(desglose.apellido);
          if (desglose.nombre) setClienteNombre(desglose.nombre);
        }
        if (d.marca || d.modelo) {
          const desc = [d.marca, d.modelo, d.motorizacion].filter(Boolean).join(" ");
          setCedulaResumen(desc);
          startTransition(async () => {
            const resuelto = await resolverDesdeCedula(d.marca || "", d.modelo || "", d.motorizacion || "");
            if (resuelto.marcaId) {
              setVehiculo((prev) => ({
                marcaId: resuelto.marcaId,
                modeloId: resuelto.modeloId || prev.modeloId,
                motorizacionId: resuelto.motorizacionId || prev.motorizacionId,
              }));
            }
          });
        }
        const motorBadge = d.motor ? ` · Motor: ${d.motor}` : "";
        const titularBadge = d.titularNombre ? ` · Titular: ${d.titularNombre}` : "";
        notificar({
          tipo: "exito",
          mensaje: `✨ Cédula Verde procesada con IA: ${d.patente} (${d.marca || ""} ${d.modelo || ""}${d.motorizacion ? ` · ${d.motorizacion}` : ""})${motorBadge}${titularBadge}`,
        });
      }
    } catch (err) {
      console.error("[ejecutarOCR]", err);
      notificar({ tipo: "error", mensaje: "No se pudo leer la cédula verde. Probá sacando la foto de nuevo." });
    } finally {
      setProcesandoFoto(false);
    }
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
      if (motor) formDataVehiculo.append("motor", motor);
      if (clienteNombre) formDataVehiculo.append("clienteNombre", clienteNombre);
      if (clienteApellido) formDataVehiculo.append("clienteApellido", clienteApellido);
      if (clienteTelefono) formDataVehiculo.append("clienteTelefono", clienteTelefono);
      if (clienteDocumento) formDataVehiculo.append("clienteDocumento", clienteDocumento);

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
      {/* Input de archivo oculto para captura directa de foto de cédula (cámara o galería) */}
      <input
        ref={inputFotoCedulaRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) ejecutarOCR(f);
          e.target.value = "";
        }}
      />

      {escaneando && (
        <LectorCodigo
          titulo="Escanear Cédula Verde (IA)"
          ayuda="Encuadrá la cédula y presioná el disparador para procesar con IA, o subí una foto de la galería."
          onCapturaFotoIA={async (dataUri) => {
            setEscaneando(false);
            await ejecutarOCR(dataUri);
          }}
          procesandoIA={procesandoFoto}
          onCerrar={() => setEscaneando(false)}
        />
      )}

      <form onSubmit={handleSubmit} className="space-y-6 pb-32">
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

          {/* Botón Principal Unificado de Escaneo */}
          <button
            type="button"
            onClick={() => setEscaneando(true)}
            disabled={procesandoFoto}
            className="flex min-h-12 w-full items-center justify-center gap-2 rounded-xl border border-accent/40 bg-accent/10 text-sm font-bold text-accent transition-transform active:scale-[0.98] hover:bg-accent/15 disabled:opacity-50"
          >
            {procesandoFoto ? (
              <>
                <Loader2 className="h-4.5 w-4.5 animate-spin" />
                <span>Analizando cédula con IA (Gemini Vision)...</span>
              </>
            ) : (
              <>
                <ScanLine className="h-4.5 w-4.5" aria-hidden />
                <span>Escanear Cédula Verde (IA)</span>
                <span className="ml-1 rounded-full bg-accent/20 px-2 py-0.5 text-[10px] font-extrabold text-accent">Foto o Galería</span>
              </>
            )}
          </button>

          {/* Feedback de Cédula / Vehículo Reconocido */}
          {vehiculoEncontradoBadge && (
            <div className="flex items-center justify-between rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-2.5 text-xs text-emerald-400 animate-in fade-in">
              <span className="flex items-center gap-1.5 font-semibold">
                <CheckCircle2 className="h-3.5 w-3.5 shrink-0" />
                <span>{vehiculoEncontradoBadge}</span>
              </span>
              <span className="text-[10px] uppercase font-bold text-emerald-500 shrink-0 ml-2">Historial</span>
            </div>
          )}

          {cedulaResumen && (
            <div className="flex items-center justify-between rounded-xl border border-accent/30 bg-accent/10 p-2.5 text-xs text-accent animate-in fade-in">
              <span className="flex items-center gap-1.5 font-semibold">
                <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-accent" />
                <span>✓ Leído de la cédula: {cedulaResumen}</span>
              </span>
            </div>
          )}

          {/* Sugerencia inteligente si el QR solo trajo la patente y el auto no estaba registrado */}
          {mostrarSugerenciaFoto && (
            <div className="flex items-center justify-between gap-2 rounded-xl border border-accent/40 bg-accent/10 p-3 text-xs text-foreground animate-in fade-in">
              <div className="space-y-0.5">
                <p className="font-bold text-accent">¿Completar datos con foto?</p>
                <p className="text-muted-foreground text-[11px] leading-tight">
                  El código QR solo contenía la patente. Sacá una foto a la cédula para autocompletar Marca, Modelo, Chasis y Titular con IA.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setEscaneando(true)}
                disabled={procesandoFoto}
                className="shrink-0 flex items-center gap-1.5 rounded-lg bg-accent px-3 py-2 text-xs font-bold text-white shadow hover:brightness-105 active:scale-95 transition-all"
              >
                <Camera className="h-3.5 w-3.5" />
                <span>Foto IA</span>
              </button>
            </div>
          )}

          <PatenteInput
            value={patente}
            onChange={handleCambioPatente}
            formatoEspecial={formatoEspecial}
            onFormatoEspecialChange={setFormatoEspecial}
            mostrarBotonEscanear={false}
            onCedulaDetectada={(d) => {
              setCedulaPayload(JSON.stringify(d));
              if (d.patente) {
                setPatente(d.patente);
                buscarEnTaller(d.patente);
              }
              if (d.anio) setAnio(String(d.anio));
              if (d.vin) setVin(d.vin);
              if (d.motor) setMotor(d.motor);
              if (d.titularDocumento) setClienteDocumento(d.titularDocumento);
              if (d.titularNombre) {
                const desglose = desglosarTitular(d.titularNombre);
                if (desglose.apellido) setClienteApellido(desglose.apellido);
                if (desglose.nombre) setClienteNombre(desglose.nombre);
              }
              if (d.marca || d.modelo) {
                const desc = [d.marca, d.modelo, d.motorizacion].filter(Boolean).join(" ");
                setCedulaResumen(desc);
                startTransition(async () => {
                  const resuelto = await resolverDesdeCedula(d.marca || "", d.modelo || "", d.motorizacion || "");
                  if (resuelto.marcaId) {
                    setVehiculo((prev) => ({
                      marcaId: resuelto.marcaId,
                      modeloId: resuelto.modeloId || prev.modeloId,
                      motorizacionId: resuelto.motorizacionId || prev.motorizacionId,
                    }));
                  }
                });
              }
              const motorBadge = d.motor ? ` · Motor: ${d.motor}` : "";
              const titularBadge = d.titularNombre ? ` · Titular: ${d.titularNombre}` : "";
              notificar({
                tipo: "exito",
                mensaje: `✨ Cédula Verde procesada con IA: ${d.patente} (${d.marca || ""} ${d.modelo || ""}${d.motorizacion ? ` · ${d.motorizacion}` : ""})${motorBadge}${titularBadge}`,
              });
            }}
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
                Año (Opcional)
              </label>
              <input
                id="anio-ingreso"
                type="number"
                inputMode="numeric"
                min="1900"
                max={new Date().getFullYear() + 1}
                placeholder="Ej: 2018"
                value={anio}
                onChange={(e) => setAnio(e.target.value)}
                className="mt-1 min-h-11 w-full rounded-xl border border-border bg-muted px-3 text-base font-medium text-foreground focus:border-accent focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label htmlFor="vin-ingreso" className="text-caption text-muted-foreground">
                Chasis / VIN (opcional)
              </label>
              <input
                id="vin-ingreso"
                type="text"
                placeholder="17 caracteres"
                value={vin}
                onChange={(e) => setVin(e.target.value.toUpperCase())}
                maxLength={17}
                className="mt-1 min-h-11 w-full rounded-xl border border-border bg-muted px-3 text-base sm:text-sm font-mono font-medium text-foreground focus:border-accent focus:outline-none"
              />
            </div>
            <div>
              <label htmlFor="motor-ingreso" className="text-caption text-muted-foreground">
                Nro. de Motor (opcional)
              </label>
              <input
                id="motor-ingreso"
                type="text"
                placeholder="Ej: K4MV838R079119"
                value={motor}
                onChange={(e) => setMotor(e.target.value.toUpperCase())}
                maxLength={40}
                className="mt-1 min-h-11 w-full rounded-xl border border-border bg-muted px-3 text-base sm:text-sm font-mono font-medium text-foreground focus:border-accent focus:outline-none"
              />
            </div>
          </div>
        </section>

        {/* Bloque 2: Cliente */}
        <section className="space-y-4 rounded-2xl border border-border bg-card p-4 shadow-sm">
          <div className="flex items-center gap-2 border-b border-border pb-3">
            <User className="h-4 w-4 text-accent" />
            <h2 className="text-sm font-bold text-foreground">Cliente / Titular</h2>
          </div>

          {clienteNombre && (
            <div className="flex items-center justify-between rounded-xl border border-accent/30 bg-accent/5 p-2.5 text-xs text-foreground animate-in fade-in">
              <span className="flex items-center gap-1.5 font-semibold truncate">
                <Sparkles className="h-3.5 w-3.5 text-accent shrink-0" />
                <span>Titular de orden: <strong>{[clienteNombre, clienteApellido].filter(Boolean).join(" ")}</strong>{clienteDocumento ? ` (DNI ${clienteDocumento})` : ""}</span>
              </span>
              <span className="text-[10px] uppercase font-bold text-accent shrink-0 ml-2">Auto-asignado</span>
            </div>
          )}

          <SelectorCliente
            clienteNombre={clienteNombre}
            clienteApellido={clienteApellido}
            clienteTelefono={clienteTelefono}
            clienteDocumento={clienteDocumento}
            onCambioNombre={setClienteNombre}
            onCambioApellido={setClienteApellido}
            onCambioTelefono={setClienteTelefono}
            onCambioDocumento={setClienteDocumento}
            onSeleccionarVehiculo={(v) => {
              if (v.patente) setPatente(v.patente);
              if (v.anio) setAnio(String(v.anio));
            }}
          />
        </section>

        {/* Bloque 3: Trabajo y Anomalías */}
        <section className="space-y-4 rounded-2xl border border-border bg-card p-4 shadow-sm">
          <h2 className="text-sm font-bold text-foreground">Tipo de Servicio y Observaciones</h2>

          <div>
            <label className="text-caption font-semibold text-muted-foreground block mb-1">
              Tipo de Servicio / Orden
            </label>
            <DesplegableModerno
              valor={tipo}
              onChange={(v) => setTipo(v as typeof tipo)}
              opciones={OPCIONES_TIPO_OT}
              className="w-full"
              botonClassName="min-h-12 rounded-xl bg-card border-border text-xs font-bold"
            />
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
                className="min-h-11 flex-1 rounded-xl border border-border bg-muted px-3 text-base sm:text-xs text-foreground focus:border-accent focus:outline-none"
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
              className="mt-1 w-full resize-none rounded-xl border border-border bg-muted px-3 py-2 text-base sm:text-xs text-foreground focus:border-accent focus:outline-none"
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
