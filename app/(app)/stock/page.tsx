import { AlertTriangle, Package, Search } from "lucide-react";
import { redirect } from "next/navigation";

import { FormNuevoProducto } from "@/components/stock/FormNuevoProducto";
import { crearClienteServidor, obtenerSesion } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function PaginaStock({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const sesion = await obtenerSesion();
  if (!sesion?.perfil) redirect("/login");

  const { q } = await searchParams;
  const supabase = await crearClienteServidor();
  const tallerId = sesion.perfil.taller_id;

  let query = supabase
    .from("producto")
    .select("id, sku, nombre, marca, categoria, unidad, stock, stock_min, precio_venta, bajo_stock")
    .eq("taller_id", tallerId)
    .order("nombre", { ascending: true })
    .limit(50);

  if (q && q.trim()) {
    const limpio = q.trim();
    query = query.or(`nombre.ilike.%${limpio}%,sku.ilike.%${limpio}%,marca.ilike.%${limpio}%`);
  }

  const { data: productos } = await query;

  return (
    <main className="flex-1 px-4 pt-[calc(var(--safe-top)+4.5rem)] pb-24 scroll-inset">
      <div className="mx-auto max-w-[28rem] space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <p className="text-caption font-semibold text-muted-foreground">Inventario</p>
            <h1 className="text-2xl font-bold tracking-tight text-foreground">Control de Stock</h1>
          </div>
          <FormNuevoProducto />
        </div>

        {/* Buscador */}
        <form method="GET" className="relative">
          <input
            type="text"
            name="q"
            defaultValue={q || ""}
            placeholder="Buscar repuesto, filtro, aceite..."
            className="min-h-11 w-full rounded-xl border border-border bg-card pl-10 pr-4 text-xs text-foreground placeholder:text-muted-foreground focus:border-accent focus:outline-none shadow-sm"
          />
          <Search className="absolute left-3 top-3.5 h-4 w-4 text-muted-foreground" />
        </form>

        {/* Lista de Productos */}
        <div className="space-y-2.5">
          {productos && productos.length > 0 ? (
            productos.map((prod) => {
              const stockCalculado = prod.stock ?? 0;
              const esBajo = prod.bajo_stock ?? stockCalculado <= prod.stock_min;

              return (
                <div
                  key={prod.id}
                  className="flex items-center justify-between rounded-xl border border-border bg-card p-4 shadow-sm"
                >
                  <div className="space-y-1 min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-bold text-foreground truncate">{prod.nombre}</p>
                      {esBajo && (
                        <span className="flex items-center gap-1 px-2 py-0.5 text-[10px] font-bold rounded-full bg-amber-500/15 text-amber-700 dark:text-amber-400">
                          <AlertTriangle className="h-3 w-3" /> Bajo Stock
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground font-medium">
                      {[prod.marca, prod.categoria].filter(Boolean).join(" • ") || "Sin categoría"}
                    </p>
                  </div>

                  <div className="text-right ml-4">
                    <p className="text-lg font-black text-foreground tabular">
                      {stockCalculado} <span className="text-xs font-semibold text-muted-foreground">{prod.unidad}</span>
                    </p>
                    <p className="text-caption font-bold text-accent tabular">
                      $ {Number(prod.precio_venta || 0).toLocaleString("es-AR")}
                    </p>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="rounded-2xl border border-dashed border-border bg-card p-8 text-center space-y-2">
              <Package className="mx-auto h-8 w-8 text-muted-foreground opacity-50" />
              <p className="text-xs font-medium text-muted-foreground">
                {q ? "No se encontraron productos en el inventario." : "No tenés productos cargados en stock."}
              </p>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
