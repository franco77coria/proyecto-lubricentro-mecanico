"use client";

import { Plus, ScanBarcode } from "lucide-react";
import { useState, useTransition } from "react";

import { LectorCodigo } from "@/components/campos/LectorCodigo";
import { Sheet } from "@/components/sheet/Sheet";
import { FORMATOS_PRODUCTO } from "@/lib/codigo";
import { crearProducto } from "@/lib/actions/stock";

export function FormNuevoProducto() {
  const [modalAbierto, setModalAbierto] = useState(false);
  const [escaneando, setEscaneando] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const [codigoBarras, setCodigoBarras] = useState("");
  const [nombre, setNombre] = useState("");
  const [marca, setMarca] = useState("");
  const [categoria, setCategoria] = useState("");
  const [unidad, setUnidad] = useState("unidad");
  const [precioVenta, setPrecioVenta] = useState("");
  const [costoUnitario, setCostoUnitario] = useState("");
  const [stockInicial, setStockInicial] = useState("");
  const [stockMin, setStockMin] = useState("5");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    startTransition(async () => {
      const res = await crearProducto({
        codigoBarras: codigoBarras.trim() || undefined,
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
        setCodigoBarras("");
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
      {escaneando && (
        <LectorCodigo
          titulo="Escanear código de barras"
          ayuda="Apuntá al código del bidón o de la caja del filtro."
          formatos={FORMATOS_PRODUCTO}
          onLeido={(codigo) => {
            setCodigoBarras(codigo);
            setEscaneando(false);
          }}
          onCerrar={() => setEscaneando(false)}
        />
      )}

      <button
        type="button"
        onClick={() => setModalAbierto(true)}
        className="inline-flex min-h-12 items-center gap-2 rounded-2xl bg-accent px-5 text-sm font-bold text-white shadow-md transition-transform active:scale-95 hover:brightness-110"
      >
        <Plus className="h-5 w-5" />
        <span>Nuevo Producto</span>
      </button>

      <Sheet
        abierto={modalAbierto}
        onCerrar={() => setModalAbierto(false)}
        titulo="Agregar Producto a Stock"
      >
        <form onSubmit={handleSubmit} className="space-y-4 p-5">
          {errorMsg && (
            <p className="rounded-xl bg-red-500/15 border border-red-500/30 p-3 text-xs font-bold text-red-400">
              {errorMsg}
            </p>
          )}

          {/* Código de barras con escáner */}
          <div>
            <label htmlFor="codigo-barras" className="text-caption font-semibold text-muted-foreground block mb-1">
              Código de barras
            </label>
            <div className="flex gap-2">
              <input
                id="codigo-barras"
                type="text"
                inputMode="numeric"
                placeholder="Escaneá o tipeá el código"
                value={codigoBarras}
                onChange={(e) => setCodigoBarras(e.target.value)}
                className="min-h-12 flex-1 rounded-xl border border-border bg-card px-3.5 text-base text-foreground focus:border-accent focus:outline-none"
              />
              <button
                type="button"
                onClick={() => setEscaneando(true)}
                aria-label="Escanear el código de barras"
                className="grid min-h-12 w-12 shrink-0 place-items-center rounded-xl bg-accent/15 text-accent border border-accent/30 transition-transform active:scale-95"
              >
                <ScanBarcode className="h-5 w-5" aria-hidden />
              </button>
            </div>
          </div>

          <div>
            <label className="text-caption font-semibold text-muted-foreground block mb-1">
              Nombre del Producto *
            </label>
            <input
              type="text"
              placeholder="Ej: Aceite Elaion F50 5W-40 4L"
              required
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              className="min-h-12 w-full rounded-xl border border-border bg-card px-3.5 text-base text-foreground focus:border-accent focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-caption font-semibold text-muted-foreground block mb-1">Marca</label>
              <input
                type="text"
                placeholder="Ej: YPF / Mann / Motul"
                value={marca}
                onChange={(e) => setMarca(e.target.value)}
                className="min-h-12 w-full rounded-xl border border-border bg-card px-3.5 text-base text-foreground focus:border-accent focus:outline-none"
              />
            </div>
            <div>
              <label className="text-caption font-semibold text-muted-foreground block mb-1">Categoría</label>
              <input
                type="text"
                placeholder="Ej: Aceites / Filtros / Frenos"
                value={categoria}
                onChange={(e) => setCategoria(e.target.value)}
                className="min-h-12 w-full rounded-xl border border-border bg-card px-3.5 text-base text-foreground focus:border-accent focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label htmlFor="unidad-producto" className="text-caption font-semibold text-muted-foreground block mb-1">
              Unidad de Medida
            </label>
            <select
              id="unidad-producto"
              value={unidad}
              onChange={(e) => setUnidad(e.target.value)}
              className="min-h-12 w-full rounded-xl border border-border bg-card px-3.5 text-base font-semibold text-foreground focus:border-accent focus:outline-none"
            >
              <option value="unidad">Unidades (Bidón / Caja / Pieza)</option>
              <option value="litro">Litros (Aceite a granel / Tambor)</option>
              <option value="kg">Kilos (Grasa / Aditivos)</option>
              <option value="juego">Juego (Pastillas / Bujías)</option>
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-caption font-semibold text-muted-foreground block mb-1">Precio Venta ($)</label>
              <input
                type="number"
                step="1"
                placeholder="0"
                value={precioVenta}
                onChange={(e) => setPrecioVenta(e.target.value)}
                className="min-h-12 w-full rounded-xl border border-border bg-card px-3.5 text-base font-black text-foreground focus:border-accent focus:outline-none"
              />
            </div>
            <div>
              <label className="text-caption font-semibold text-muted-foreground block mb-1">Costo Unitario ($)</label>
              <input
                type="number"
                step="1"
                placeholder="0"
                value={costoUnitario}
                onChange={(e) => setCostoUnitario(e.target.value)}
                className="min-h-12 w-full rounded-xl border border-border bg-card px-3.5 text-base text-foreground focus:border-accent focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-caption font-semibold text-muted-foreground block mb-1">Stock Inicial</label>
              <input
                type="number"
                step="1"
                placeholder="0"
                value={stockInicial}
                onChange={(e) => setStockInicial(e.target.value)}
                className="min-h-12 w-full rounded-xl border border-border bg-card px-3.5 text-base text-foreground focus:border-accent focus:outline-none"
              />
            </div>
            <div>
              <label className="text-caption font-semibold text-muted-foreground block mb-1">Stock Mínimo (Alerta)</label>
              <input
                type="number"
                step="1"
                placeholder="5"
                value={stockMin}
                onChange={(e) => setStockMin(e.target.value)}
                className="min-h-12 w-full rounded-xl border border-border bg-card px-3.5 text-base text-foreground focus:border-accent focus:outline-none"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isPending}
            className="min-h-12 w-full rounded-2xl bg-accent text-base font-bold text-white shadow-md transition-transform active:scale-95 disabled:opacity-50 mt-2"
          >
            {isPending ? "Guardando..." : "Guardar Producto en Stock"}
          </button>
        </form>
      </Sheet>
    </>
  );
}
