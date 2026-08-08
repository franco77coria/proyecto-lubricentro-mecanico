import { Car, Gauge, Plus } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";

import { Buscador, EncabezadoPantalla } from "@/components/ui/EncabezadoPantalla";
import { crearClienteServidor, obtenerSesion } from "@/lib/supabase/server";
import { formatearPatente } from "@/lib/patente";

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

  let query = supabase
    .from("vehiculo")
    .select(
      `id, patente, anio, color, km_actual,
       marca:marca_id(nombre), modelo:modelo_id(nombre)`,
    )
    .eq("taller_id", sesion.perfil.taller_id)
    .order("creado_en", { ascending: false })
    .limit(60);

  if (q?.trim()) {
    // Se busca contra la columna normalizada para que "ab 123 cd" y
    // "AB-123-CD" encuentren el mismo auto.
    const limpio = q.trim().toUpperCase().replace(/[^A-Z0-9]/g, "");
    query = query.ilike("patente_norm", `%${limpio}%`);
  }

  const { data: vehiculos } = await query;
  const lista = vehiculos ?? [];

  return (
    <main className="flex-1 pt-[calc(var(--safe-top)+1.25rem)] pb-4 scroll-inset">
      <div className="contenedor space-y-5">
        <EncabezadoPantalla
          seccion="Autos"
          titulo={q ? `Resultados de "${q}"` : "Autos del taller"}
          accion={
            <Link
              href="/ot/nueva"
              className="flex min-h-11 items-center gap-2 rounded-[var(--radius-sm)] bg-accent px-4 text-sm font-semibold text-accent-foreground shadow-[var(--sombra-sutil)] transition-transform hover:brightness-110 active:scale-[0.98]"
            >
              <Plus className="h-4 w-4" strokeWidth={2.5} aria-hidden />
              Recibir auto
            </Link>
          }
        />

        <Buscador valor={q} placeholder="Buscar por patente" />

        {lista.length === 0 ? (
          <div className="tarjeta entrar flex flex-col items-center gap-3 px-6 py-14 text-center">
            <span className="grid h-12 w-12 place-items-center rounded-full bg-accent-suave text-accent">
              <Car className="h-6 w-6" aria-hidden />
            </span>
            <p className="max-w-xs text-sm text-muted-foreground">
              {q
                ? "Ninguna patente coincide con esa búsqueda."
                : "Todavía no hay autos cargados. Se dan de alta al recibir el primero."}
            </p>
          </div>
        ) : (
          <>
            <p className="text-caption text-muted-foreground">
              {lista.length} {lista.length === 1 ? "auto" : "autos"}
            </p>
            <ul className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {lista.map((v, i) => {
                const desc = [v.marca?.nombre, v.modelo?.nombre, v.anio].filter(Boolean).join(" ");
                return (
                  <li key={v.id} className="entrar" style={{ "--i": i + 2 } as React.CSSProperties}>
                    {/* Lleva al historial y no a crear una orden: al tocar un
                        auto lo primero que se quiere ver es qué se le hizo
                        antes. Crear la orden es una acción de esa ficha. */}
                    <Link
                      href={`/vehiculos/${encodeURIComponent(v.patente)}`}
                      className="tarjeta tarjeta-accion flex h-full flex-col gap-3 p-4"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <span className="text-display text-xl text-foreground">
                          {formatearPatente(v.patente)}
                        </span>
                        <span className="grid h-9 w-9 shrink-0 place-items-center rounded-[var(--radius-sm)] bg-muted text-muted-foreground">
                          <Car className="h-4.5 w-4.5" aria-hidden />
                        </span>
                      </div>

                      <p className="text-sm font-medium text-foreground">
                        {desc || "Sin marca ni modelo"}
                      </p>

                      <div className="mt-auto flex items-center gap-3 text-caption text-muted-foreground">
                        {v.km_actual != null && (
                          <span className="flex items-center gap-1">
                            <Gauge className="h-3.5 w-3.5" aria-hidden />
                            <span className="tabular">{v.km_actual.toLocaleString("es-AR")} km</span>
                          </span>
                        )}
                        {v.color && <span className="truncate">{v.color}</span>}
                      </div>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </>
        )}
      </div>
    </main>
  );
}
