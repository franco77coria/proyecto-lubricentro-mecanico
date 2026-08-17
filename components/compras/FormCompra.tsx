"use client";

import { Plus, Trash2, Sparkles, Loader2, FileScan } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition, useRef } from "react";

import { useIsla } from "@/components/isla/IslaContext";
import { Sheet } from "@/components/sheet/Sheet";
import {
  GaleriaComprobantesCompra,
  type FotoBorrador,
} from "@/components/compras/GaleriaComprobantesCompra";
import { crearCompra, crearProveedor, type ProveedorListado } from "@/lib/actions/compras";
import { analizarComprobanteCompraAction } from "@/lib/actions/ocr-compras";
import type { ComprobanteCompraOCRData } from "@/lib/ia/ocr-compras";
import {
  obtenerTallerIdActual,
  registrarFotoCompra,
} from "@/lib/actions/fotos-compras";
import { comprimirImagen, rutaFotoCompra } from "@/lib/imagen";
import { BUCKET_FOTOS } from "@/lib/storage";
import { crearClienteNavegador } from "@/lib/supabase/client";

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

function hoyLocal() {
  const d = new Date();
  const mes = String(d.getMonth() + 1).padStart(2, "0");
  const dia = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${mes}-${dia}`;
}

export function FormCompra({
  proveedores: proveedoresIniciales,
  productos,
  tallerId: tallerIdProp,
}: {
  proveedores: ProveedorListado[];
  productos: OpcionProductoCompra[];
  tallerId?: string;
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
  const [fotosBorrador, setFotosBorrador] = useState<FotoBorrador[]>([]);
  const [escaneandoOCR, setEscaneandoOCR] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputOcrRef = useRef<HTMLInputElement>(null);

  const total = lineas.reduce(
    (acc, l) => acc + (Number(l.cantidad) || 0) * (Number(l.costoUnitario) || 0),
    0,
  );

  const setLinea = (i: number, campo: keyof Linea, valor: string) =>
    setLineas((prev) => prev.map((l, j) => (j === i ? { ...l, [campo]: valor } : l)));

  async function procesarArchivoParaOCR(file: File) {
    setEscaneandoOCR(true);
    setError(null);
    try {
      // 1. Agregar a fotos borrador
      const previewUrl = URL.createObjectURL(file);
      const nuevaFoto: FotoBorrador = {
        id: `ocr-${Date.now()}`,
        file,
        previewUrl,
        nota: "Comprobante procesado con IA",
      };
      setFotosBorrador((prev) => [nuevaFoto, ...prev]);

      // 2. Convertir a base64 para el server action
      const reader = new FileReader();
      const base64Promise = new Promise<string>((resolve, reject) => {
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });
      const dataUri = await base64Promise;

      // 3. Ejecutar OCR con IA
      const res = await analizarComprobanteCompraAction(dataUri);
      if (res.error || !res.datos) {
        notificar({
          tipo: "alerta",
          mensaje: res.error || "No se pudieron extraer datos legibles del comprobante.",
        });
        return;
      }

      const d = res.datos;

      // 4. Autocompletar datos del comprobante
      if (d.numeroComprobante && d.numeroComprobante !== "S/N") {
        setComprobante(d.numeroComprobante);
      }
      if (d.fecha) {
        setFecha(d.fecha);
      }

      // 5. Match o seteo de Proveedor
      if (d.proveedor) {
        const provExistente = proveedores.find((p) =>
          p.nombre.toLowerCase().includes(d.proveedor.toLowerCase()) ||
          d.proveedor.toLowerCase().includes(p.nombre.toLowerCase()),
        );
        if (provExistente) {
          setProveedorId(provExistente.id);
        } else {
          setNuevoProveedor(d.proveedor);
        }
      }

      // 6. Match y carga de renglones de productos
      if (d.items && d.items.length > 0) {
        const nuevasLineas: Linea[] = d.items.map((item) => {
          // Buscar producto en catálogo existente por coincidencia de nombre o código
          const prodMatch = productos.find((p) => {
            const nomLower = p.nombre.toLowerCase();
            const descLower = item.descripcion.toLowerCase();
            const codLower = item.codigo ? item.codigo.toLowerCase() : "";
            return (
              (codLower && nomLower.includes(codLower)) ||
              nomLower.includes(descLower) ||
              descLower.includes(nomLower)
            );
          });

          return {
            productoId: prodMatch?.id || "",
            cantidad: String(item.cantidad),
            costoUnitario: item.precioUnitario > 0 ? String(item.precioUnitario) : "",
          };
        });

        setLineas(nuevasLineas);

        notificar({
          tipo: "exito",
          mensaje: `✨ Factura procesada con IA: ${d.items.length} ítems extraídos de "${d.proveedor}".`,
        });
      }
    } catch (err: any) {
      console.error("[FormCompra/OCR]", err);
      notificar({ tipo: "error", mensaje: "Error al procesar el archivo del comprobante." });
    } finally {
      setEscaneandoOCR(false);
    }
  }

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
      if (res.error || !res.id) {
        setError(res.error ?? "No se pudo crear la compra.");
        return;
      }

      // Si se sacaron fotos del comprobante / remito físico, las optimizamos y subimos
      if (fotosBorrador.length > 0) {
        try {
          const supabase = crearClienteNavegador();
          let tallerId = tallerIdProp;
          if (!tallerId) tallerId = (await obtenerTallerIdActual()) ?? undefined;

          if (tallerId) {
            for (const foto of fotosBorrador) {
              const { blob } = await comprimirImagen(foto.file);
              const path = rutaFotoCompra(
                tallerId,
                res.id,
                blob.type === "image/webp" ? "webp" : "jpg",
              );
              const { error: errorSubida } = await supabase.storage
                .from(BUCKET_FOTOS)
                .upload(path, blob, { contentType: blob.type, upsert: false });

              if (!errorSubida) {
                await registrarFotoCompra(res.id, path, foto.nota);
              }
            }
          }
        } catch (errFotos) {
          console.error("[FormCompra/subirFotos]", errFotos);
        }
      }

      // Limpiar URLs de objeto borrador
      fotosBorrador.forEach((f) => URL.revokeObjectURL(f.previewUrl));
      setFotosBorrador([]);

      notificar({
        tipo: "exito",
        mensaje:
          fotosBorrador.length > 0
            ? `Remito cargado — ${items.length} producto(s) al stock y ${fotosBorrador.length} comprobante(s) adjunto(s)`
            : `Remito cargado — ${items.length} producto(s) al stock`,
      });
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
        className="inline-flex min-h-12 items-center gap-2 rounded-2xl bg-accent px-5 text-sm font-bold text-white shadow-md transition-transform active:scale-95 hover:brightness-110"
      >
        <Plus className="h-5 w-5" aria-hidden />
        <span>Cargar remito</span>
      </button>

      <Sheet
        abierto={abierto}
        onCerrar={() => setAbierto(false)}
        titulo="Cargar Remito de Proveedor"
      >
        <form onSubmit={guardar} className="space-y-4 p-5">
          {/* Botón Escaneo Inteligente con IA */}
          <div className="rounded-2xl border border-accent/30 bg-gradient-to-r from-accent/10 via-amber-500/5 to-transparent p-3.5 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-accent text-white shadow-md shadow-accent/25">
                {escaneandoOCR ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  <Sparkles className="h-5 w-5" />
                )}
              </div>
              <div>
                <p className="text-sm font-bold text-foreground">
                  Escanear Factura / Remito con IA
                </p>
                <p className="text-xs text-muted-foreground">
                  Subí o sacá una foto del papel y autocompletá ítems, cantidades y precios.
                </p>
              </div>
            </div>

            <input
              ref={inputOcrRef}
              type="file"
              accept="image/*"
              capture="environment"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) procesarArchivoParaOCR(f);
                e.target.value = "";
              }}
            />

            <button
              type="button"
              disabled={escaneandoOCR}
              onClick={() => inputOcrRef.current?.click()}
              className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-accent px-4 text-xs font-bold text-white shadow-sm transition-all hover:brightness-110 active:scale-95 disabled:opacity-50"
            >
              {escaneandoOCR ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Leyendo factura...</span>
                </>
              ) : (
                <>
                  <FileScan className="h-4 w-4" />
                  <span>Escanear con IA</span>
                </>
              )}
            </button>
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            <div>
              <label htmlFor="prov" className="text-caption font-semibold text-muted-foreground block mb-1">
                Proveedor
              </label>
              <select
                id="prov"
                value={proveedorId}
                onChange={(e) => setProveedorId(e.target.value)}
                className="min-h-12 w-full rounded-xl border border-border bg-card px-3.5 text-base text-foreground focus:border-accent focus:outline-none"
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
              <label htmlFor="comp" className="text-caption font-semibold text-muted-foreground block mb-1">
                N° de remito o factura
              </label>
              <input
                id="comp"
                value={comprobante}
                onChange={(e) => setComprobante(e.target.value)}
                placeholder="Ej: 0001-00012345"
                maxLength={40}
                className="min-h-12 w-full rounded-xl border border-border bg-card px-3.5 text-base text-foreground focus:border-accent focus:outline-none"
              />
            </div>
            <div>
              <label htmlFor="fecha" className="text-caption font-semibold text-muted-foreground block mb-1">
                Fecha
              </label>
              <input
                id="fecha"
                type="date"
                required
                value={fecha}
                onChange={(e) => setFecha(e.target.value)}
                className="min-h-12 w-full rounded-xl border border-border bg-card px-3.5 text-base text-foreground focus:border-accent focus:outline-none"
              />
            </div>
          </div>

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
              className="min-h-12 flex-1 rounded-xl border border-dashed border-border bg-card px-3.5 text-base text-foreground focus:border-accent focus:outline-none"
            />
            <button
              type="button"
              onClick={agregarProveedor}
              disabled={pendiente || !nuevoProveedor.trim()}
              className="min-h-12 shrink-0 rounded-xl bg-muted px-4 text-xs font-bold text-foreground active:scale-95 disabled:opacity-50"
            >
              Agregar
            </button>
          </div>

          {/* Foto del comprobante físico / remito (con captura de cámara y zoom) */}
          <div className="rounded-2xl border border-border/80 bg-muted/20 p-3.5 space-y-2">
            <GaleriaComprobantesCompra
              borrador
              fotosBorrador={fotosBorrador}
              onFotosBorradorChange={setFotosBorrador}
              compacto
            />
          </div>

          <div className="space-y-2.5">
            <p className="text-caption font-bold uppercase tracking-wider text-muted-foreground">
              Productos del remito
            </p>

            {lineas.map((l, i) => (
              <div key={i} className="grid grid-cols-[1fr_4.5rem_6.5rem_2.5rem] gap-2">
                <select
                  value={l.productoId}
                  onChange={(e) => setLinea(i, "productoId", e.target.value)}
                  aria-label={`Producto de la línea ${i + 1}`}
                  className="min-h-12 w-full rounded-xl border border-border bg-card px-2 text-xs text-foreground focus:border-accent focus:outline-none"
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
                  className="min-h-12 w-full rounded-xl border border-border bg-card px-2 text-sm text-foreground focus:border-accent focus:outline-none"
                />
                <input
                  type="number"
                  step="1"
                  min="0"
                  placeholder="Costo $"
                  value={l.costoUnitario}
                  onChange={(e) => setLinea(i, "costoUnitario", e.target.value)}
                  aria-label={`Costo unitario de la línea ${i + 1}`}
                  className="min-h-12 w-full rounded-xl border border-border bg-card px-2 text-sm text-foreground focus:border-accent focus:outline-none"
                />
                <button
                  type="button"
                  onClick={() => setLineas((prev) => prev.filter((_, j) => j !== i))}
                  disabled={lineas.length === 1}
                  aria-label={`Quitar la línea ${i + 1}`}
                  className="grid min-h-12 place-items-center rounded-xl text-muted-foreground hover:bg-destructive/10 hover:text-destructive disabled:opacity-30"
                >
                  <Trash2 className="h-4 w-4" aria-hidden />
                </button>
              </div>
            ))}

            <button
              type="button"
              onClick={() => setLineas((prev) => [...prev, { ...LINEA_VACIA }])}
              className="flex min-h-11 w-full items-center justify-center gap-1.5 rounded-xl border border-dashed border-border text-xs font-bold text-accent hover:bg-accent/5"
            >
              <Plus className="h-4 w-4" aria-hidden />
              <span>Agregar otra línea</span>
            </button>
          </div>

          {productos.length === 0 && (
            <p className="rounded-xl bg-amber-500/10 border border-amber-500/20 px-3.5 py-2.5 text-caption text-amber-400">
              No hay productos cargados todavía. Creá el producto en Stock y volvé.
            </p>
          )}

          {error && (
            <p role="alert" className="text-caption font-bold text-destructive">
              {error}
            </p>
          )}

          <div className="flex items-center justify-between border-t border-border pt-3">
            <span className="text-caption uppercase font-bold tracking-wider text-muted-foreground">
              Total del remito
            </span>
            <span className="tabular text-xl font-black text-accent">{money(total)}</span>
          </div>

          <button
            type="submit"
            disabled={pendiente}
            className="min-h-12 w-full rounded-2xl bg-accent text-base font-bold text-white shadow-md active:scale-95 disabled:opacity-50"
          >
            {pendiente ? "Cargando…" : "Cargar al stock"}
          </button>
        </form>
      </Sheet>
    </>
  );
}
