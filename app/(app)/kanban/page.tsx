import { Car } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";

import { MoverOT } from "@/components/kanban/MoverOT";
import { EncabezadoPantalla } from "@/components/ui/EncabezadoPantalla";
import { COLUMNAS_KANBAN, ESTADO_TONO, etiquetaEstado, type EstadoDb } from "@/lib/estados-ot";
import { crearClienteServidor, obtenerSesion } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

/** Cuántos días hace que el auto está en el taller. */
function diasEn(iso: string): number {
  const ms = Date.now() - new Date(iso).getTime();
  return Math.max(0, Math.floor(ms / 86_400_000));
}

/**
 * Tablero de pared.
 *
 * Muestra solo lo que está EN el taller (hasta "listo"): un auto entregado ya no
 * está, y dejarlo en una columna hace que el tablero crezca para siempre hasta
 * volverse ilegible — el mismo problema que tiene el pizarrón de verdad.
 *
 * Los días en el taller van en cada tarjeta porque es el dato que hace que el
 * tablero sirva para algo más que mirar: un auto de 6 días en "esperando
 * repuesto" es una llamada al repuestero, y sin el número nadie lo nota.
 */
export default async function PaginaKanban() {
  const sesion = await obtenerSesion();
  if (!sesion?.perfil) redirect("/login");

  const supabase = await crearClienteServidor();
  const { data: ordenes } = await supabase
    .from("orden_trabajo")
    .select(
      `id, numero, estado, fecha_ingreso, total,
       vehiculo:vehiculo_id ( patente, marca:marca_id(nombre), modelo:modelo_id(nombre) ),
       cliente:cliente_id ( nombre, apellido )`,
    )
    .eq("taller_id", sesion.perfil.taller_id)
    // El spread copia el readonly a un array mutable, que es lo que espera
    // `.in()`; el tipo de los valores sigue siendo el enum de la base.
    .in("estado", [...COLUMNAS_KANBAN])
    .order("fecha_ingreso", { ascending: true })
    .limit(300);

  const lista = ordenes ?? [];
  const porEstado = (estado: EstadoDb) => lista.filter((o) => o.estado === estado);

  return (
    <main className="flex-1 pt-[calc(var(--safe-top)+1.25rem)] pb-4 scroll-inset">
      <div className="contenedor space-y-5">
        <EncabezadoPantalla
          seccion="Tablero de pared"
          titulo={`${lista.length} ${lista.length === 1 ? "auto" : "autos"} en el taller`}
        />

        {lista.length === 0 ? (
          <div className="tarjeta entrar flex flex-col items-center gap-3 px-6 py-14 text-center">
            <span className="grid h-12 w-12 place-items-center rounded-full bg-accent-suave text-accent">
              <Car className="h-6 w-6" aria-hidden />
            </span>
            <p className="max-w-sm text-sm text-muted-foreground">
              No hay autos en el taller. Las órdenes entregadas y cerradas no
              aparecen acá a propósito: el tablero muestra lo que hay, no el
              historial.
            </p>
          </div>
        ) : (
          /* Scroll horizontal con columnas de ancho fijo: en una tablet apoyada
             en el taller se ven 2 o 3 y se corre con el pulgar. Un grid que
             comprime las 6 columnas las deja ilegibles. */
          <div className="-mx-4 overflow-x-auto px-4 pb-3">
            <div className="flex gap-3" style={{ minWidth: "min-content" }}>
              {COLUMNAS_KANBAN.map((estado) => {
                const items = porEstado(estado);
                return (
                  <section key={estado} className="flex w-[16.5rem] shrink-0 flex-col gap-2">
                    <header className="flex items-center justify-between gap-2 px-1">
                      <h2 className="truncate text-caption font-bold uppercase tracking-wider text-muted-foreground">
                        {etiquetaEstado(estado)}
                      </h2>
                      <span
                        className={`shrink-0 rounded-full px-2 py-0.5 text-[0.6875rem] font-bold ${ESTADO_TONO[estado] ?? "bg-muted"}`}
                      >
                        {items.length}
                      </span>
                    </header>

                    <div className="flex flex-col gap-2">
                      {items.length === 0 && (
                        <p className="rounded-[var(--radius-sm)] border border-dashed border-border px-3 py-6 text-center text-caption text-muted-foreground">
                          Vacío
                        </p>
                      )}

                      {items.map((ot) => {
                        const dias = diasEn(ot.fecha_ingreso);
                        return (
                          <article key={ot.id} className="tarjeta space-y-2 p-3">
                            <Link href={`/ot/${ot.id}`} className="block">
                              <span className="text-display block text-base tracking-normal text-foreground">
                                {ot.vehiculo?.patente ?? "Sin patente"}
                              </span>
                              <span className="block truncate text-caption text-muted-foreground">
                                {[ot.vehiculo?.marca?.nombre, ot.vehiculo?.modelo?.nombre]
                                  .filter(Boolean)
                                  .join(" ") || "Sin modelo"}
                              </span>
                              {ot.cliente && (
                                <span className="block truncate text-caption text-muted-foreground">
                                  {ot.cliente.nombre} {ot.cliente.apellido}
                                </span>
                              )}
                            </Link>

                            <div className="flex items-center justify-between gap-2 border-t border-border pt-2">
                              <span
                                className={`text-caption font-semibold ${
                                  dias >= 5 ? "text-destructive" : "text-muted-foreground"
                                }`}
                              >
                                {dias === 0 ? "Hoy" : `${dias} día${dias === 1 ? "" : "s"}`}
                              </span>
                              <MoverOT
                                otId={ot.id}
                                estado={estado}
                                patente={ot.vehiculo?.patente ?? ot.numero}
                              />
                            </div>
                          </article>
                        );
                      })}
                    </div>
                  </section>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
