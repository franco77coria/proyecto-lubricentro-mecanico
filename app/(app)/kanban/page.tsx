import { Car, Wrench } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";

import { MoverOT } from "@/components/kanban/MoverOT";
import { EncabezadoPantalla } from "@/components/ui/EncabezadoPantalla";
import { PlacaPatente } from "@/components/ui/PlacaPatente";
import { COLUMNAS_KANBAN, ESTADO_TONO, etiquetaEstado, type EstadoDb } from "@/lib/estados-ot";
import { crearClienteServidor, obtenerSesion } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

/** Cuántos días hace que el auto está en el taller. */
function diasEn(iso: string): number {
  const ms = Date.now() - new Date(iso).getTime();
  return Math.max(0, Math.floor(ms / 86_400_000));
}

interface OTKanban {
  id: string;
  numero: string;
  estado: EstadoDb;
  fecha_ingreso: string;
  total?: number | null;
  asignado_a?: string | null;
  vehiculo?: {
    patente: string;
    marca?: { nombre: string } | null;
    modelo?: { nombre: string } | null;
  } | null;
  cliente?: {
    nombre: string;
    apellido?: string | null;
  } | null;
  mecanico?: {
    nombre: string | null;
  } | null;
}

export default async function PaginaKanban() {
  const sesion = await obtenerSesion();
  if (!sesion?.perfil) redirect("/login");

  const supabase = await crearClienteServidor();
  const { data: ordenes } = await supabase
    .from("orden_trabajo")
    .select(
      `id, numero, estado, fecha_ingreso, total, asignado_a,
       vehiculo:vehiculo_id ( patente, marca:marca_id(nombre), modelo:modelo_id(nombre) ),
       cliente:cliente_id ( nombre, apellido ),
       mecanico:asignado_a ( nombre )`,
    )
    .eq("taller_id", sesion.perfil.taller_id)
    .in("estado", [...COLUMNAS_KANBAN])
    .order("fecha_ingreso", { ascending: true })
    .limit(300);

  const lista = (ordenes || []) as unknown as OTKanban[];
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
            <span className="grid h-12 w-12 place-items-center rounded-full bg-accent/10 text-accent">
              <Car className="h-6 w-6" aria-hidden />
            </span>
            <p className="max-w-sm text-sm text-muted-foreground">
              No hay autos en el taller. Las órdenes entregadas y cerradas no
              aparecen acá a propósito: el tablero muestra lo que hay en fosa o elevador.
            </p>
          </div>
        ) : (
          <div className="-mx-4 overflow-x-auto px-4 pb-3">
            <div className="flex gap-3.5" style={{ minWidth: "min-content" }}>
              {COLUMNAS_KANBAN.map((estado) => {
                const items = porEstado(estado);
                return (
                  <section key={estado} className="flex w-[17.5rem] shrink-0 flex-col gap-2.5">
                    <header className="flex items-center justify-between gap-2 px-1.5">
                      <h2 className="truncate text-caption font-black uppercase tracking-wider text-muted-foreground">
                        {etiquetaEstado(estado)}
                      </h2>
                      <span
                        className={`shrink-0 rounded-full px-2 py-0.5 text-[0.6875rem] font-black ${ESTADO_TONO[estado] ?? "bg-muted"}`}
                      >
                        {items.length}
                      </span>
                    </header>

                    <div className="flex flex-col gap-2.5">
                      {items.length === 0 && (
                        <p className="rounded-2xl border border-dashed border-border/80 px-3 py-6 text-center text-caption text-muted-foreground">
                          Vacío
                        </p>
                      )}

                      {items.map((ot) => {
                        const dias = diasEn(ot.fecha_ingreso);
                        const mecanicoNombre = ot.mecanico?.nombre;

                        return (
                          <article
                            key={ot.id}
                            className="rounded-2xl border border-border/80 bg-card p-3.5 shadow-sm space-y-2.5 hover:border-accent/40 transition-all"
                          >
                            <Link href={`/ot/${ot.id}`} className="block space-y-2">
                              <div className="flex items-center justify-between gap-2">
                                {ot.vehiculo?.patente ? (
                                  <PlacaPatente patente={ot.vehiculo.patente} size="sm" />
                                ) : (
                                  <span className="font-mono text-xs font-bold text-muted-foreground">
                                    #{ot.numero}
                                  </span>
                                )}
                                <span className="font-mono text-[11px] text-muted-foreground font-semibold">
                                  #{ot.numero}
                                </span>
                              </div>

                              <div>
                                <span className="block truncate text-xs font-bold text-foreground">
                                  {[ot.vehiculo?.marca?.nombre, ot.vehiculo?.modelo?.nombre]
                                    .filter(Boolean)
                                    .join(" ") || "Sin modelo"}
                                </span>
                                {ot.cliente && (
                                  <span className="block truncate text-[11px] text-muted-foreground mt-0.5">
                                    {ot.cliente.nombre} {ot.cliente.apellido}
                                  </span>
                                )}
                              </div>

                              {mecanicoNombre && (
                                <div className="flex items-center gap-1 text-[11px] font-semibold text-accent bg-accent/10 rounded-lg px-2 py-0.5 w-fit">
                                  <Wrench className="h-3 w-3" />
                                  <span className="truncate">{mecanicoNombre}</span>
                                </div>
                              )}
                            </Link>

                            <div className="flex items-center justify-between gap-2 border-t border-border/60 pt-2">
                              <span
                                className={`text-[11px] font-bold ${
                                  dias >= 4 ? "text-amber-500 font-black" : "text-muted-foreground"
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
