import { Mail, Phone, Users, Car } from "lucide-react";
import Link from "next/link";

import { FormCliente } from "@/components/clientes/FormCliente";
import { Buscador, EncabezadoPantalla } from "@/components/ui/EncabezadoPantalla";
import { PlacaPatente } from "@/components/ui/PlacaPatente";
import { BotonVolverTablero } from "@/components/nav/BotonVolverTablero";
import { formatearTelefono, paraWhatsApp } from "@/lib/telefono";
import { crearClienteServidor } from "@/lib/supabase/server";
import { exigirVista } from "@/lib/permisos";
import { escaparParaFiltroOr } from "@/lib/postgrest";

export const dynamic = "force-dynamic";

export default async function PaginaClientes({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const sesion = await exigirVista("/clientes");

  const { q } = await searchParams;
  const supabase = await crearClienteServidor();

  let query = supabase
    .from("cliente")
    .select(
      `id, nombre, apellido, telefono, email, notas,
       vehiculo_cliente (
         hasta,
         vehiculo:vehiculo_id (
           id, patente, anio, color,
           marca:marca_id(nombre),
           modelo:modelo_id(nombre)
         )
       )`,
    )
    .eq("taller_id", sesion.perfil.taller_id)
    .eq("archivado", false)
    .order("nombre")
    .limit(100);

  if (q?.trim()) {
    const limpio = escaparParaFiltroOr(q.trim());
    query = query.or(
      `nombre.ilike.%${limpio}%,apellido.ilike.%${limpio}%,telefono.ilike.%${limpio}%`,
    );
  }

  const { data: clientes, error: errorClientes } = await query;
  if (errorClientes) console.error("[PaginaClientes] Error buscando clientes:", errorClientes.message);
  const lista = clientes ?? [];

  return (
    <main className="flex-1 pt-[calc(var(--safe-top)+var(--isla-height)+0.75rem)] pb-4 scroll-inset">
      <div className="contenedor space-y-5">
        <div className="flex items-center gap-3">
          <BotonVolverTablero />
        </div>

        <EncabezadoPantalla seccion="Clientes" titulo="Clientes" accion={<FormCliente />} />

        <Buscador valor={q} placeholder="Buscar por nombre o teléfono" />

        {lista.length === 0 ? (
          <div className="tarjeta entrar flex flex-col items-center gap-3 px-6 py-14 text-center">
            <span className="grid h-12 w-12 place-items-center rounded-full bg-accent-suave text-accent">
              <Users className="h-6 w-6" aria-hidden />
            </span>
            <p className="max-w-xs text-sm text-muted-foreground">
              {q
                ? "Nadie coincide con esa búsqueda."
                : "Todavía no hay clientes. Se cargan al recibir un auto o desde acá."}
            </p>
          </div>
        ) : (
          <>
            <p className="text-caption text-muted-foreground">
              {lista.length} {lista.length === 1 ? "cliente" : "clientes"}
            </p>

            <ul className="grid gap-3 lg:grid-cols-2 xl:grid-cols-3">
              {lista.map((c, i) => {
                const vinculos = (c.vehiculo_cliente ?? []) as Array<{
                  hasta?: string | null;
                  vehiculo?: {
                    id: string;
                    patente: string;
                    anio?: number | null;
                    marca?: { nombre: string } | null;
                    modelo?: { nombre: string } | null;
                  } | null;
                }>;
                const autos = vinculos
                  .filter((v) => !v.hasta && v.vehiculo?.patente)
                  .map((v) => ({
                    id: v.vehiculo!.id,
                    patente: v.vehiculo!.patente,
                    anio: v.vehiculo!.anio,
                    marca: v.vehiculo!.marca?.nombre,
                    modelo: v.vehiculo!.modelo?.nombre,
                  }));

                return (
                  <li
                    key={c.id}
                    className="tarjeta entrar flex flex-col gap-3 p-4"
                    style={{ "--i": i + 2 } as React.CSSProperties}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <Link href={`/clientes/${c.id}`} className="min-w-0 group">
                        <p className="truncate text-base font-bold text-foreground group-hover:text-accent transition-colors">
                          {c.nombre} {c.apellido}
                        </p>
                        {c.telefono && (
                          <p className="tabular truncate text-caption text-muted-foreground">
                            {formatearTelefono(c.telefono)}
                          </p>
                        )}
                      </Link>
                      <FormCliente cliente={c} />
                    </div>

                    {/* Flota / Vehículos asociados del cliente */}
                    {autos.length > 0 ? (
                      <div className="space-y-1.5 pt-1">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1">
                          <Car className="h-3 w-3 text-accent" />
                          <span>Vehículos ({autos.length}):</span>
                        </span>
                        <div className="flex flex-col gap-1.5">
                          {autos.map((a) => (
                            <Link
                              key={a.id}
                              href={`/vehiculos/${encodeURIComponent(a.patente)}`}
                              className="flex items-center justify-between gap-2 rounded-xl border border-border/70 bg-muted/40 px-2.5 py-1.5 transition-all hover:border-accent/40 hover:bg-card active:scale-[0.98]"
                            >
                              <div className="flex items-center gap-2 min-w-0">
                                <PlacaPatente patente={a.patente} size="sm" />
                                <span className="text-xs font-semibold text-foreground truncate">
                                  {[a.marca, a.modelo].filter(Boolean).join(" ") || "Sin modelo"}
                                </span>
                              </div>
                              {a.anio && (
                                <span className="text-[11px] font-mono text-muted-foreground shrink-0">
                                  {a.anio}
                                </span>
                              )}
                            </Link>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <p className="text-caption text-muted-foreground italic">Sin autos asociados</p>
                    )}

                    {c.notas && (
                      <p className="line-clamp-2 text-caption text-muted-foreground">{c.notas}</p>
                    )}

                    <div className="mt-auto flex gap-2 pt-1">
                      {c.telefono && (
                        <a
                          href={`https://wa.me/${paraWhatsApp(c.telefono)}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex min-h-12 flex-1 items-center justify-center gap-2 rounded-xl bg-emerald-500/15 text-xs font-black text-emerald-400 border border-emerald-500/30 shadow-sm transition-transform hover:bg-emerald-500/25 active:scale-[0.98]"
                        >
                          <Phone className="h-4 w-4" aria-hidden />
                          WhatsApp
                        </a>
                      )}
                      {c.email && (
                        <a
                          href={`mailto:${c.email}`}
                          className="flex min-h-12 flex-1 items-center justify-center gap-2 rounded-xl bg-muted border border-border text-xs font-bold text-foreground transition-transform hover:bg-muted/80 active:scale-[0.98]"
                        >
                          <Mail className="h-4 w-4" aria-hidden />
                          Email
                        </a>
                      )}
                    </div>
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
