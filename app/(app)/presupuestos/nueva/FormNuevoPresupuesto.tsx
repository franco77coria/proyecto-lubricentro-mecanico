"use client";

import { ArrowLeft, Car, FileText, Plus, RotateCcw, Trash2, Wrench } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition, useEffect } from "react";

import { PatenteInput } from "@/components/campos/PatenteInput";
import { SelectorVehiculo, type ValorVehiculo } from "@/components/campos/SelectorVehiculo";
import { useIsla } from "@/components/isla/IslaContext";
import { type OpcionCatalogo, resolverDesdeCedula } from "@/lib/actions/catalogo";
import { crearPresupuestoCompleto, type DatosPresupuesto } from "@/lib/actions/presupuestos";
import { crearVehiculo } from "@/lib/actions/vehiculos";
import { obtenerFichaPorMotorizacion, type FichaTecnica } from "@/lib/actions/tecnica";

const VEHICULO_VACIO: ValorVehiculo = { marcaId: "", modeloId: "", motorizacionId: "" };
const DRAFT_KEY = "draft_nuevo_presupuesto";

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
  const [items, setItems] = useState<ItemTemporal[]>([
    { id: "init-1", tipo: "mano_obra", descripcion: "", cantidad: 1, precioUnitario: 0 },
  ]);
  const [tieneBorrador, setTieneBorrador] = useState(false);
  
  // Ficha Tecnica
  const [ficha, setFicha] = useState<Partial<FichaTecnica> | null>(null);

  // Recuperar borrador
  useEffect(() => {
    try {
      const draft = localStorage.getItem(DRAFT_KEY);
      if (draft) {
        const d = JSON.parse(draft);
        if (d.patente) setPatente(d.patente);
        if (d.vehiculo) setVehiculo(d.vehiculo);
        if (d.clienteNombre) setClienteNombre(d.clienteNombre);
        if (d.clienteTelefono) setClienteTelefono(d.clienteTelefono);
        if (d.descargo) setDescargo(d.descargo);
        if (d.items?.length) setItems(d.items);
        setTieneBorrador(true);
      }
    } catch {
      // Ignorar errores de parseo
    }
  }, []);

  // Guardar borrador automáticamente
  useEffect(() => {
    if (patente.trim() || clienteNombre.trim() || items.some((it) => it.descripcion.trim()) || descargo.trim()) {
      const dataToSave = {
        patente,
        vehiculo,
        clienteNombre,
        clienteTelefono,
        descargo,
        items,
      };
      localStorage.setItem(DRAFT_KEY, JSON.stringify(dataToSave));
      setTieneBorrador(true);
    }
  }, [patente, vehiculo, clienteNombre, clienteTelefono, descargo, items]);

  const limpiarBorrador = () => {
    localStorage.removeItem(DRAFT_KEY);
    setPatente("");
    setVehiculo(VEHICULO_VACIO);
    setClienteNombre("");
    setClienteTelefono("");
    setDescargo("");
    setItems([{ id: "init-1", tipo: "mano_obra", descripcion: "", cantidad: 1, precioUnitario: 0 }]);
    setTieneBorrador(false);
    notificar({ tipo: "alerta", mensaje: "Borrador de cotización limpiado." });
  };

  useEffect(() => {
    let ignore = false;
    
    if (vehiculo.motorizacionId) {
      obtenerFichaPorMotorizacion(vehiculo.motorizacionId)
        .then((data) => {
          if (!ignore) {
            setFicha(data ?? null);
          }
        })
        .catch((err) => {
          console.error("Error al cargar ficha:", err);
          if (!ignore) {
            setFicha(null);
          }
        });
    }
      
    return () => {
      ignore = true;
    };
  }, [vehiculo.motorizacionId]);

  const fichaAMostrar = vehiculo.motorizacionId ? ficha : null;

  const handleAgregarItem = () => {
    setItems((prev) => [
      ...prev,
      { id: crypto.randomUUID(), tipo: "repuesto", descripcion: "", cantidad: 1, precioUnitario: 0 },
    ]);
  };

  const handleUpdateItem = (id: string, campo: keyof ItemTemporal, valor: string | number) => {
    setItems((prev) => prev.map((it) => (it.id === id ? { ...it, [campo]: valor } : it)));
  };

  const handleRemoveItem = (id: string) => {
    if (items.length <= 1) {
      setItems([{ id: crypto.randomUUID(), tipo: "mano_obra", descripcion: "", cantidad: 1, precioUnitario: 0 }]);
      return;
    }
    setItems((prev) => prev.filter((it) => it.id !== id));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

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

      // Limpiar borrador al guardar
      localStorage.removeItem(DRAFT_KEY);

      notificar({ tipo: "exito", mensaje: "Presupuesto creado con éxito." });
      router.push(`/presupuestos/${resOT.otId}`);
    });
  };

  const totalManoObra = items
    .filter((it) => it.tipo === "mano_obra" || it.tipo === "servicio")
    .reduce((acc, it) => acc + it.cantidad * it.precioUnitario, 0);

  const totalRepuestos = items
    .filter((it) => it.tipo === "repuesto" || it.tipo === "insumo" || it.tipo === "tercero")
    .reduce((acc, it) => acc + it.cantidad * it.precioUnitario, 0);

  const subtotal = totalManoObra + totalRepuestos;

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Header Back */}
      <div className="flex items-center justify-between">
        <Link
          href="/presupuestos"
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
        <p className="text-caption text-muted-foreground">Cotización</p>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">
          Nuevo Presupuesto
        </h1>
      </header>

      {errorMsg && (
        <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-xs font-bold text-red-600">
          {errorMsg}
        </div>
      )}

      {/* Bloque 1: Vehículo y Cliente */}
      <section className="space-y-4 rounded-2xl border border-border bg-card p-4 shadow-sm">
        <div className="flex items-center gap-2 border-b border-border pb-3">
          <Car className="h-4 w-4 text-accent" />
          <h2 className="text-sm font-bold text-foreground">Vehículo y Cliente</h2>
        </div>

        <PatenteInput
          value={patente}
          onChange={setPatente}
          formatoEspecial={formatoEspecial}
          onFormatoEspecialChange={setFormatoEspecial}
          onCedulaDetectada={(d) => {
            if (d.patente) setPatente(d.patente);
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

        <SelectorVehiculo marcas={marcas} valor={vehiculo} onChange={setVehiculo} />

        <div className="grid grid-cols-2 gap-3 pt-2">
          <div>
            <label className="text-caption text-muted-foreground">Cliente (Nombre)</label>
            <input
              type="text"
              placeholder="Ej: Marcelo"
              value={clienteNombre}
              onChange={(e) => setClienteNombre(e.target.value)}
              className="mt-1 min-h-11 w-full rounded-xl border border-border bg-muted px-3 text-xs font-medium text-foreground focus:border-accent focus:outline-none"
            />
          </div>

          <div>
            <label className="text-caption text-muted-foreground">WhatsApp</label>
            <input
              type="tel"
              placeholder="Ej: 11 3344 5566"
              value={clienteTelefono}
              onChange={(e) => setClienteTelefono(e.target.value)}
              className="mt-1 min-h-11 w-full rounded-xl border border-border bg-muted px-3 text-xs font-medium text-foreground focus:border-accent focus:outline-none"
            />
          </div>
        </div>
      </section>

      {/* Ficha Técnica (Guía si está seleccionada) */}
      {fichaAMostrar && (
        <section className="rounded-2xl border border-accent/20 bg-accent/5 p-4 space-y-3">
          <div className="flex items-center gap-2 text-accent">
            <Wrench className="h-4 w-4" />
            <h3 className="text-xs font-bold uppercase tracking-wider">Ficha Técnica Oficial del Vehículo</h3>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
            <div className="rounded-xl bg-card p-2 border border-border/50">
              <span className="text-[10px] text-muted-foreground block">Aceite Motor</span>
              <span className="font-semibold">{fichaAMostrar.aceite_viscosidad || "N/A"} ({fichaAMostrar.aceite_litros ? `${fichaAMostrar.aceite_litros} L` : "N/A"})</span>
            </div>
            <div className="rounded-xl bg-card p-2 border border-border/50">
              <span className="text-[10px] text-muted-foreground block">Filtro Aceite</span>
              <span className="font-semibold">{fichaAMostrar.filtro_aceite || "N/A"}</span>
            </div>
            <div className="rounded-xl bg-card p-2 border border-border/50">
              <span className="text-[10px] text-muted-foreground block">Filtro Aire</span>
              <span className="font-semibold">{fichaAMostrar.filtro_aire || "N/A"}</span>
            </div>
            <div className="rounded-xl bg-card p-2 border border-border/50">
              <span className="text-[10px] text-muted-foreground block">Filtro Combustible</span>
              <span className="font-semibold">{fichaAMostrar.filtro_combustible || "N/A"}</span>
            </div>
          </div>
        </section>
      )}

      {/* Bloque 2: Renglones del Presupuesto */}
      <section className="space-y-4 rounded-2xl border border-border bg-card p-4 shadow-sm">
        <div className="flex items-center justify-between border-b border-border pb-3">
          <div className="flex items-center gap-2">
            <FileText className="h-4 w-4 text-accent" />
            <h2 className="text-sm font-bold text-foreground">Renglones a Cotizar</h2>
          </div>
          <button
            type="button"
            onClick={handleAgregarItem}
            className="flex items-center gap-1 rounded-lg bg-muted px-2.5 py-1.5 text-xs font-semibold text-foreground hover:bg-muted/80"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>Agregar Renglón</span>
          </button>
        </div>

        <div className="space-y-3">
          {items.map((it) => (
            <div key={it.id} className="flex flex-col sm:flex-row gap-2 rounded-xl border border-border/70 bg-muted/40 p-3">
              <div className="sm:w-36">
                <label className="text-[10px] font-bold uppercase text-muted-foreground">Tipo</label>
                <select
                  value={it.tipo}
                  onChange={(e) => handleUpdateItem(it.id, "tipo", e.target.value)}
                  className="mt-0.5 w-full rounded-lg border border-border bg-card px-2 py-1.5 text-xs font-semibold text-foreground focus:border-accent focus:outline-none"
                >
                  <option value="mano_obra">Mano de Obra</option>
                  <option value="repuesto">Repuesto</option>
                  <option value="servicio">Servicio</option>
                  <option value="insumo">Insumo</option>
                  <option value="tercero">Tercero / Rectif.</option>
                </select>
              </div>

              <div className="flex-1">
                <label className="text-[10px] font-bold uppercase text-muted-foreground">Descripción</label>
                <input
                  type="text"
                  placeholder="Ej: Cambio de pastillas delanteras"
                  value={it.descripcion}
                  onChange={(e) => handleUpdateItem(it.id, "descripcion", e.target.value)}
                  className="mt-0.5 w-full rounded-lg border border-border bg-card px-2 py-1.5 text-xs text-foreground focus:border-accent focus:outline-none"
                />
              </div>

              <div className="flex gap-2">
                <div className="w-16">
                  <label className="text-[10px] font-bold uppercase text-muted-foreground">Cant.</label>
                  <input
                    type="number"
                    min="0.1"
                    step="any"
                    value={it.cantidad}
                    onChange={(e) => handleUpdateItem(it.id, "cantidad", Number(e.target.value))}
                    className="mt-0.5 w-full rounded-lg border border-border bg-card px-2 py-1.5 text-xs font-semibold text-foreground focus:border-accent focus:outline-none"
                  />
                </div>

                <div className="w-28">
                  <label className="text-[10px] font-bold uppercase text-muted-foreground">Precio ($)</label>
                  <input
                    type="number"
                    min="0"
                    placeholder="0"
                    value={it.precioUnitario || ""}
                    onChange={(e) => handleUpdateItem(it.id, "precioUnitario", Number(e.target.value))}
                    className="mt-0.5 w-full rounded-lg border border-border bg-card px-2 py-1.5 text-xs font-bold text-foreground focus:border-accent focus:outline-none"
                  />
                </div>

                <div className="flex items-end pb-0.5">
                  <button
                    type="button"
                    onClick={() => handleRemoveItem(it.id)}
                    className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground hover:bg-red-500/10 hover:text-red-500"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Resumen de totales */}
        <div className="space-y-1 rounded-xl bg-muted/60 p-3 text-xs border border-border/60">
          <div className="flex justify-between text-muted-foreground">
            <span>Mano de obra y servicios:</span>
            <span className="font-semibold text-foreground">${totalManoObra.toLocaleString("es-AR")}</span>
          </div>
          <div className="flex justify-between text-muted-foreground">
            <span>Repuestos e insumos:</span>
            <span className="font-semibold text-foreground">${totalRepuestos.toLocaleString("es-AR")}</span>
          </div>
          <div className="flex justify-between border-t border-border pt-1.5 text-sm font-bold text-foreground">
            <span>Total Presupuestado:</span>
            <span className="text-accent font-black text-base">${subtotal.toLocaleString("es-AR")}</span>
          </div>
        </div>

        <div>
          <label className="text-caption text-muted-foreground">Observaciones / Validez de la oferta</label>
          <textarea
            rows={2}
            value={descargo}
            onChange={(e) => setDescargo(e.target.value)}
            placeholder="Ej: Cotización válida por 7 días. Sujeto a disponibilidad de repuestos."
            className="mt-1 w-full resize-none rounded-xl border border-border bg-muted px-3 py-2 text-xs text-foreground focus:border-accent focus:outline-none"
          />
        </div>
      </section>

      <button
        type="submit"
        disabled={isPending || !patente.trim()}
        className="flex min-h-12 w-full items-center justify-center rounded-xl bg-accent text-sm font-bold text-white shadow-lg transition-transform active:scale-[0.98] disabled:opacity-50"
      >
        {isPending ? "Generando Presupuesto..." : "Guardar Presupuesto"}
      </button>
    </form>
  );
}
