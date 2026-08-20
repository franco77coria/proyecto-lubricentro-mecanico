"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ArrowDownToLine, ClipboardList, History, Pencil, Trash2, X } from "lucide-react";

import { useIsla } from "@/components/isla/IslaContext";
import {
  ajustarStock,
  historialProducto,
  ingresarStock,
  type MovimientoHistorial,
} from "@/lib/actions/movimientos";
import { editarProducto, eliminarProducto } from "@/lib/actions/stock";
import { useFormato } from "@/lib/i18n/I18nContext";

const ETIQUETA_TIPO: Record<string, string> = {
  compra: "Ingreso",
  consumo: "Usado en OT",
  ajuste: "Ajuste",
  devolucion: "Devolución",
  inicial: "Carga inicial",
};

/**
 * Mover el stock de un producto.
 *
 * Antes el stock solo podía bajar: se descontaba al cargar repuestos en una
 * orden pero no había forma de reponerlo salvo borrando y recreando el
 * producto. Con esto entra mercadería y se corrige por conteo físico.
 */
export function AccionesProducto({
  productoId,
  nombre,
  stock,
  unidad,
  precioVenta,
  marca,
}: {
  productoId: string;
  nombre: string;
  stock: number;
  unidad: string;
  precioVenta?: number;
  marca?: string;
}) {
  const { locale } = useFormato();
  const router = useRouter();
  const { notificar } = useIsla();
  const [abierto, setAbierto] = useState<"ingreso" | "ajuste" | "historial" | "editar" | "eliminar" | null>(null);

  // Editar fields
  const [editNombre, setEditNombre] = useState(nombre);
  const [editMarca, setEditMarca] = useState(marca || "");
  const [editPrecio, setEditPrecio] = useState(String(precioVenta || 0));
  const [pendiente, iniciar] = useTransition();
  const [historial, setHistorial] = useState<MovimientoHistorial[] | null>(null);

  const [cantidad, setCantidad] = useState("");
  const [costo, setCosto] = useState("");
  const [comprobante, setComprobante] = useState("");
  const [stockReal, setStockReal] = useState("");

  function cerrar() {
    setAbierto(null);
    setCantidad("");
    setCosto("");
    setComprobante("");
    setStockReal("");
    setHistorial(null);
  }

  function abrirHistorial() {
    setAbierto("historial");
    iniciar(async () => setHistorial(await historialProducto(productoId)));
  }

  function guardarIngreso(e: React.FormEvent) {
    e.preventDefault();
    iniciar(async () => {
      const res = await ingresarStock({
        productoId,
        cantidad: Number(cantidad),
        costoUnitario: Number(costo || 0),
        comprobante,
      });
      if (res.error) return notificar({ tipo: "error", mensaje: res.error });
      notificar({ tipo: "exito", mensaje: `${nombre}: ahora hay ${res.stockNuevo} ${unidad}` });
      cerrar();
      router.refresh();
    });
  }

  function guardarAjuste(e: React.FormEvent) {
    e.preventDefault();
    iniciar(async () => {
      const res = await ajustarStock({ productoId, stockReal: Number(stockReal) });
      if (res.error) return notificar({ tipo: "error", mensaje: res.error });
      notificar({ tipo: "exito", mensaje: `${nombre}: ajustado a ${res.stockNuevo} ${unidad}` });
      cerrar();
      router.refresh();
    });
  }

  function guardarEdicion(e: React.FormEvent) {
    e.preventDefault();
    iniciar(async () => {
      const res = await editarProducto(productoId, {
        nombre: editNombre,
        marca: editMarca || undefined,
        precioVenta: Number(editPrecio),
      });
      if (res.error) return notificar({ tipo: "error", mensaje: res.error });
      notificar({ tipo: "exito", mensaje: `${editNombre} actualizado` });
      cerrar();
      router.refresh();
    });
  }

  function confirmarEliminar() {
    iniciar(async () => {
      const res = await eliminarProducto(productoId);
      if (res.error) return notificar({ tipo: "error", mensaje: res.error });
      notificar({ tipo: "exito", mensaje: `${nombre} eliminado del inventario` });
      cerrar();
      router.refresh();
    });
  }

  return (
    <>
      <div className="flex shrink-0 gap-1">
        <BotonIcono etiqueta="Ingresar stock" onClick={() => setAbierto("ingreso")}>
          <ArrowDownToLine className="h-4 w-4" aria-hidden />
        </BotonIcono>
        <BotonIcono etiqueta="Ajustar por conteo" onClick={() => setAbierto("ajuste")}>
          <ClipboardList className="h-4 w-4" aria-hidden />
        </BotonIcono>
        <BotonIcono etiqueta="Ver movimientos" onClick={abrirHistorial}>
          <History className="h-4 w-4" aria-hidden />
        </BotonIcono>
        <BotonIcono etiqueta="Editar producto" onClick={() => setAbierto("editar")}>
          <Pencil className="h-4 w-4" aria-hidden />
        </BotonIcono>
        <BotonIcono etiqueta="Eliminar producto" onClick={() => setAbierto("eliminar")}>
          <Trash2 className="h-4 w-4" aria-hidden />
        </BotonIcono>
      </div>

      {abierto && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-slate-900/50 p-0 sm:items-center sm:p-4"
          role="dialog"
          aria-modal="true"
          aria-label={nombre}
        >
          <div className="max-h-[85dvh] w-full overflow-y-auto rounded-t-[var(--radius-lg)] bg-card p-5 pb-[calc(var(--safe-bottom)+1.25rem)] shadow-[var(--sombra-alta)] sm:max-w-md sm:rounded-[var(--radius-lg)] sm:pb-5">
            <div className="mb-4 flex items-start justify-between gap-3">
              <div className="min-w-0">
                <h3 className="truncate text-base font-semibold text-foreground">{nombre}</h3>
                <p className="tabular text-caption text-muted-foreground">
                  {stock} {unidad} en stock
                </p>
              </div>
              <button
                type="button"
                onClick={cerrar}
                aria-label="Cerrar"
                className="grid h-9 w-9 shrink-0 place-items-center rounded-full text-muted-foreground hover:bg-muted"
              >
                <X className="h-4.5 w-4.5" aria-hidden />
              </button>
            </div>

            {abierto === "ingreso" && (
              <form onSubmit={guardarIngreso} className="space-y-3">
                <Campo
                  etiqueta={`Cuánto entró (${unidad})`}
                  type="number"
                  step="any"
                  min="0.001"
                  required
                  autoFocus
                  value={cantidad}
                  onChange={(e) => setCantidad(e.target.value)}
                />
                <Campo
                  etiqueta="Costo por unidad"
                  type="number"
                  step="1"
                  min="0"
                  placeholder="0"
                  value={costo}
                  onChange={(e) => setCosto(e.target.value)}
                />
                <p className="text-caption text-muted-foreground">
                  El costo queda congelado en este ingreso: es el que se usa para el
                  margen de las órdenes que consuman esta partida.
                </p>
                <Campo
                  etiqueta="Remito o factura (opcional)"
                  value={comprobante}
                  onChange={(e) => setComprobante(e.target.value)}
                />
                <Enviar pendiente={pendiente} texto="Registrar ingreso" />
              </form>
            )}

            {abierto === "ajuste" && (
              <form onSubmit={guardarAjuste} className="space-y-3">
                <Campo
                  etiqueta={`Cuánto hay realmente (${unidad})`}
                  type="number"
                  step="any"
                  min="0"
                  required
                  autoFocus
                  value={stockReal}
                  onChange={(e) => setStockReal(e.target.value)}
                />
                <p className="text-caption text-muted-foreground">
                  Poné lo que contaste en el depósito. La diferencia contra los{" "}
                  {stock} {unidad} del sistema queda registrada como ajuste.
                </p>
                <Enviar pendiente={pendiente} texto="Guardar conteo" />
              </form>
            )}

            {abierto === "historial" && (
              <div className="space-y-2">
                {historial === null ? (
                  <p className="py-6 text-center text-caption text-muted-foreground">Cargando…</p>
                ) : historial.length === 0 ? (
                  <p className="py-6 text-center text-caption text-muted-foreground">
                    Este producto todavía no tiene movimientos.
                  </p>
                ) : (
                  <ul className="divide-y divide-border">
                    {historial.map((m) => (
                      <li key={m.id} className="flex items-center gap-3 py-2.5">
                        <span className="min-w-0 flex-1">
                          <span className="block text-sm text-foreground">
                            {ETIQUETA_TIPO[m.tipo] ?? m.tipo}
                          </span>
                          <span className="block truncate text-caption text-muted-foreground">
                            {new Intl.DateTimeFormat(locale, {
                              day: "2-digit",
                              month: "short",
                              hour: "2-digit",
                              minute: "2-digit",
                            }).format(new Date(m.creado_en))}
                            {m.motivo ? ` · ${m.motivo}` : ""}
                          </span>
                        </span>
                        <span
                          className={`tabular shrink-0 text-sm font-semibold ${
                            m.cantidad > 0 ? "text-estado-ok" : "text-destructive"
                          }`}
                        >
                          {m.cantidad > 0 ? "+" : ""}
                          {m.cantidad}
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}

            {abierto === "editar" && (
              <form onSubmit={guardarEdicion} className="space-y-3">
                <Campo
                  etiqueta="Nombre del producto"
                  required
                  autoFocus
                  value={editNombre}
                  onChange={(e) => setEditNombre(e.target.value)}
                />
                <Campo
                  etiqueta="Marca"
                  value={editMarca}
                  onChange={(e) => setEditMarca(e.target.value)}
                />
                <Campo
                  etiqueta="Precio de venta ($)"
                  type="number"
                  min="0"
                  step="1"
                  value={editPrecio}
                  onChange={(e) => setEditPrecio(e.target.value)}
                />
                <Enviar pendiente={pendiente} texto="Guardar cambios" />
              </form>
            )}

            {abierto === "eliminar" && (
              <div className="space-y-4 text-center">
                <p className="text-sm text-muted-foreground">
                  ¿Seguro que querés eliminar <strong>{nombre}</strong>? Si tiene movimientos de stock o fue usado en una orden, no se podrá borrar.
                </p>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={cerrar}
                    className="flex-1 min-h-11 rounded-[var(--radius-sm)] border border-border text-sm font-semibold text-foreground hover:bg-muted"
                  >
                    Cancelar
                  </button>
                  <button
                    type="button"
                    disabled={pendiente}
                    onClick={confirmarEliminar}
                    className="flex-1 min-h-11 rounded-[var(--radius-sm)] bg-destructive text-sm font-semibold text-white hover:bg-destructive/90 disabled:opacity-60"
                  >
                    {pendiente ? "Eliminando…" : "Sí, eliminar"}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}

function BotonIcono({
  etiqueta,
  onClick,
  children,
}: {
  etiqueta: string;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={etiqueta}
      title={etiqueta}
      className="grid h-10 w-10 place-items-center rounded-[var(--radius-sm)] text-muted-foreground transition-colors hover:bg-muted hover:text-accent"
    >
      {children}
    </button>
  );
}

function Campo({
  etiqueta,
  ...props
}: { etiqueta: string } & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <label className="block space-y-1.5">
      <span className="text-caption font-medium text-muted-foreground">{etiqueta}</span>
      <input
        className="min-h-11 w-full rounded-[var(--radius-sm)] border border-border bg-card px-3 text-base text-foreground outline-none focus:border-accent"
        {...props}
      />
    </label>
  );
}

function Enviar({ pendiente, texto }: { pendiente: boolean; texto: string }) {
  return (
    <button
      type="submit"
      disabled={pendiente}
      className="min-h-11 w-full rounded-[var(--radius-sm)] bg-accent text-sm font-semibold text-accent-foreground transition-transform active:scale-[0.98] disabled:opacity-60"
    >
      {pendiente ? "Guardando…" : texto}
    </button>
  );
}
