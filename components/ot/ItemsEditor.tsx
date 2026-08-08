"use client";

import { Plus, Trash2 } from "lucide-react";
import { useState, useTransition } from "react";

import { agregarItemOT, eliminarItemOT } from "@/lib/actions/ot";

interface ItemTabla {
  id: string;
  tipo: string;
  descripcion: string;
  cantidad: number;
  precio_unitario: number;
  subtotal: number;
}

export function ItemsEditor({ otId, items: initialItems }: { otId: string; items: ItemTabla[] }) {
  const [items, setItems] = useState(initialItems);
  const [mostrarForm, setMostrarForm] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const [tipo, setTipo] = useState<"repuesto" | "mano_obra" | "servicio" | "insumo" | "tercero">("mano_obra");
  const [descripcion, setDescripcion] = useState("");
  const [cantidad, setCantidad] = useState("1");
  const [precio, setPrecio] = useState("");

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
        costoUnitario: 0,
        precioUnitario: numPrecio,
      });

      if (res.error) {
        setErrorMsg(res.error);
      } else {
        setDescripcion("");
        setPrecio("");
        setCantidad("1");
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
      {/* Lista de Ítems */}
      <div className="divide-y divide-border rounded-xl border border-border bg-card overflow-hidden shadow-sm">
        {items.length > 0 ? (
          items.map((it) => (
            <div key={it.id} className="flex items-center justify-between p-3 gap-3">
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-foreground truncate">{it.descripcion}</p>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <span className="capitalize px-1.5 py-0.5 rounded bg-muted font-medium">{it.tipo.replace("_", " ")}</span>
                  <span>{it.cantidad} x ${it.precio_unitario.toLocaleString("es-AR")}</span>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-sm font-bold text-foreground tabular">
                  $ {it.subtotal.toLocaleString("es-AR", { minimumFractionDigits: 2 })}
                </span>
                <button
                  type="button"
                  onClick={() => handleEliminar(it.id)}
                  disabled={isPending}
                  className="rounded-lg p-1.5 text-muted-foreground hover:bg-red-50 hover:text-red-600 transition-colors"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))
        ) : (
          <div className="p-6 text-center text-xs text-muted-foreground">
            No hay trabajos o repuestos cargados en esta orden.
          </div>
        )}

        {/* Footer Total */}
        <div className="flex items-center justify-between border-t border-border bg-muted/30 p-3">
          <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Total Calculado</span>
          <span className="text-lg font-black text-accent tabular">
            $ {totalCalculado.toLocaleString("es-AR", { minimumFractionDigits: 2 })}
          </span>
        </div>
      </div>

      {/* Botón / Formulario Agregar */}
      {!mostrarForm ? (
        <button
          type="button"
          onClick={() => setMostrarForm(true)}
          className="flex min-h-12 w-full items-center justify-center gap-2 rounded-xl border border-dashed border-border bg-card p-3 text-sm font-semibold text-accent hover:border-accent hover:bg-accent/5 transition-all active:scale-[0.99]"
        >
          <Plus className="h-4 w-4" />
          <span>Agregar trabajo o repuesto</span>
        </button>
      ) : (
        <form onSubmit={handleAgregar} className="space-y-3 rounded-xl border border-accent/40 bg-card p-4 shadow-md">
          <h4 className="text-xs font-bold uppercase tracking-wider text-accent">Nuevo Ítem</h4>

          {errorMsg && <p className="text-xs font-semibold text-red-600">{errorMsg}</p>}

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-caption text-muted-foreground">Tipo</label>
              <select
                value={tipo}
                onChange={(e) => setTipo(e.target.value as typeof tipo)}
                className="mt-1 min-h-10 w-full rounded-lg border border-border bg-muted px-2 text-xs font-medium text-foreground focus:border-accent focus:outline-none"
              >
                <option value="mano_obra">Mano de obra</option>
                <option value="repuesto">Repuesto</option>
                <option value="servicio">Servicio</option>
                <option value="insumo">Insumo</option>
                <option value="tercero">Tercero / Exterior</option>
              </select>
            </div>

            <div>
              <label className="text-caption text-muted-foreground">Cantidad</label>
              <input
                type="number"
                step="0.1"
                min="0.1"
                value={cantidad}
                onChange={(e) => setCantidad(e.target.value)}
                className="mt-1 min-h-10 w-full rounded-lg border border-border bg-muted px-3 text-xs font-medium text-foreground focus:border-accent focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="text-caption text-muted-foreground">Descripción</label>
            <input
              type="text"
              placeholder="Ej: Cambio de aceite 10w40 y filtro"
              value={descripcion}
              onChange={(e) => setDescripcion(e.target.value)}
              className="mt-1 min-h-10 w-full rounded-lg border border-border bg-muted px-3 text-xs font-medium text-foreground focus:border-accent focus:outline-none"
            />
          </div>

          <div>
            <label className="text-caption text-muted-foreground">Precio de venta ($)</label>
            <input
              type="number"
              step="1"
              min="0"
              placeholder="0.00"
              value={precio}
              onChange={(e) => setPrecio(e.target.value)}
              className="mt-1 min-h-10 w-full rounded-lg border border-border bg-muted px-3 text-xs font-medium text-foreground focus:border-accent focus:outline-none"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setMostrarForm(false)}
              className="min-h-10 rounded-lg px-3 text-xs font-semibold text-muted-foreground hover:bg-muted"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isPending}
              className="min-h-10 rounded-lg bg-accent px-4 text-xs font-semibold text-white shadow transition-transform active:scale-95 disabled:opacity-50"
            >
              {isPending ? "Guardando..." : "Guardar ítem"}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
