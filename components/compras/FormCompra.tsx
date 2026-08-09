"use client";

import { Plus, Trash2, Truck, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { useIsla } from "@/components/isla/IslaContext";
import { crearCompra, crearProveedor, type ProveedorListado } from "@/lib/actions/compras";

export interface OpcionProductoCompra {
  id: string;
  nombre: string;
  unidad: string;
  stock: number;
}

interface Linea {
  productoId: string;
  cantidad: string;
  costoUnitario: string;
}

const LINEA_VACIA: Linea = { productoId: "", cantidad: "1", costoUnitario: "" };

const money = (n: number) =>
  new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS", maximumFractionDigits: 0 }).format(n);

/** Hoy en formato YYYY-MM-DD y en hora local, no en UTC. */
function hoyLocal() {
  const d = new Date();
  const mes = String(d.getMonth() + 1).padStart(2, "0");
  const dia = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${mes}-${dia}`;
}

/**
 * Carga de un remito.
 *
 * El total no se pide: lo calcula el trigger de la base a partir de los ítems.
 * Lo que se muestra acá al pie es una previsualización de ese mismo cálculo —
 * si el taller ve un número distinto al guardado, el problema es de la
 * previsualización, no del dato.
 */
export function FormCompra({
  proveedores: proveedoresIniciales,
  productos,
}: {
  proveedores: ProveedorListado[];
  productos: OpcionProductoCompra[];
}) {
  const router = useRouter();
  const { notificar } = useIsla();
  const [abierto, setAbierto] = useState(false);
  const [pendiente, iniciar] = useTransition();

  const [proveedores, setProveedores] = useState(proveedoresIniciales);
  const [proveedorId, setProveedorId] = useState("");
  const [nuevoProveedor, setNuevoProveedor] = useState("");
  const [comprobante, setComprobante] = useState("");
  const [fecha, setFecha] = useState(hoyLocal);
  const [lineas, setLineas] = useState<Linea[]>([{ ...LINEA_VACIA }]);
  const [error, setError] = useState<string | null>(null);

  const total = lineas.reduce(
    (acc, l) => acc + (Number(l.cantidad) || 0) * (Number(l.costoUnitario) || 0),
    0,
  );

  const setLinea = (i: number, campo: keyof Linea, valor: string) =>
    setLineas((prev) => prev.map((l, j) => (j === i ? { ...l, [campo]: valor } : l)));

  function agregarProveedor() {
    const nombre = nuevoProveedor.trim();
    if (!nombre) return;
    iniciar(async () => {
      const res = await crearProveedor({ nombre });
      if (res.error || !res.id) {
        notificar({ tipo: "error", mensaje: res.error ?? "No se pudo guardar" });
        return;
      }
      setProveedores((prev) =>
        [...prev, { id: res.id!, nombre, telefono: null }].sort((a, b) =>
          a.nombre.localeCompare(b.nombre, "es"),
        ),
      );
      setProveedorId(res.id);
      setNuevoProveedor("");
    });
  }

  function guardar(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const items = lineas
      .filter((l) => l.productoId)
      .map((l) => ({
        productoId: l.productoId,
        cantidad: Number(l.cantidad),
        costoUnitario: Number(l.costoUnitario || 0),
      }));

    if (items.length === 0) {
      setError("Agregá al menos un producto al remito.");
      return;
    }

    iniciar(async () => {
      const res = await crearCompra({
        proveedorId: proveedorId || undefined,
        comprobante: comprobante.trim() || undefined,
        fecha,
        items,
      });
      if (res.error) {
        setError(res.error);
        return;
      }
      notificar({ tipo: "exito", mensaje: `Remito cargado — ${items.length} producto(s) al stock` });
      setAbierto(false);
      setLineas([{ ...LINEA_VACIA }]);
      setComprobante("");
      router.refresh();
    });
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setAbierto(true)}
        className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-accent px-4 text-xs font-bold text-white shadow-md transition-transform active:scale-95"
      >
        <Plus className="h-4 w-4" aria-hidden />
        <span>Cargar remito</span>
      </button>

      {abierto && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-900/60 sm:items-center sm:p-4">
          <div className="max-h-[92dvh] w-full overflow-y-auto rounded-t-2xl bg-card p-5 pb-[calc(var(--safe-bottom)+1.25rem)] shadow-2xl sm:max-w-2xl sm:rounded-2xl sm:pb-5">
            <div className="mb-4 flex items-center justify-between border-b border-border pb-3">
              <h3 className="flex items-center gap-2 text-base font-bold text-foreground">
                <Truck className="h-4 w-4 text-accent" aria-hidden />
                Cargar remito de proveedor
              </h3>
              <button
                type="button"
                onClick={() => setAbierto(false)}
                aria-label="Cerrar"
                className="grid h-9 w-9 place-items-center rounded-full text-muted-foreground hover:bg-muted"
              >
                <X className="h-5 w-5" aria-hidden />
              </button>
            </div>

            <form onSubmit={guardar} className="space-y-4">
              <div className="grid gap-3 sm:grid-cols-3">
                <div>
                  <label htmlFor="prov" className="text-caption text-muted-foreground">
                    Proveedor
                  </label>
                  <select
                    id="prov"
                    value={proveedorId}
                    onChange={(e) => setProveedorId(e.target.value)}
                    className="mt-1 min-h-11 w-full rounded-xl border border-border bg-muted px-3 text-sm text-foreground focus:border-accent focus:outline-none"
                  >
                    <option value="">Sin especificar</option>
                    {proveedores.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.nombre}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label htmlFor="comp" className="text-caption text-muted-foreground">
                    N° de remito o factura
                  </label>
                  <input
                    id="comp"
                    value={comprobante}
                    onChange={(e) => setComprobante(e.target.value)}
                    placeholder="Ej: 0001-00012345"
                    maxLength={40}
                    className="mt-1 min-h-11 w-full rounded-xl border border-border bg-muted px-3 text-sm text-foreground focus:border-accent focus:outline-none"
                  />
                </div>
                <div>
                  <label htmlFor="fecha" className="text-caption text-muted-foreground">
                    Fecha
                  </label>
                  <input
                    id="fecha"
                    type="date"
                    required
                    value={fecha}
                    onChange={(e) => setFecha(e.target.value)}
                    className="mt-1 min-h-11 w-full rounded-xl border border-border bg-muted px-3 text-sm text-foreground focus:border-accent focus:outline-none"
                  />
                </div>
              </div>

              {/* Alta rápida del proveedor sin salir del remito: el taller
                  compra en un lugar nuevo y no tiene por qué cancelar la carga
                  para darlo de alta en otra pantalla. */}
              <div className="flex gap-2">
                <input
                  value={nuevoProveedor}
                  onChange={(e) => setNuevoProveedor(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      agregarProveedor();
                    }
                  }}
                  placeholder="…o escribí un proveedor nuevo"
                  maxLength={80}
                  aria-label="Nombre de un proveedor nuevo"
                  className="min-h-10 flex-1 rounded-xl border border-dashed border-border bg-card px-3 text-xs text-foreground focus:border-accent focus:outline-none"
                />
                <button
                  type="button"
                  onClick={agregarProveedor}
                  disabled={pendiente || !nuevoProveedor.trim()}
                  className="min-h-10 shrink-0 rounded-xl bg-muted px-3 text-xs font-bold text-foreground active:scale-95 disabled:opacity-50"
                >
                  Agregar
                </button>
              </div>

              <div className="space-y-2">
                <p className="text-caption font-semibold uppercase tracking-wider text-muted-foreground">
                  Productos del remito
                </p>

                {lineas.map((l, i) => (
                  <div key={i} className="grid grid-cols-[1fr_4.5rem_6rem_2.25rem] gap-2">
                    <select
                      value={l.productoId}
                      onChange={(e) => setLinea(i, "productoId", e.target.value)}
                      aria-label={`Producto de la línea ${i + 1}`}
                      className="min-h-11 w-full rounded-xl border border-border bg-muted px-2 text-xs text-foreground focus:border-accent focus:outline-none"
                    >
                      <option value="">Elegir producto…</option>
                      {productos.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.nombre} ({p.stock} {p.unidad})
                        </option>
                      ))}
                    </select>
                    <input
                      type="number"
                      step="0.001"
                      min="0.001"
                      value={l.cantidad}
                      onChange={(e) => setLinea(i, "cantidad", e.target.value)}
                      aria-label={`Cantidad de la línea ${i + 1}`}
                      className="min-h-11 w-full rounded-xl border border-border bg-muted px-2 text-xs text-foreground focus:border-accent focus:outline-none"
                    />
                    <input
                      type="number"
                      step="1"
                      min="0"
                      placeholder="Costo $"
                      value={l.costoUnitario}
                      onChange={(e) => setLinea(i, "costoUnitario", e.target.value)}
                      aria-label={`Costo unitario de la línea ${i + 1}`}
                      className="min-h-11 w-full rounded-xl border border-border bg-muted px-2 text-xs text-foreground focus:border-accent focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => setLineas((prev) => prev.filter((_, j) => j !== i))}
                      disabled={lineas.length === 1}
                      aria-label={`Quitar la línea ${i + 1}`}
                      className="grid min-h-11 place-items-center rounded-xl text-muted-foreground hover:bg-destructive/10 hover:text-destructive disabled:opacity-30"
                    >
                      <Trash2 className="h-4 w-4" aria-hidden />
                    </button>
                  </div>
                ))}

                <button
                  type="button"
                  onClick={() => setLineas((prev) => [...prev, { ...LINEA_VACIA }])}
                  className="flex min-h-10 w-full items-center justify-center gap-1.5 rounded-xl border border-dashed border-border text-xs font-semibold text-accent hover:bg-accent/5"
                >
                  <Plus className="h-3.5 w-3.5" aria-hidden />
                  Otra línea
                </button>
              </div>

              {productos.length === 0 && (
                <p className="rounded-xl bg-amber-50 px-3 py-2 text-caption text-amber-800">
                  No hay productos cargados todavía. Creá el producto en Stock y volvé.
                </p>
              )}

              {error && (
                <p role="alert" className="text-caption font-semibold text-destructive">
                  {error}
                </p>
              )}

              <div className="flex items-center justify-between border-t border-border pt-3">
                <span className="text-caption uppercase tracking-wider text-muted-foreground">
                  Total del remito
                </span>
                <span className="tabular text-lg font-black text-accent">{money(total)}</span>
              </div>

              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setAbierto(false)}
                  className="min-h-11 rounded-xl px-4 text-xs font-semibold text-muted-foreground hover:bg-muted"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={pendiente}
                  className="min-h-11 rounded-xl bg-accent px-5 text-xs font-bold text-white shadow active:scale-95 disabled:opacity-50"
                >
                  {pendiente ? "Cargando…" : "Cargar al stock"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
