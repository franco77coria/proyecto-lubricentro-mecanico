import { AlertTriangle, Package } from "lucide-react";
import { redirect } from "next/navigation";

import { FormNuevoProducto } from "@/components/stock/FormNuevoProducto";
import { Buscador, EncabezadoPantalla } from "@/components/ui/EncabezadoPantalla";
import { crearClienteServidor, obtenerSesion } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

const money = (n: number) =>
  new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS", maximumFractionDigits: 0 }).format(n);

export default async function PaginaStock({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const sesion = await obtenerSesion();
  if (!sesion?.perfil) redirect("/login");

  const { q } = await searchParams;
  const supabase = await crearClienteServidor();

  let query = supabase
    .from("producto")
    .select("id, sku, nombre, marca, categoria, unidad, stock, stock_min, precio_venta, bajo_stock")
    // Los que están bajo mínimo van primero: es lo que hay que ir a comprar.
    .order("bajo_stock", { ascending: false })
    .order("nombre", { ascending: true })
    .eq("taller_id", sesion.perfil.taller_id)
    .eq("activo", true)
    .limit(120);

  if (q?.trim()) {
    const limpio = q.trim();
    query = query.or(`nombre.ilike.%${limpio}%,sku.ilike.%${limpio}%,marca.ilike.%${limpio}%`);
  }

  const { data: productos } = await query;
  const lista = productos ?? [];
  const bajos = lista.filter((p) => p.bajo_stock).length;

  return (
    <main className="flex-1 pt-[calc(var(--safe-top)+1.25rem)] pb-4 scroll-inset">
      <div className="contenedor space-y-5">
        <EncabezadoPantalla seccion="Inventario" titulo="Stock" accion={<FormNuevoProducto />} />

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
              {q
                ? "Ningún producto coincide con esa búsqueda."
                : "Todavía no hay productos cargados en el inventario."}
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
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </main>
  );
}
