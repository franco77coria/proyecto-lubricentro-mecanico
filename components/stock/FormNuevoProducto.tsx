"use client";

import { Plus, X } from "lucide-react";
import { useState, useTransition } from "react";

import { crearProducto } from "@/lib/actions/stock";

export function FormNuevoProducto() {
  const [modalAbierto, setModalAbierto] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const [nombre, setNombre] = useState("");
  const [marca, setMarca] = useState("");
  const [categoria, setCategoria] = useState("");
  const [unidad, setUnidad] = useState("unid");
  const [precioVenta, setPrecioVenta] = useState("");
  const [costoUnitario, setCostoUnitario] = useState("");
  const [stockInicial, setStockInicial] = useState("");
  const [stockMin, setStockMin] = useState("5");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    startTransition(async () => {
      const res = await crearProducto({
        nombre: nombre.trim(),
        marca: marca.trim() || undefined,
        categoria: categoria.trim() || undefined,
        unidad,
        precioVenta: precioVenta ? Number(precioVenta) : 0,
        costoUnitario: costoUnitario ? Number(costoUnitario) : 0,
        stockInicial: stockInicial ? Number(stockInicial) : 0,
        stockMin: stockMin ? Number(stockMin) : 0,
      });

      if (res.error) {
        setErrorMsg(res.error);
      } else {
        setNombre("");
        setMarca("");
        setCategoria("");
        setPrecioVenta("");
        setCostoUnitario("");
        setStockInicial("");
        setModalAbierto(false);
      }
    });
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setModalAbierto(true)}
        className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-accent px-4 text-xs font-bold text-white shadow-md transition-transform active:scale-95"
      >
        <Plus className="h-4 w-4" />
        <span>Nuevo Producto</span>
      </button>

      {modalAbierto && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl bg-card p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <h3 className="text-base font-bold text-foreground">Agregar Producto a Stock</h3>
              <button
                type="button"
                onClick={() => setModalAbierto(false)}
                className="rounded-lg p-1 text-muted-foreground hover:bg-muted"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {errorMsg && <p className="text-xs font-bold text-red-600">{errorMsg}</p>}

            <form onSubmit={handleSubmit} className="space-y-3">
              <div>
                <label className="text-caption text-muted-foreground">Nombre del Producto *</label>
                <input
                  type="text"
                  placeholder="Ej: Aceite Elaion F50 5W-40 4L"
                  required
                  value={nombre}
                  onChange={(e) => setNombre(e.target.value)}
                  className="mt-1 min-h-10 w-full rounded-xl border border-border bg-muted px-3 text-xs text-foreground focus:border-accent focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-caption text-muted-foreground">Marca</label>
                  <input
                    type="text"
                    placeholder="Ej: YPF / Mann"
                    value={marca}
                    onChange={(e) => setMarca(e.target.value)}
                    className="mt-1 min-h-10 w-full rounded-xl border border-border bg-muted px-3 text-xs text-foreground focus:border-accent focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-caption text-muted-foreground">Categoría</label>
                  <input
                    type="text"
                    placeholder="Ej: Aceites / Filtros"
                    value={categoria}
                    onChange={(e) => setCategoria(e.target.value)}
                    className="mt-1 min-h-10 w-full rounded-xl border border-border bg-muted px-3 text-xs text-foreground focus:border-accent focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-caption text-muted-foreground">Precio Venta ($)</label>
                  <input
                    type="number"
                    step="1"
                    placeholder="0.00"
                    value={precioVenta}
                    onChange={(e) => setPrecioVenta(e.target.value)}
                    className="mt-1 min-h-10 w-full rounded-xl border border-border bg-muted px-3 text-xs text-foreground focus:border-accent focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-caption text-muted-foreground">Costo Unitario ($)</label>
                  <input
                    type="number"
                    step="1"
                    placeholder="0.00"
                    value={costoUnitario}
                    onChange={(e) => setCostoUnitario(e.target.value)}
                    className="mt-1 min-h-10 w-full rounded-xl border border-border bg-muted px-3 text-xs text-foreground focus:border-accent focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-caption text-muted-foreground">Stock Inicial</label>
                  <input
                    type="number"
                    step="1"
                    placeholder="0"
                    value={stockInicial}
                    onChange={(e) => setStockInicial(e.target.value)}
                    className="mt-1 min-h-10 w-full rounded-xl border border-border bg-muted px-3 text-xs text-foreground focus:border-accent focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-caption text-muted-foreground">Stock Mínimo</label>
                  <input
                    type="number"
                    step="1"
                    placeholder="5"
                    value={stockMin}
                    onChange={(e) => setStockMin(e.target.value)}
                    className="mt-1 min-h-10 w-full rounded-xl border border-border bg-muted px-3 text-xs text-foreground focus:border-accent focus:outline-none"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-border">
                <button
                  type="button"
                  onClick={() => setModalAbierto(false)}
                  className="min-h-10 rounded-xl px-4 text-xs font-semibold text-muted-foreground hover:bg-muted"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isPending}
                  className="min-h-10 rounded-xl bg-accent px-5 text-xs font-bold text-white shadow transition-transform active:scale-95 disabled:opacity-50"
                >
                  {isPending ? "Guardando..." : "Guardar Producto"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
