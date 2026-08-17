"use client";

import { useId, useState, useTransition } from "react";
import {
  Activity,
  AlertCircle,
  AlertTriangle,
  Car,
  Check,
  CheckCircle2,
  Eye,
  FileCheck2,
  Hammer,
  HelpCircle,
  Loader2,
  Palette,
  Plus,
  RefreshCw,
  ScanLine,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  Sun,
  Trash2,
  X,
} from "lucide-react";

import { useIsla } from "@/components/isla/IslaContext";
import { DiagramaVehiculo } from "@/components/ui/DiagramaVehiculo";
import type { FotoConUrl } from "@/lib/actions/fotos";
import {
  actualizarColorVehiculo,
  guardarPeritajeOficial,
  inspeccionarVehiculoIA,
} from "@/lib/actions/peritaje";
import {
  type DanoItem,
  type InspeccionRecepcionPayload,
  type PeritajeIAPayload,
  type SeveridadDano,
  type TipoDano,
  ZONAS_NOMBRES,
} from "@/lib/peritaje/tipos";
import { cn } from "@/lib/utils";

interface PeritajeVehiculoIAProps {
  otId: string;
  tallerId: string;
  fotos: FotoConUrl[];
  peritajeIA: PeritajeIAPayload | null;
  inspeccionRecepcion: InspeccionRecepcionPayload | null;
  vehiculo: {
    id: string;
    patente: string;
    marca?: string | null;
    modelo?: string | null;
    anio?: number | null;
    color?: string | null;
  };
}

const OPCIONES_TIPO_DANO: { id: TipoDano; label: string; icon: typeof Hammer }[] = [
  { id: "abolladura", label: "Abolladura / Golpe", icon: Hammer },
  { id: "rayon", label: "Rayón / Raspón", icon: Activity },
  { id: "optica", label: "Óptica / Iluminación", icon: Sun },
  { id: "rotura_vidrio", label: "Cristal / Parabrisas", icon: ShieldAlert },
  { id: "paragolpes", label: "Paragolpes", icon: AlertCircle },
  { id: "espejo", label: "Espejo retrovisor", icon: Eye },
  { id: "llanta_neumatico", label: "Llanta / Neumático", icon: AlertTriangle },
  { id: "otro", label: "Otro detalle", icon: HelpCircle },
];

