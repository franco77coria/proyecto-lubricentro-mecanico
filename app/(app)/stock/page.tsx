import { AlertTriangle, Package } from "lucide-react";

import { AccionesProducto } from "@/components/stock/AccionesProducto";
import { EscanearProducto } from "@/components/stock/EscanearProducto";
import { FormNuevoProducto } from "@/components/stock/FormNuevoProducto";
import { Buscador, EncabezadoPantalla } from "@/components/ui/EncabezadoPantalla";
import { crearClienteServidor } from "@/lib/supabase/server";
import { exigirVista } from "@/lib/permisos";
import { obtenerAjustesTaller } from "@/lib/taller";
import { formatearMoneda } from "@/lib/i18n";

export const dynamic = "force-dynamic";

/* El formato de plata sale del taller. */

export default async function PaginaStock({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const sesion = await exigirVista("/stock");
  const { idioma, moneda } = await obtenerAjustesTaller();
  const money = (n: number) => formatearMoneda(n, moneda, idioma);

  const { q } = await searchParams;
  const supabase = await crearClienteServidor();

  let query = supabase
    .from("producto")
    .select(
      "id, sku, codigo_barras, nombre, marca, categoria, unidad, stock, stock_min, precio_venta, bajo_stock",
    )
    // Los que están bajo mínimo van primero: es lo que hay que ir a comprar.
    .order("bajo_stock", { ascending: false })
    .order("nombre", { ascending: true })
    .eq("taller_id", sesion.perfil.taller_id)
    .eq("activo", true)
    .limit(120);

  if (q?.trim()) {
    const limpio = q.trim();
    // `codigo_barras` va acá para que escanear un bidón deje el producto solo en
    // la lista, con sus botones de stock al lado.
    query = query.or(
      `nombre.ilike.%${limpio}%,sku.ilike.%${limpio}%,marca.ilike.%${limpio}%,codigo_barras.ilike.%${limpio}%`,
    );
  }

  const { data: productos } = await query;
  // El mecánico ve el stock para saber si hay repuesto, pero no lo mueve.
  const puedeMover = sesion.perfil.rol !== "mecanico";
  const lista = productos ?? [];
  const bajos = lista.filter((p) => p.bajo_stock).length;

  return (
    <main className="flex-1 pt-[calc(var(--safe-top)+1.25rem)] pb-4 scroll-inset">
      <div className="contenedor space-y-5">
        <EncabezadoPantalla
          seccion="Inventario"
          titulo="Stock"
          accion={
            <div className="flex gap-2">
              <EscanearProducto />
              <FormNuevoProducto />
            </div>
          }
        />

        <Buscador valor={q} placeholder="Buscar repuesto, filtro, aceite" />

        {bajos > 0 && (
          <p
            className="entrar flex items-center gap-2 rounded-[var(--radius-sm)] bg-amber-50 px-3.5 py-2.5 text-sm text-amber-800"
            style={{ "--i": 2 } as React.CSSProperties}
          >
            <AlertTriangle className="h-4 w-4 shrink-0" aria-hidden />
            {bajos} {bajos === 1 ? "producto está" : "productos están"} bajo el mínimo
          </p>
        )}

        {lista.length === 0 ? (
          <div className="tarjeta entrar flex flex-col items-center gap-3 px-6 py-14 text-center">
            <span className="grid h-12 w-12 place-items-center rounded-full bg-accent-suave text-accent">
              <Package className="h-6 w-6" aria-hidden />
            </span>
            <p className="max-w-xs text-sm text-muted-foreground">
              {q ? (
                <>
                  Ningún producto coincide con <strong>{q}</strong>.
                  {/* Después de escanear un código que no está, lo que sigue es
                      cargarlo — y hay que poder copiar el código de acá. */}
                  <span className="mt-1.5 block text-caption">
                    Si lo acabás de escanear, cargalo con <strong>Nuevo Producto</strong> y pegá ese
                    código en el campo de código de barras.
                  </span>
                </>
              ) : (
                "Todavía no hay productos cargados en el inventario."
              )}
            </p>
          </div>
        ) : (
          <ul className="grid gap-2.5 lg:grid-cols-2 xl:grid-cols-3">
            {lista.map((p, i) => {
              const stock = Number(p.stock ?? 0);
              const bajo = p.bajo_stock ?? stock <= Number(p.stock_min);
              return (
                <li
                  key={p.id}
                  className={`tarjeta entrar flex items-center gap-3 p-3.5 ${bajo ? "border-amber-200 bg-amber-50/40" : ""}`}
                  style={{ "--i": i + 3 } as React.CSSProperties}
                >
                  <span
                    className={`grid h-10 w-10 shrink-0 place-items-center rounded-[var(--radius-sm)] ${
                      bajo ? "bg-amber-100 text-amber-700" : "bg-muted text-muted-foreground"
                    }`}
                  >
                    {bajo ? (
                      <AlertTriangle className="h-4.5 w-4.5" aria-hidden />
                    ) : (
                      <Package className="h-4.5 w-4.5" aria-hidden />
                    )}
                  </span>

                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-semibold text-foreground">{p.nombre}</span>
                    <span className="block truncate text-caption text-muted-foreground">
                      {[p.marca, p.categoria].filter(Boolean).join(" · ") || "Sin categoría"}
                    </span>
                  </span>

                  <span className="shrink-0 text-right">
                    <span className={`tabular block text-base font-bold ${bajo ? "text-amber-700" : "text-foreground"}`}>
                      {stock}
                      <span className="ml-1 text-caption font-medium text-muted-foreground">{p.unidad}</span>
                    </span>
                    <span className="tabular block text-caption text-muted-foreground">
                      {money(Number(p.precio_venta ?? 0))}
                    </span>
                  </span>

                  {puedeMover && (
                    <AccionesProducto
                      productoId={p.id}
                      nombre={p.nombre}
                      stock={stock}
                      unidad={p.unidad}
                      precioVenta={Number(p.precio_venta ?? 0)}
                      marca={p.marca ?? undefined}
                    />
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </main>
  );
}
