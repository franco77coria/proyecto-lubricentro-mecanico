import { Car, Plus, Search } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";

import { crearClienteServidor, obtenerSesion } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function PaginaVehiculos({
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
    .from("vehiculo")
    .select(`
      id, patente, anio, color, km_actual,
      marca:marca_id(nombre),
      modelo:modelo_id(nombre)
    `)
    .eq("taller_id", tallerId)
    .order("creado_en", { ascending: false })
    .limit(30);

  if (q && q.trim()) {
    const limpio = q.trim().toUpperCase();
    query = query.or(`patente_norm.ilike.%${limpio}%,patente.ilike.%${limpio}%`);
  }

  const { data: vehiculos } = await query;

  return (
    <main className="flex-1 px-4 pt-[calc(var(--safe-top)+4.5rem)] pb-24 scroll-inset">
      <div className="mx-auto max-w-[28rem] space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <p className="text-caption font-semibold text-muted-foreground">Catálogo del Taller</p>
            <h1 className="text-2xl font-bold tracking-tight text-foreground">Vehículos</h1>
          </div>
          <Link
            href="/ot/nueva"
            className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-accent px-4 text-xs font-bold text-white shadow-md transition-transform active:scale-95"
          >
            <Plus className="h-4 w-4" />
            <span>Nuevo Auto</span>
          </Link>
        </div>

        {/* Buscador */}
        <form method="GET" className="relative">
          <input
            type="text"
            name="q"
            defaultValue={q || ""}
            placeholder="Buscar por patente (ej: AB123CD)..."
            className="min-h-11 w-full rounded-xl border border-border bg-card pl-10 pr-4 text-xs text-foreground placeholder:text-muted-foreground focus:border-accent focus:outline-none shadow-sm"
          />
          <Search className="absolute left-3 top-3.5 h-4 w-4 text-muted-foreground" />
        </form>

        {/* Lista de vehículos */}
        <div className="space-y-3">
          {vehiculos && vehiculos.length > 0 ? (
            vehiculos.map((v) => {
              const desc = [v.marca?.nombre, v.modelo?.nombre, v.anio].filter(Boolean).join(" ");
              return (
                <div
                  key={v.id}
                  className="flex items-center justify-between rounded-xl border border-border bg-card p-4 shadow-sm"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-display font-bold text-accent text-lg">{v.patente}</span>
                      {v.km_actual && (
                        <span className="text-caption text-muted-foreground">
                          {v.km_actual.toLocaleString()} km
                        </span>
                      )}
                    </div>
                    <p className="text-xs font-medium text-foreground">{desc || "Sin marca/modelo"}</p>
                  </div>

                  <Link
                    href={`/ot/nueva?patente=${v.patente}`}
                    className="inline-flex h-9 items-center justify-center rounded-lg bg-muted px-3 text-xs font-semibold text-foreground hover:bg-accent hover:text-white transition-colors"
                  >
                    Crear OT
                  </Link>
                </div>
              );
            })
          ) : (
            <div className="rounded-2xl border border-dashed border-border bg-card p-8 text-center space-y-2">
              <Car className="mx-auto h-8 w-8 text-muted-foreground opacity-50" />
              <p className="text-xs font-medium text-muted-foreground">
                {q ? "No se encontraron vehículos para esa búsqueda." : "No tenés vehículos registrados."}
              </p>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