export function PeritajeVehiculoIA({
  otId,
  fotos,
  peritajeIA: peritajeProp,
  inspeccionRecepcion: recepcionProp,
  vehiculo,
}: PeritajeVehiculoIAProps) {
  const { notificar } = useIsla();
  const formId = useId();

  // Estados principales
  const [peritajeIA, setPeritajeIA] = useState<PeritajeIAPayload | null>(peritajeProp);
  const [recepcionGuardada, setRecepcionGuardada] = useState<InspeccionRecepcionPayload | null>(
    recepcionProp,
  );
  const [modoEdicion, setModoEdicion] = useState<boolean>(!recepcionProp);

  // Lista viva de daños durante la inspección / edición
  const [danos, setDanos] = useState<DanoItem[]>(() => {
    if (recepcionProp?.danosValidados) {
      const validados: DanoItem[] = (recepcionProp.danosValidados || []).map((d: DanoItem) => ({
        ...d,
        validado: true,
      }));
      const descartados: DanoItem[] = (recepcionProp.danosDescartados || []).map((d: DanoItem) => ({
        ...d,
        validado: false,
      }));
      return [...validados, ...descartados];
    }
    return peritajeProp?.danos || [];
  });

  const [colorDetectado, setColorDetectado] = useState<string>(
    recepcionProp?.colorDetectado || peritajeProp?.colorDetectado || "",
  );
  const [colorHex, setColorHex] = useState<string>(
    recepcionProp?.colorHex || peritajeProp?.colorHex || "#94a3b8",
  );
  const [observaciones, setObservaciones] = useState<string>(
    recepcionProp?.observaciones || peritajeProp?.resumenGeneral || "",
  );
  const [estadoGeneral, setEstadoGeneral] = useState<
    "impecable" | "detalles_menores" | "danos_medios" | "danos_severos"
  >(recepcionProp?.estadoGeneral || "detalles_menores");

  const [zonaFiltro, setZonaFiltro] = useState<string | null>(null);
  const [tabFiltro, setTabFiltro] = useState<"todos" | "validados" | "descartados">("todos");
  const [mostrarFormManual, setMostrarFormManual] = useState(false);

  // Form nuevo daño manual
  const [nuevoTipo, setNuevoTipo] = useState<TipoDano>("rayon");
  const [nuevaZona, setNuevaZona] = useState<string>("puertas_izq");
  const [nuevaSeveridad, setNuevaSeveridad] = useState<SeveridadDano>("leve");
  const [nuevaDescripcion, setNuevaDescripcion] = useState("");

  // Transiciones de server actions
  const [cargandoIA, iniciarIA] = useTransition();
  const [guardando, iniciarGuardado] = useTransition();
  const [actualizandoColor, iniciarColor] = useTransition();

  // Zonas activas en el diagrama (solo las validadas)
  const zonasValidadas = danos.filter((d) => d.validado).map((d) => d.zona);

  const danosValidadosCount = danos.filter((d) => d.validado).length;
  const danosDescartadosCount = danos.filter((d) => !d.validado).length;

  /**
   * Ejecutar análisis de peritaje con IA
   */
  function handleInspeccionarIA() {
    iniciarIA(async () => {
      const res = await inspeccionarVehiculoIA(otId);
      if (res.error || !res.peritaje) {
        notificar({ tipo: "error", mensaje: res.error || "No se pudo realizar el peritaje IA." });
        return;
      }

      setPeritajeIA(res.peritaje);
      setDanos(res.peritaje.danos);
      setColorDetectado(res.peritaje.colorDetectado || "");
      setColorHex(res.peritaje.colorHex || "#94a3b8");
      if (res.peritaje.resumenGeneral && !observaciones) {
        setObservaciones(res.peritaje.resumenGeneral);
      }
      setModoEdicion(true);

      notificar({
        tipo: "exito",
        mensaje: res.peritaje.esSimulacion
          ? "Peritaje inicial generado con éxito"
          : `Peritaje IA completado · ${res.peritaje.danos.length} observaciones`,
      });
    });
  }

  /**
   * Toggle del switch Validar / Descartar
   */
  function handleToggleValidacion(id: string) {
    setDanos((prev) =>
      prev.map((item) => (item.id === id ? { ...item, validado: !item.validado } : item)),
    );
  }

  /**
   * Eliminar un daño detectado o manual
   */
  function handleEliminarDano(id: string) {
    setDanos((prev) => prev.filter((d) => d.id !== id));
  }

  /**
   * Agregar daño manual cargado por el mecánico
   */
  function handleAgregarDanoManual(e: React.FormEvent) {
    e.preventDefault();
    if (!nuevaDescripcion.trim()) return;

    const nuevoDano: DanoItem = {
      id: `manual-${crypto.randomUUID().slice(0, 8)}`,
      tipo: nuevoTipo,
      zona: nuevaZona,
      zonaNombre: ZONAS_NOMBRES[nuevaZona] || nuevaZona,
      descripcion: nuevaDescripcion.trim(),
      severidad: nuevaSeveridad,
      validado: true,
      origen: "manual",
    };

    setDanos((prev) => [nuevoDano, ...prev]);
    setNuevaDescripcion("");
    setMostrarFormManual(false);
    notificar({ tipo: "exito", mensaje: "Daño manual agregado al peritaje" });
  }

  /**
   * Guardar el peritaje oficial de recepción en la base
   */
  function handleGuardarOficial() {
    iniciarGuardado(async () => {
      const validados = danos.filter((d) => d.validado);
      const descartados = danos.filter((d) => !d.validado);
      const zonas = Array.from(new Set(validados.map((d) => d.zona)));

      const payload: InspeccionRecepcionPayload = {
        colorDetectado: colorDetectado || undefined,
        colorHex: colorHex || undefined,
        danosValidados: validados,
        danosDescartados: descartados,
        zonasAfectadas: zonas,
        observaciones: observaciones.trim() || undefined,
        estadoGeneral,
        guardadoEn: new Date().toISOString(),
      };

      const res = await guardarPeritajeOficial(otId, payload);
      if (res.error) {
        notificar({ tipo: "error", mensaje: res.error });
        return;
      }

      setRecepcionGuardada(payload);
      setModoEdicion(false);
      notificar({
        tipo: "exito",
        mensaje: "Peritaje oficial guardado en la orden",
      });
    });
  }

  /**
   * Actualizar el color del vehículo en la base con el detectado
   */
  function handleActualizarColorFicha() {
    if (!colorDetectado) return;
    iniciarColor(async () => {
      const res = await actualizarColorVehiculo(vehiculo.id, colorDetectado, otId);
      if (res.error) {
        notificar({ tipo: "error", mensaje: res.error });
        return;
      }
      notificar({
        tipo: "exito",
        mensaje: `Color del vehículo actualizado a ${colorDetectado}`,
      });
    });
  }

  /**
   * Restablecer o volver a editar el peritaje oficial
   */
  function handleReabrirEdicion() {
    setModoEdicion(true);
  }

  const danosFiltrados = danos.filter((d) => {
    if (tabFiltro === "validados" && !d.validado) return false;
    if (tabFiltro === "descartados" && d.validado) return false;
    if (zonaFiltro && d.zona !== zonaFiltro) return false;
    return true;
  });

  return (
    <section className="space-y-4 rounded-3xl border border-border/80 bg-card p-5 shadow-sm transition-all sm:p-6">
      {/* Encabezado del Peritaje */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border pb-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="grid h-8 w-8 place-items-center rounded-xl bg-violet-600/10 text-violet-600 dark:bg-violet-500/20 dark:text-violet-400">
              <Sparkles className="h-4 w-4" aria-hidden />
            </span>
            <h2 className="text-base font-bold tracking-tight text-foreground sm:text-lg">
              Peritaje Visual e Inspección IA
            </h2>
          </div>
          <p className="text-caption text-muted-foreground">
            Inspección de chapa, pintura, cristales y ópticas en la recepción del vehículo.
          </p>
        </div>

        {/* Badge de Estado Oficial */}
        <div className="flex items-center gap-2">
          {recepcionGuardada && !modoEdicion ? (
            <div className="flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-3 py-1 text-caption font-bold text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300">
              <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
              <span>Peritaje Oficial Guardado</span>
            </div>
          ) : peritajeIA ? (
            <div className="flex items-center gap-1.5 rounded-full bg-amber-500/10 px-3 py-1 text-caption font-bold text-amber-700 dark:bg-amber-500/20 dark:text-amber-300">
              <ScanLine className="h-4 w-4 shrink-0 text-amber-600" />
              <span>Borrador en Revisión</span>
            </div>
          ) : (
            <div className="flex items-center gap-1.5 rounded-full bg-muted px-3 py-1 text-caption font-medium text-muted-foreground">
              <Car className="h-4 w-4 shrink-0" />
              <span>Sin peritaje</span>
            </div>
          )}
        </div>
      </div>

      {/* Botón principal CTA o Barra de acciones */}
      {!peritajeIA && !recepcionGuardada ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-accent-suave/30 p-6 text-center space-y-3">
          <div className="grid h-12 w-12 place-items-center rounded-2xl bg-violet-600 text-white shadow-md">
            <Sparkles className="h-6 w-6" />
          </div>
          <div className="max-w-md space-y-1">
            <h3 className="text-sm font-bold text-foreground sm:text-base">
              Comenzar Peritaje de Recepción
            </h3>
            <p className="text-caption text-muted-foreground">
              {fotos.length > 0
                ? `Se analizarán las ${fotos.length} foto${fotos.length === 1 ? "" : "s"} subidas para detectar color, abolladuras, rayones y estado de ópticas.`
                : "La IA inspeccionará la carrocería del vehículo detectando color, golpes, rayones y roturas preexistentes."}
            </p>
          </div>
          <button
            type="button"
            onClick={handleInspeccionarIA}
            disabled={cargandoIA}
            className="flex min-h-11 items-center justify-center gap-2 rounded-xl bg-violet-600 px-5 text-sm font-bold text-white shadow-sm transition-all hover:bg-violet-700 active:scale-95 disabled:opacity-60"
          >
            {cargandoIA ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Analizando carrocería con IA…</span>
              </>
            ) : (
              <>
                <ScanLine className="h-4 w-4" />
                <span>Inspeccionar con IA</span>
              </>
            )}
          </button>
        </div>
      ) : (
        <div className="space-y-5">
          {/* Card de Color Detectado y Resumen General */}
          <div className="grid grid-cols-1 gap-3 rounded-2xl border border-border bg-card p-4 sm:grid-cols-3">
            {/* Color Detectado */}
            <div className="flex items-center gap-3.5 sm:col-span-2">
              <div
                className="relative h-11 w-11 shrink-0 rounded-full border-2 border-white shadow-md ring-2 ring-border/80"
                style={{ backgroundColor: colorHex }}
                title={`Muestra de color: ${colorDetectado || "Desconocido"}`}
              >
                <Palette className="absolute inset-0 m-auto h-4 w-4 text-slate-700/60 drop-shadow dark:text-white/80" />
              </div>
              <div className="min-w-0 flex-1 space-y-0.5">
                <div className="flex flex-wrap items-center gap-1.5">
                  <span className="text-caption font-bold text-muted-foreground uppercase tracking-wider">
                    Color Detectado
                  </span>
                  {peritajeIA?.confianzaColor && (
                    <span className="rounded-md bg-violet-500/10 px-1.5 py-0.5 text-[0.625rem] font-bold text-violet-700 dark:bg-violet-500/20 dark:text-violet-300">
                      {peritajeIA.confianzaColor}% coincidencia
                    </span>
                  )}
                </div>
                <p className="text-sm font-black text-foreground truncate">
                  {colorDetectado || "No identificado"}
                </p>
                <div className="flex flex-wrap items-center gap-2 text-caption text-muted-foreground">
                  <span>Ficha: {vehiculo.color || "Sin color"}</span>
                  {colorDetectado &&
                    vehiculo.color?.toLowerCase() !== colorDetectado.toLowerCase() && (
                      <button
                        type="button"
                        onClick={handleActualizarColorFicha}
                        disabled={actualizandoColor}
                        className="font-bold text-violet-600 underline hover:text-violet-800 dark:text-violet-400"
                      >
                        {actualizandoColor ? "Actualizando…" : "Actualizar ficha"}
                      </button>
                    )}
                </div>
              </div>
            </div>

            {/* Carrocería & Estado */}
            <div className="flex flex-col justify-center border-t border-border pt-3 sm:border-t-0 sm:border-l sm:pl-4 sm:pt-0">
              <span className="text-caption font-bold text-muted-foreground uppercase tracking-wider">
                Estado General
              </span>
              {modoEdicion ? (
                <select
                  value={estadoGeneral}
                  onChange={(e) =>
                    setEstadoGeneral(
                      e.target.value as
                        | "impecable"
                        | "detalles_menores"
                        | "danos_medios"
                        | "danos_severos",
                    )
                  }
                  className="mt-1 block w-full rounded-lg border border-border bg-background px-2.5 py-1.5 text-xs font-bold text-foreground outline-none focus:border-violet-500"
                >
                  <option value="impecable">🟢 Impecable / Sin daños</option>
                  <option value="detalles_menores">🟡 Detalles menores</option>
                  <option value="danos_medios">🟠 Daños de chapa/pintura</option>
                  <option value="danos_severos">🔴 Daños severos / Colisión</option>
                </select>
              ) : (
                <p className="mt-1 text-xs font-bold text-foreground">
                  {estadoGeneral === "impecable" && "🟢 Impecable / Sin daños"}
                  {estadoGeneral === "detalles_menores" && "🟡 Detalles menores"}
                  {estadoGeneral === "danos_medios" && "🟠 Daños de chapa y pintura"}
                  {estadoGeneral === "danos_severos" && "🔴 Daños severos / Colisión"}
                </p>
              )}
            </div>
          </div>

          {/* Grid Principal: Diagrama de Vehículo 2D + Lista de Daños Interactiva */}
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
            {/* Columna Izquierda: Diagrama 2D Interactivo */}
            <div className="flex flex-col items-center justify-start rounded-2xl border border-border/70 bg-muted/20 p-4 lg:col-span-5">
              <div className="flex w-full items-center justify-between border-b border-border pb-2">
                <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Mapa de Carrocería
                </span>
                <span className="text-caption font-semibold text-foreground">
                  {zonasValidadas.length} zonas marcadas
                </span>
              </div>

              <div className="my-2 py-1">
                <DiagramaVehiculo
                  zonasSeleccionadas={zonasValidadas}
                  onToggleZona={(zonaId) => {
                    if (!modoEdicion) return;
                    setZonaFiltro((prev) => (prev === zonaId ? null : zonaId));
                  }}
                  readOnly={!modoEdicion}
                />
              </div>

              <div className="w-full space-y-1.5 border-t border-border pt-2 text-center">
                <div className="flex items-center justify-center gap-4 text-caption font-medium text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <span className="h-2.5 w-2.5 rounded-full bg-red-500" />
                    Validados ({danosValidadosCount})
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="h-2.5 w-2.5 rounded-full bg-zinc-600" />
                    Descartados ({danosDescartadosCount})
                  </span>
                </div>
                {zonaFiltro && (
                  <button
                    type="button"
                    onClick={() => setZonaFiltro(null)}
                    className="text-caption font-bold text-violet-600 hover:underline"
                  >
                    Ver todas las zonas (filtro activo: {ZONAS_NOMBRES[zonaFiltro] || zonaFiltro})
                  </button>
                )}
              </div>
            </div>

            {/* Columna Derecha: Lista de Daños con Switches Interactivos */}
            <div className="space-y-3 lg:col-span-7">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => setTabFiltro("todos")}
                    className={cn(
                      "rounded-lg px-2.5 py-1 text-xs font-bold transition-colors",
                      tabFiltro === "todos"
                        ? "bg-violet-600 text-white"
                        : "bg-muted text-muted-foreground hover:text-foreground",
                    )}
                  >
                    Todos ({danos.length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setTabFiltro("validados")}
                    className={cn(
                      "rounded-lg px-2.5 py-1 text-xs font-bold transition-colors",
                      tabFiltro === "validados"
                        ? "bg-emerald-600 text-white"
                        : "bg-muted text-muted-foreground hover:text-foreground",
                    )}
                  >
                    Validados ({danosValidadosCount})
                  </button>
                  <button
                    type="button"
                    onClick={() => setTabFiltro("descartados")}
                    className={cn(
                      "rounded-lg px-2.5 py-1 text-xs font-bold transition-colors",
                      tabFiltro === "descartados"
                        ? "bg-zinc-700 text-white"
                        : "bg-muted text-muted-foreground hover:text-foreground",
                    )}
                  >
                    Descartados ({danosDescartadosCount})
                  </button>
                </div>

                {modoEdicion && (
                  <button
                    type="button"
                    onClick={() => setMostrarFormManual((v) => !v)}
                    className="inline-flex items-center gap-1 text-xs font-bold text-violet-600 hover:text-violet-800 dark:text-violet-400"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    <span>Agregar daño manual</span>
                  </button>
                )}
              </div>

              {/* Formulario para agregar daño manual */}
              {mostrarFormManual && modoEdicion && (
                <form
                  onSubmit={handleAgregarDanoManual}
                  className="space-y-3 rounded-xl border border-violet-200 bg-violet-50/50 p-3.5 dark:border-violet-900/40 dark:bg-violet-950/20"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold uppercase tracking-wider text-violet-800 dark:text-violet-300">
                      Nuevo Daño Observado
                    </span>
                    <button
                      type="button"
                      onClick={() => setMostrarFormManual(false)}
                      className="text-muted-foreground hover:text-foreground"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>

                  <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
                    <div>
                      <label
                        htmlFor={`${formId}-tipo`}
                        className="block text-[0.6875rem] font-bold text-muted-foreground uppercase"
                      >
                        Tipo
                      </label>
                      <select
                        id={`${formId}-tipo`}
                        value={nuevoTipo}
                        onChange={(e) => setNuevoTipo(e.target.value as TipoDano)}
                        className="mt-1 w-full rounded-lg border border-border bg-background px-2.5 py-1.5 text-xs font-medium text-foreground outline-none"
                      >
                        {OPCIONES_TIPO_DANO.map((t) => (
                          <option key={t.id} value={t.id}>
                            {t.label}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label
                        htmlFor={`${formId}-zona`}
                        className="block text-[0.6875rem] font-bold text-muted-foreground uppercase"
                      >
                        Zona
                      </label>
                      <select
                        id={`${formId}-zona`}
                        value={nuevaZona}
                        onChange={(e) => setNuevaZona(e.target.value)}
                        className="mt-1 w-full rounded-lg border border-border bg-background px-2.5 py-1.5 text-xs font-medium text-foreground outline-none"
                      >
                        {Object.entries(ZONAS_NOMBRES).map(([key, nombre]) => (
                          <option key={key} value={key}>
                            {String(nombre)}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label
                        htmlFor={`${formId}-severidad`}
                        className="block text-[0.6875rem] font-bold text-muted-foreground uppercase"
                      >
                        Severidad
                      </label>
                      <select
                        id={`${formId}-severidad`}
                        value={nuevaSeveridad}
                        onChange={(e) => setNuevaSeveridad(e.target.value as SeveridadDano)}
                        className="mt-1 w-full rounded-lg border border-border bg-background px-2.5 py-1.5 text-xs font-medium text-foreground outline-none"
                      >
                        <option value="leve">Leve</option>
                        <option value="moderado">Moderado</option>
                        <option value="grave">Grave / Rotura</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label
                      htmlFor={`${formId}-descripcion`}
                      className="block text-[0.6875rem] font-bold text-muted-foreground uppercase"
                    >
                      Descripción detallada
                    </label>
                    <input
                      id={`${formId}-descripcion`}
                      type="text"
                      placeholder="Ej: Rayón de 10cm en guardabarro trasero o microabolladura..."
                      value={nuevaDescripcion}
                      onChange={(e) => setNuevaDescripcion(e.target.value)}
                      className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-1.5 text-xs text-foreground outline-none focus:border-violet-500"
                    />
                  </div>

                  <div className="flex justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => setMostrarFormManual(false)}
                      className="rounded-lg px-3 py-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground"
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      disabled={!nuevaDescripcion.trim()}
                      className="rounded-lg bg-violet-600 px-3.5 py-1.5 text-xs font-bold text-white transition-transform active:scale-95 disabled:opacity-50"
                    >
                      Agregar al peritaje
                    </button>
                  </div>
                </form>
              )}

              {/* Lista de Tarjetas de Daños */}
              {danosFiltrados.length === 0 ? (
                <div className="rounded-xl border border-dashed border-border p-6 text-center text-xs text-muted-foreground">
                  No hay daños para mostrar con los filtros seleccionados.
                </div>
              ) : (
                <div className="space-y-2.5">
                  {danosFiltrados.map((dano) => {
                    const tipoObj =
                      OPCIONES_TIPO_DANO.find((t) => t.id === dano.tipo) || OPCIONES_TIPO_DANO[0];
                    const Icono = tipoObj.icon;

                    return (
                      <div
                        key={dano.id}
                        className={cn(
                          "relative rounded-2xl border p-3.5 transition-all",
                          dano.validado
                            ? "border-border bg-card shadow-sm"
                            : "border-border/50 bg-muted/30 opacity-70",
                        )}
                      >
                        <div className="flex items-start justify-between gap-3">
                          {/* Icono y Detalles */}
                          <div className="flex items-start gap-3 min-w-0">
                            <span
                              className={cn(
                                "grid h-9 w-9 shrink-0 place-items-center rounded-xl",
                                dano.validado
                                  ? dano.severidad === "grave"
                                    ? "bg-rose-500/10 text-rose-600 dark:bg-rose-500/20 dark:text-rose-400"
                                    : dano.severidad === "moderado"
                                    ? "bg-amber-500/10 text-amber-600 dark:bg-amber-500/20 dark:text-amber-400"
                                    : "bg-blue-500/10 text-blue-600 dark:bg-blue-500/20 dark:text-blue-400"
                                  : "bg-muted text-muted-foreground",
                              )}
                            >
                              <Icono className="h-4.5 w-4.5" />
                            </span>

                            <div className="space-y-1 min-w-0">
                              <div className="flex flex-wrap items-center gap-1.5">
                                <span className="text-xs font-bold text-foreground">
                                  {dano.zonaNombre || ZONAS_NOMBRES[dano.zona] || dano.zona}
                                </span>

                                <span
                                  className={cn(
                                    "rounded px-1.5 py-0.2 text-[0.625rem] font-bold uppercase",
                                    dano.severidad === "grave"
                                      ? "bg-rose-500/15 text-rose-700 dark:text-rose-300"
                                      : dano.severidad === "moderado"
                                      ? "bg-amber-500/15 text-amber-700 dark:text-amber-300"
                                      : "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300",
                                  )}
                                >
                                  {dano.severidad}
                                </span>

                                {dano.origen === "manual" ? (
                                  <span className="rounded bg-muted px-1.5 py-0.2 text-[0.625rem] font-semibold text-muted-foreground">
                                    Manual
                                  </span>
                                ) : dano.confianza ? (
                                  <span className="rounded bg-violet-500/10 px-1.5 py-0.2 text-[0.625rem] font-semibold text-violet-700 dark:text-violet-300">
                                    {dano.confianza}% IA
                                  </span>
                                ) : null}
                              </div>

                              <p
                                className={cn(
                                  "text-xs leading-relaxed text-foreground",
                                  !dano.validado && "line-through text-muted-foreground",
                                )}
                              >
                                {dano.descripcion}
                              </p>
                            </div>
                          </div>

                          {/* Switch Interactivo: Validar / Descartar */}
                          <div className="flex flex-col items-end gap-1 shrink-0">
                            {modoEdicion ? (
                              <button
                                type="button"
                                role="switch"
                                aria-checked={dano.validado}
                                onClick={() => handleToggleValidacion(dano.id)}
                                className={cn(
                                  "flex min-h-8 items-center gap-1.5 rounded-full px-3 text-[0.6875rem] font-bold transition-all active:scale-95",
                                  dano.validado
                                    ? "bg-emerald-600 text-white shadow-sm hover:bg-emerald-700"
                                    : "bg-muted text-muted-foreground hover:bg-muted/80 hover:text-foreground",
                                )}
                              >
                                {dano.validado ? (
                                  <>
                                    <Check className="h-3.5 w-3.5" />
                                    <span>Validado</span>
                                  </>
                                ) : (
                                  <>
                                    <X className="h-3.5 w-3.5" />
                                    <span>Descartar</span>
                                  </>
                                )}
                              </button>
                            ) : (
                              <span
                                className={cn(
                                  "flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[0.6875rem] font-bold",
                                  dano.validado
                                    ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300"
                                    : "bg-muted text-muted-foreground",
                                )}
                              >
                                {dano.validado ? "Validado" : "Descartado"}
                              </span>
                            )}

                            {modoEdicion && (
                              <button
                                type="button"
                                onClick={() => handleEliminarDano(dano.id)}
                                title="Eliminar registro"
                                className="grid h-6 w-6 place-items-center text-muted-foreground hover:text-destructive active:scale-90"
                              >
                                <Trash2 className="h-3 w-3" />
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Observaciones de Recepción */}
          <div className="space-y-1.5 rounded-2xl border border-border/80 bg-muted/10 p-4">
            <label
              htmlFor={`${formId}-obs`}
              className="text-xs font-bold uppercase tracking-wider text-muted-foreground"
            >
              Observaciones de Recepción del Mecánico
            </label>
            {modoEdicion ? (
              <textarea
                id={`${formId}-obs`}
                rows={2}
                value={observaciones}
                onChange={(e) => setObservaciones(e.target.value)}
                placeholder="Aclaraciones del estado de ingreso, notas con el cliente o detalles no contemplados..."
                className="w-full resize-y rounded-xl border border-border bg-background px-3 py-2 text-xs text-foreground outline-none focus:border-violet-500"
              />
            ) : (
              <p className="text-xs text-foreground leading-relaxed">
                {observaciones || "Sin observaciones adicionales registradas."}
              </p>
            )}
          </div>

          {/* Acciones Finales: Guardar Peritaje Oficial / Re-inspeccionar / Editar */}
          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border pt-4">
            <div className="flex items-center gap-2">
              {modoEdicion ? (
                <button
                  type="button"
                  onClick={handleInspeccionarIA}
                  disabled={cargandoIA}
                  className="flex min-h-10 items-center gap-1.5 rounded-xl border border-border bg-card px-3.5 text-xs font-bold text-foreground shadow-sm transition-transform hover:bg-muted active:scale-95 disabled:opacity-60"
                >
                  {cargandoIA ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <RefreshCw className="h-3.5 w-3.5" />
                  )}
                  <span>Re-analizar con IA</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleReabrirEdicion}
                  className="flex min-h-10 items-center gap-1.5 rounded-xl border border-border bg-card px-3.5 text-xs font-bold text-foreground shadow-sm transition-transform hover:bg-muted active:scale-95"
                >
                  <FileCheck2 className="h-3.5 w-3.5 text-violet-600" />
                  <span>Modificar peritaje</span>
                </button>
              )}
            </div>

            {modoEdicion && (
              <button
                type="button"
                onClick={handleGuardarOficial}
                disabled={guardando}
                className="flex min-h-11 items-center justify-center gap-2 rounded-xl bg-emerald-600 px-5 text-xs font-bold text-white shadow-sm transition-all hover:bg-emerald-700 active:scale-95 disabled:opacity-60"
              >
                {guardando ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Guardando peritaje oficial…</span>
                  </>
                ) : (
                  <>
                    <ShieldCheck className="h-4 w-4" />
                    <span>Guardar Peritaje Oficial</span>
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      )}
    </section>
  );
}
