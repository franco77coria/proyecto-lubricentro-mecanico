"use client";

import { ArrowLeft, Car, FileText, Plus, Trash2, Wrench } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition, useEffect } from "react";

import { PatenteInput } from "@/components/campos/PatenteInput";
import { SelectorVehiculo, type ValorVehiculo } from "@/components/campos/SelectorVehiculo";
import { useIsla } from "@/components/isla/IslaContext";
import { type OpcionCatalogo } from "@/lib/actions/catalogo";
import { crearPresupuestoCompleto, type DatosPresupuesto } from "@/lib/actions/presupuestos";
import { crearVehiculo } from "@/lib/actions/vehiculos";
import { obtenerFichaPorMotorizacion, type FichaTecnica } from "@/lib/actions/tecnica";

const VEHICULO_VACIO: ValorVehiculo = { marcaId: "", modeloId: "", motorizacionId: "" };

type ItemTemporal = {
  id: string;
  tipo: "mano_obra" | "repuesto" | "servicio" | "insumo" | "tercero";
  descripcion: string;
  cantidad: number;
  precioUnitario: number;
};

export function FormNuevoPresupuesto({ marcas }: { marcas: OpcionCatalogo[] }) {
  const router = useRouter();
  const { notificar } = useIsla();
  const [isPending, startTransition] = useTransition();
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Form campos vehiculo
  const [patente, setPatente] = useState("");
  const [formatoEspecial, setFormatoEspecial] = useState(false);
  const [vehiculo, setVehiculo] = useState<ValorVehiculo>(VEHICULO_VACIO);
  const [clienteNombre, setClienteNombre] = useState("");
  const [clienteTelefono, setClienteTelefono] = useState("");

  // Items y Notas
  const [descargo, setDescargo] = useState("");
  const [items, setItems] = useState<ItemTemporal[]>([]);
  
  // Ficha Tecnica
  const [ficha, setFicha] = useState<Partial<FichaTecnica> | null>(null);
  const [cargandoFicha, setCargandoFicha] = useState(false);

  useEffect(() => {
    let ignore = false;
    
    if (!vehiculo.motorizacionId) {
      setFicha(null);
      return;
    }
    
    setCargandoFicha(true);
    
    obtenerFichaPorMotorizacion(vehiculo.motorizacionId)
      .then(data => {
        if (!ignore) {
          // Si data es nulo/indefinido, dejamos la ficha en null para no renderizar tarjetas vacías
          setFicha(data ?? null);
          setCargandoFicha(false);
        }
      })
      .catch(err => {
        console.error("Error al cargar ficha:", err);
        if (!ignore) {
          setFicha(null);
          setCargandoFicha(false);
        }
      });
      
    return () => {
      ignore = true;
    };
  }, [vehiculo.motorizacionId]);

  const handleAgregarItem = () => {
    setItems((prev) => [
      ...prev,
      { id: crypto.randomUUID(), tipo: "mano_obra", descripcion: "", cantidad: 1, precioUnitario: 0 },
    ]);
  };

  const handleUpdateItem = (id: string, campo: keyof ItemTemporal, valor: any) => {
    setItems((prev) => prev.map((it) => (it.id === id ? { ...it, [campo]: valor } : it)));
  };

  const handleRemoveItem = (id: string) => {
    setItems((prev) => prev.filter((it) => it.id !== id));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    // Validate Items
    const itemsValidos = items.filter((it) => it.descripcion.trim() !== "" && it.precioUnitario > 0);

    startTransition(async () => {
      // 1. Crear o buscar vehículo
      const formDataVehiculo = new FormData();
      formDataVehiculo.append("patente", patente);
      if (formatoEspecial) formDataVehiculo.append("formatoEspecial", "on");
      if (vehiculo.marcaId) formDataVehiculo.append("marcaId", vehiculo.marcaId);
      if (vehiculo.modeloId) formDataVehiculo.append("modeloId", vehiculo.modeloId);
      if (vehiculo.motorizacionId) formDataVehiculo.append("motorizacionId", vehiculo.motorizacionId);
      if (clienteNombre) formDataVehiculo.append("clienteNombre", clienteNombre);
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
          mensaje: `${resVehiculo.duplicado.patente} ya estaba cargado. El presupuesto va sobre esa ficha.`,
        });
      }

      // 2. Crear Presupuesto
      const datosReq: DatosPresupuesto = {
        vehiculoId,
        descargos: descargo.trim() ? [descargo.trim()] : undefined,
        items: itemsValidos.length > 0 ? itemsValidos : undefined,
      };

      const resOT = await crearPresupuestoCompleto(datosReq);

      if (resOT.error || !resOT.otId) {
        setErrorMsg(resOT.error || "No se pudo generar el Presupuesto.");
        return;
      }

      notificar({ tipo: "exito", mensaje: "Presupuesto creado con éxito." });
      router.push(`/ot/${resOT.otId}`);
    });
  };

  const subtotal = items.reduce((acc, it) => acc + it.cantidad * it.precioUnitario, 0);

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
        <p className="text-caption text-muted-foreground">Cotizador Rápido</p>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Nuevo Presupuesto</h1>
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
          <h2 className="text-sm font-bold text-foreground">Auto y Cliente</h2>
        </div>

        <PatenteInput
          value={patente}
          onChange={setPatente}
          formatoEspecial={formatoEspecial}
          onFormatoEspecialChange={setFormatoEspecial}
        />

        <SelectorVehiculo marcas={marcas} valor={vehiculo} onChange={setVehiculo} />
        
        {/* Ficha Técnica Card */}
        {vehiculo.motorizacionId && (
          <div className="rounded-xl border-2 border-blue-500/20 bg-blue-500/5 p-4 mt-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-blue-700 dark:text-blue-400 mb-2">Base Técnica del Vehículo</h3>
            {cargandoFicha ? (
              <p className="text-sm text-muted-foreground animate-pulse">Cargando especificaciones...</p>
            ) : ficha ? (
              <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                {ficha.aceite_litros && (
                  <div><span className="text-muted-foreground font-medium">Aceite:</span> {ficha.aceite_litros}L {ficha.aceite_viscosidad}</div>
                )}
                {ficha.filtro_aceite && (
                  <div><span className="text-muted-foreground font-medium">F. Aceite:</span> {ficha.filtro_aceite}</div>
                )}
                {ficha.filtro_aire && (
                  <div><span className="text-muted-foreground font-medium">F. Aire:</span> {ficha.filtro_aire}</div>
                )}
                {ficha.filtro_combustible && (
                  <div><span className="text-muted-foreground font-medium">F. Comb.:</span> {ficha.filtro_combustible}</div>
                )}
                {ficha.filtro_habitaculo && (
                  <div><span className="text-muted-foreground font-medium">F. Hab.:</span> {ficha.filtro_habitaculo}</div>
                )}
                {!ficha.aceite_litros && !ficha.filtro_aceite && (
                  <div className="col-span-2 text-muted-foreground text-xs italic">La ficha existe pero está incompleta.</div>
                )}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No hay datos técnicos cargados para este motor. <a href="/stock/equivalencias" target="_blank" className="text-blue-600 dark:text-blue-400 hover:underline">Sugerir ficha</a>.</p>
            )}
          </div>
        )}

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label htmlFor="cli-nombre" className="text-caption text-muted-foreground">
              Nombre o Apodo
            </label>
            <input
              id="cli-nombre"
              type="text"
              placeholder="Ej: Juan Pérez"
              value={clienteNombre}
              onChange={(e) => setClienteNombre(e.target.value)}
              className="mt-1 flex h-11 w-full rounded-xl border border-input bg-transparent px-3 py-2 text-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            />
          </div>
          <div>
            <label htmlFor="cli-tel" className="text-caption text-muted-foreground">
              WhatsApp
            </label>
            <input
              id="cli-tel"
              type="tel"
              placeholder="Ej: 1123456789"
              value={clienteTelefono}
              onChange={(e) => setClienteTelefono(e.target.value)}
              className="mt-1 flex h-11 w-full rounded-xl border border-input bg-transparent px-3 py-2 text-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            />
          </div>
        </div>
      </section>

      {/* Bloque 2: Trabajos y Repuestos */}
      <section className="space-y-4 rounded-2xl border border-border bg-card p-4 shadow-sm">
        <div className="flex items-center justify-between border-b border-border pb-3">
          <div className="flex items-center gap-2">
            <Wrench className="h-4 w-4 text-accent" />
            <h2 className="text-sm font-bold text-foreground">Items a Presupuestar</h2>
          </div>
          <button
            type="button"
            onClick={handleAgregarItem}
            className="flex items-center gap-1 rounded-lg bg-emerald-600/10 px-2 py-1 text-xs font-bold text-emerald-600 hover:bg-emerald-600/20"
          >
            <Plus className="h-3.5 w-3.5" /> Agregar Ítem
          </button>
        </div>

        {items.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-6 text-center text-muted-foreground">
            <p className="text-sm">No agregaste repuestos ni mano de obra.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {items.map((it, idx) => (
              <div key={it.id} className="flex flex-col gap-2 rounded-xl bg-muted/40 p-3">
                <div className="flex items-start gap-2">
                  <select
                    value={it.tipo}
                    onChange={(e) => handleUpdateItem(it.id, "tipo", e.target.value)}
                    className="h-10 rounded-lg border border-input bg-background px-2 text-sm focus-visible:outline-none focus-visible:ring-1"
                  >
                    <option value="mano_obra">Mano de Obra</option>
                    <option value="repuesto">Repuesto</option>
                    <option value="insumo">Insumo</option>
                  </select>
                  <button
                    type="button"
                    onClick={() => handleRemoveItem(it.id)}
                    className="ml-auto mt-1 flex h-8 w-8 items-center justify-center rounded-lg text-destructive hover:bg-destructive/10"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
                <input
                  type="text"
                  placeholder="Ej: Cambio de pastillas de freno"
                  value={it.descripcion}
                  onChange={(e) => handleUpdateItem(it.id, "descripcion", e.target.value)}
                  className="h-10 w-full rounded-lg border border-input bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-1"
                />
                <div className="flex gap-2">
                  <div className="flex-1">
                    <label className="text-[10px] uppercase text-muted-foreground">CANT</label>
                    <input
                      type="number"
                      step="any"
                      min="0"
                      value={it.cantidad}
                      onChange={(e) => handleUpdateItem(it.id, "cantidad", Number(e.target.value))}
                      className="h-10 w-full rounded-lg border border-input bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-1"
                    />
                  </div>
                  <div className="flex-[2]">
                    <label className="text-[10px] uppercase text-muted-foreground">PRECIO UNIT. ($)</label>
                    <input
                      type="number"
                      min="0"
                      value={it.precioUnitario}
                      onChange={(e) => handleUpdateItem(it.id, "precioUnitario", Number(e.target.value))}
                      className="h-10 w-full rounded-lg border border-input bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-1"
                    />
                  </div>
                </div>
              </div>
            ))}
            
            <div className="flex justify-between border-t border-border pt-3">
              <span className="text-sm font-semibold text-muted-foreground">Total Presupuesto</span>
              <span className="text-lg font-bold text-emerald-600">
                ${subtotal.toLocaleString("es-AR", { minimumFractionDigits: 2 })}
              </span>
            </div>
          </div>
        )}
      </section>

      {/* Bloque 3: Notas */}
      <section className="space-y-4 rounded-2xl border border-border bg-card p-4 shadow-sm">
        <div className="flex items-center gap-2 border-b border-border pb-3">
          <FileText className="h-4 w-4 text-accent" />
          <h2 className="text-sm font-bold text-foreground">Diagnóstico / Descargo Taller</h2>
        </div>
        <textarea
          placeholder="Anotá lo que encontraste o por qué pasás este presupuesto..."
          value={descargo}
          onChange={(e) => setDescargo(e.target.value)}
          rows={3}
          className="w-full rounded-xl border border-input bg-transparent p-3 text-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
        />
      </section>

      <button
        type="submit"
        disabled={isPending || !patente}
        className="flex min-h-14 w-full items-center justify-center gap-2 rounded-xl bg-accent text-lg font-bold text-white shadow-lg transition-transform active:scale-[0.98] disabled:pointer-events-none disabled:opacity-50"
      >
        Generar Presupuesto y PDF
      </button>
    </form>
  );
}
