import { Car, Mail, Phone, Users } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";

import { FormCliente } from "@/components/clientes/FormCliente";
import { Buscador, EncabezadoPantalla } from "@/components/ui/EncabezadoPantalla";
import { formatearPatente } from "@/lib/patente";
import { formatearTelefono, paraWhatsApp } from "@/lib/telefono";
import { crearClienteServidor, obtenerSesion } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

/**
 * Clientes del taller.
 *
 * Faltaba: se podía buscar un auto por patente pero no una persona. "¿Qué
 * autos tiene Juan Pérez?" no se podía responder, y es una pregunta que se
 * hace todo el tiempo cuando alguien llama por teléfono.
 */
export default async function PaginaClientes({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const sesion = await obtenerSesion();
  if (!sesion?.perfil) redirect("/login");

  const { q } = await searchParams;
  const supabase = await crearClienteServidor();

  let query = supabase
    .from("cliente")
    .select(
      `id, nombre, apellido, telefono, email, notas,
       vehiculo_cliente ( hasta, vehiculo:vehiculo_id ( patente ) )`,
    )
    .eq("taller_id", sesion.perfil.taller_id)
    .eq("archivado", false)
    .order("nombre")
    .limit(100);

  if (q?.trim()) {
    const limpio = q.trim();
    // También por teléfono: cuando llaman, el número es lo único que se tiene.
    query = query.or(
      `nombre.ilike.%${limpio}%,apellido.ilike.%${limpio}%,telefono.ilike.%${limpio}%`,
    );
  }

  const { data: clientes } = await query;
  const lista = clientes ?? [];

  return (
    <main className="flex-1 pt-[calc(var(--safe-top)+1.25rem)] pb-4 scroll-inset">
      <div className="contenedor space-y-5">
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
                const autos = (c.vehiculo_cliente ?? [])
                  .filter((v) => !v.hasta && v.vehiculo?.patente)
                  .map((v) => v.vehiculo!.patente);

                return (
                  <li
                    key={c.id}
                    className="tarjeta entrar flex flex-col gap-3 p-4"
                    style={{ "--i": i + 2 } as React.CSSProperties}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="truncate text-base font-semibold text-foreground">
                          {c.nombre} {c.apellido}
                        </p>
                        {c.telefono && (
                          <p className="tabular truncate text-caption text-muted-foreground">
                            {formatearTelefono(c.telefono)}
                          </p>
                        )}
                      </div>
                      <FormCliente cliente={c} />
                    </div>

                    {autos.length > 0 ? (
                      <div className="flex flex-wrap gap-1.5">
                        {autos.map((p) => (
                          <Link
                            key={p}
                            href={`/vehiculos/${encodeURIComponent(p)}`}
                            className="text-display flex items-center gap-1.5 rounded-full bg-muted px-2.5 py-1 text-sm tracking-normal text-foreground transition-colors hover:bg-accent-suave hover:text-accent"
                          >
                            <Car className="h-3.5 w-3.5" aria-hidden />
                            {formatearPatente(p)}
                          </Link>
                        ))}
                      </div>
                    ) : (
                      <p className="text-caption text-muted-foreground">Sin autos asignados</p>
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
                          className="flex min-h-10 flex-1 items-center justify-center gap-1.5 rounded-[var(--radius-sm)] bg-emerald-50 text-caption font-semibold text-emerald-700 transition-transform active:scale-[0.98]"
                        >
                          <Phone className="h-3.5 w-3.5" aria-hidden />
                          WhatsApp
                        </a>
                      )}
                      {c.email && (
                        <a
                          href={`mailto:${c.email}`}
                          className="flex min-h-10 flex-1 items-center justify-center gap-1.5 rounded-[var(--radius-sm)] bg-muted text-caption font-semibold text-foreground transition-transform active:scale-[0.98]"
                        >
                          <Mail className="h-3.5 w-3.5" aria-hidden />
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
