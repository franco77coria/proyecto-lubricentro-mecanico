"use client";

import { Plus, Trash2, Droplets, Wrench, CheckCircle, Package } from "lucide-react";
import { useState, useTransition } from "react";

import { agregarItemOT, eliminarItemOT } from "@/lib/actions/ot";
import { useFormato } from "@/lib/i18n/I18nContext";

interface ItemTabla {
  id: string;
  tipo: string;
  descripcion: string;
  cantidad: number;
  precio_unitario: number;
  subtotal: number;
}

export interface OpcionServicio {
  id: string;
  nombre: string;
  precioManoObra: number;
}

export interface OpcionProducto {
  id: string;
  nombre: string;
  precioVenta: number;
  stock: number;
  unidad: string;
}

type TipoItem = "repuesto" | "mano_obra" | "servicio" | "insumo" | "tercero";

const TIPOS_CON_STOCK: TipoItem[] = ["repuesto", "insumo"];
const TIPOS_CON_SERVICIO: TipoItem[] = ["mano_obra", "servicio"];

export function ItemsEditor({
  otId,
  items: initialItems,
  servicios = [],
  productos = [],
}: {
  otId: string;
  items: ItemTabla[];
  servicios?: OpcionServicio[];
  productos?: OpcionProducto[];
}) {
  const { money } = useFormato();
  const [items, setItems] = useState(initialItems);
  const [mostrarForm, setMostrarForm] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const [tipo, setTipo] = useState<TipoItem>("repuesto");
  const [descripcion, setDescripcion] = useState("");
  const [cantidad, setCantidad] = useState("1");
  const [precio, setPrecio] = useState("");
  const [productoId, setProductoId] = useState("");
  const [servicioId, setServicioId] = useState("");

  const usaStock = TIPOS_CON_STOCK.includes(tipo);
  const usaServicio = TIPOS_CON_SERVICIO.includes(tipo);

  const productoSeleccionado = productos.find((p) => p.id === productoId);

  const handleTipo = (nuevo: TipoItem) => {
    setTipo(nuevo);
    setProductoId("");
    setServicioId("");
  };

  const handleServicio = (id: string) => {
    setServicioId(id);
    const s = servicios.find((x) => x.id === id);
    if (!s) return;
    setDescripcion(s.nombre);
    setPrecio(String(s.precioManoObra));
  };

  const handleProducto = (id: string) => {
    setProductoId(id);
    const p = productos.find((x) => x.id === id);
    if (!p) return;
    setDescripcion(p.nombre);
    setPrecio(String(p.precioVenta));
  };

  // Stepper rápido para fosa (ej: 4L, 7.5L, +1L)
  const sumarCantidad = (sumar: number) => {
    const actual = Number(cantidad) || 0;
    const nuevo = Math.max(0.1, actual + sumar);
    setCantidad(nuevo % 1 === 0 ? String(nuevo) : nuevo.toFixed(1));
  };

  const setearPreset = (cant: number) => {
    setCantidad(String(cant));
  };

  const handleAgregar = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    const numCant = Number(cantidad);
    const numPrecio = Number(precio);

    if (!descripcion.trim()) {
      setErrorMsg("Escribí una descripción.");
      return;
    }
    if (isNaN(numCant) || numCant <= 0) {
      setErrorMsg("Cantidad inválida.");
      return;
    }
    if (isNaN(numPrecio) || numPrecio < 0) {
      setErrorMsg("Precio inválido.");
      return;
    }

    startTransition(async () => {
      const res = await agregarItemOT(otId, {
        tipo,
        descripcion: descripcion.trim(),
        cantidad: numCant,
        precioUnitario: numPrecio,
        productoId: usaStock ? productoId || undefined : undefined,
        servicioId: usaServicio ? servicioId || undefined : undefined,
      });

      if (res.error) {
        setErrorMsg(res.error);
      } else {
        setDescripcion("");
        setPrecio("");
        setCantidad("1");
        setProductoId("");
        setServicioId("");
        setMostrarForm(false);
      }
    });
  };

  const handleEliminar = (itemId: string) => {
    setItems((prev) => prev.filter((it) => it.id !== itemId));
    startTransition(async () => {
      await eliminarItemOT(otId, itemId);
    });
  };

  const totalCalculado = items.reduce((acc, it) => acc + (it.subtotal || 0), 0);

  return (
    <div className="space-y-4">
      {/* Lista de Ítems Cargados */}
      <div className="divide-y divide-border/70 rounded-3xl border border-border/80 bg-card overflow-hidden shadow-sm">
        {items.length > 0 ? (
          items.map((it) => (
            <div key={it.id} className="flex items-center justify-between p-4 gap-3 hover:bg-muted/20 transition-colors">
              <div className="min-w-0 flex-1">
                <p className="text-sm font-black text-foreground truncate">{it.descripcion}</p>
                <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
                  <span className="capitalize px-2 py-0.5 rounded-md bg-muted font-bold text-[10px] uppercase tracking-wider">
                    {it.tipo.replace("_", " ")}
                  </span>
                  <span className="font-mono">
                    {it.cantidad} × {money(it.precio_unitario)}
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <span className="text-base font-black text-foreground tabular-nums">
                  {money(it.subtotal)}
                </span>
                <button
                  type="button"
                  onClick={() => handleEliminar(it.id)}
                  disabled={isPending}
                  aria-label={`Eliminar ${it.descripcion}`}
                  className="grid min-h-11 min-w-11 place-items-center rounded-xl text-muted-foreground hover:bg-rose-500/10 hover:text-rose-500 transition-colors active:scale-90"
                >
                  <Trash2 className="h-4.5 w-4.5" />
                </button>
              </div>
            </div>
          ))
        ) : (
          <div className="p-8 text-center text-xs text-muted-foreground font-medium">
            No hay trabajos o repuestos cargados en esta orden.
          </div>
        )}

        {/* Footer Total */}
        <div className="flex items-center justify-between border-t border-border/80 bg-muted/30 p-4">
          <span className="text-xs font-black uppercase tracking-wider text-muted-foreground">
            Total Calculado
          </span>
          <span className="text-xl font-black text-accent tabular-nums">
            {money(totalCalculado)}
          </span>
        </div>
      </div>

      {/* Botón o Formulario de Carga Ágil */}
      {!mostrarForm ? (
        <button
          type="button"
          onClick={() => setMostrarForm(true)}
          className="flex min-h-14 w-full items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-accent/40 bg-card p-4 text-sm font-black text-accent hover:border-accent hover:bg-accent/5 transition-all active:scale-[0.99] shadow-sm"
        >
          <Plus className="h-5 w-5 stroke-[3]" />
          <span>Cargar repuesto, aceite o mano de obra</span>
        </button>
      ) : (
        <form onSubmit={handleAgregar} className="space-y-4 rounded-3xl border border-accent/40 bg-card p-5 sm:p-6 shadow-xl">
          <div className="flex items-center justify-between border-b border-border/60 pb-3">
            <h4 className="text-xs font-black uppercase tracking-wider text-accent flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Nuevo ítem en fosa
            </h4>
            <span className="text-[10px] text-muted-foreground font-semibold">
              Carga optimizada para pantalla táctil
            </span>
          </div>

          {errorMsg && (
            <div className="rounded-xl bg-rose-500/10 border border-rose-500/20 p-3 text-xs font-bold text-rose-400">
              {errorMsg}
            </div>
          )}

          {/* Selector de Tipo (Botones grandes táctiles) */}
          <div>
            <label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground block mb-2">
              Tipo de Carga:
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {(
                [
                  { id: "repuesto", label: "Repuesto / Aceite", icon: Droplets },
                  { id: "mano_obra", label: "Mano de Obra", icon: Wrench },
                  { id: "servicio", label: "Servicio Catálogo", icon: CheckCircle },
                  { id: "insumo", label: "Insumo / Taller", icon: Package },
                ] as const
              ).map((t) => {
                const isSelected = tipo === t.id;
                const Icon = t.icon;
                return (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => handleTipo(t.id)}
                    className={`min-h-12 px-3 rounded-xl border flex items-center justify-center gap-2 text-xs font-black transition-all ${
                      isSelected
                        ? "bg-accent text-white border-accent shadow-md shadow-orange-500/20"
                        : "bg-muted/40 border-border/80 text-foreground hover:bg-muted"
                    }`}
                  >
                    <Icon className="h-4 w-4 shrink-0" />
                    <span>{t.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Selector de Catálogo o Stock */}
          {usaStock && (
            <div className="space-y-1.5">
              <label htmlFor="producto-select" className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                Producto / Fluido del Depósito
              </label>
              <select
                id="producto-select"
                value={productoId}
                onChange={(e) => handleProducto(e.target.value)}
                className="min-h-12 w-full rounded-xl border border-border bg-background px-3 text-xs font-bold text-foreground focus:border-accent focus:outline-none"
              >
                <option value="">Seleccionar del stock (o escribir a mano abajo)…</option>
                {productos.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.nombre} — Stock: {p.stock} {p.unidad} ({money(p.precioVenta)})
                  </option>
                ))}
              </select>
              {productoSeleccionado && (
                <p className="text-[11px] font-semibold text-emerald-400 mt-1">
                  ✓ Descontará {cantidad || "0"} {productoSeleccionado.unidad} del stock (quedan {Number(productoSeleccionado.stock) - (Number(cantidad) || 0)} {productoSeleccionado.unidad})
                </p>
              )}
            </div>
          )}

          {usaServicio && servicios.length > 0 && (
            <div className="space-y-1.5">
              <label htmlFor="servicio-select" className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                Servicio preconfigurado
              </label>
              <select
                id="servicio-select"
                value={servicioId}
                onChange={(e) => handleServicio(e.target.value)}
                className="min-h-12 w-full rounded-xl border border-border bg-background px-3 text-xs font-bold text-foreground focus:border-accent focus:outline-none"
              >
                <option value="">Elegir servicio del catálogo…</option>
                {servicios.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.nombre} — {money(s.precioManoObra)}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Descripción */}
          <div className="space-y-1.5">
            <label htmlFor="item-desc" className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
              Descripción del Ítem
            </label>
            <input
              id="item-desc"
              type="text"
              placeholder="Ej: Aceite Sintético 5W-30 o Cambio de Pastillas"
              value={descripcion}
              onChange={(e) => setDescripcion(e.target.value)}
              className="min-h-12 w-full rounded-xl border border-border bg-background px-4 text-xs font-bold text-foreground focus:border-accent focus:outline-none"
            />
          </div>

          {/* Cantidad con Botones Rápidos de Fosa */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label htmlFor="item-cant" className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                Cantidad (Litros o Unidades)
              </label>
              {/* Presets Rápidos de Fosa */}
              <div className="flex items-center gap-1">
                {[1, 3.5, 4, 7.5, 8].map((preset) => (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => setearPreset(preset)}
                    className="px-2 py-1 rounded-lg bg-muted text-[10px] font-mono font-bold hover:bg-accent hover:text-white transition-colors"
                  >
                    {preset}L
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => sumarCantidad(-1)}
                className="min-h-12 min-w-12 rounded-xl bg-muted border border-border font-black text-sm hover:bg-muted/80 active:scale-95 transition-transform"
              >
                -1
              </button>
              <input
                id="item-cant"
                type="number"
                step="0.1"
                min="0.1"
                value={cantidad}
                onChange={(e) => setCantidad(e.target.value)}
                className="min-h-12 flex-1 rounded-xl border border-border bg-background px-4 text-center font-mono text-base font-black text-foreground focus:border-accent focus:outline-none"
              />
              <button
                type="button"
                onClick={() => sumarCantidad(1)}
                className="min-h-12 min-w-12 rounded-xl bg-muted border border-border font-black text-sm hover:bg-muted/80 active:scale-95 transition-transform"
              >
                +1
              </button>
              <button
                type="button"
                onClick={() => sumarCantidad(0.5)}
                className="min-h-12 px-3 rounded-xl bg-muted border border-border font-black text-xs hover:bg-muted/80 active:scale-95 transition-transform"
              >
                +0.5L
              </button>
            </div>
          </div>

          {/* Precio Unitario */}
          <div className="space-y-1.5">
            <label htmlFor="item-precio" className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
              Precio Unitario de Venta ($)
            </label>
            <input
              id="item-precio"
              type="number"
              step="1"
              min="0"
              placeholder="0.00"
              value={precio}
              onChange={(e) => setPrecio(e.target.value)}
              className="min-h-12 w-full rounded-xl border border-border bg-background px-4 font-mono text-sm font-black text-foreground focus:border-accent focus:outline-none"
            />
          </div>

          {/* Botones de Acción */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-border/60">
            <button
              type="button"
              onClick={() => setMostrarForm(false)}
              className="min-h-12 px-5 rounded-xl text-xs font-bold text-muted-foreground hover:bg-muted transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isPending}
              className="min-h-12 px-6 rounded-xl bg-accent text-xs font-black text-white shadow-lg shadow-orange-500/20 active:scale-95 disabled:opacity-50 hover:brightness-110 transition-all"
            >
              {isPending ? "Guardando..." : "Guardar ítem en fosa"}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
