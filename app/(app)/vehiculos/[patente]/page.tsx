import { ArrowLeft, Car, Gauge, Phone, Plus, User } from "lucide-react";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import { ESTADO_LABEL, ESTADO_TONO } from "@/lib/estados-ot";
import { formatearPatente, normalizarPatente } from "@/lib/patente";
import { formatearTelefono, paraWhatsApp } from "@/lib/telefono";
import { crearClienteServidor, obtenerSesion } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

const money = (n: number) =>
  new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS", maximumFractionDigits: 0 }).format(n);

const fecha = (iso: string) =>
  new Intl.DateTimeFormat("es-AR", { day: "2-digit", month: "short", year: "numeric" }).format(new Date(iso));

/**
 * Historial de un vehículo.
 *
 * La clave es la patente y no el id: es lo que el mostrador tiene a mano
 * cuando entra un auto, y lo que se puede dictar por teléfono.
 *
 * El historial pertenece al AUTO, no al dueño. Por eso se listan todas las
 * órdenes del vehículo y aparte quiénes fueron sus dueños a lo largo del
 * tiempo: los autos se venden y lo que se le hizo sigue siendo del auto.
 */
export default async function HistorialVehiculo({
  params,
}: {
  params: Promise<{ patente: string }>;
}) {
  const sesion = await obtenerSesion();
  if (!sesion?.perfil) redirect("/login");

  const { patente } = await params;
  const norm = normalizarPatente(decodeURIComponent(patente));
  const supabase = await crearClienteServidor();

  const { data: vehiculo } = await supabase
    .from("vehiculo")
    .select(
      `id, patente, anio, color, combustible, vin, km_actual, km_actualizado_en,
       marca:marca_id(nombre), modelo:modelo_id(nombre)`,
    )
    .eq("patente_norm", norm)
    .maybeSingle();

  if (!vehiculo) notFound();

  const [{ data: ordenes }, { data: duenos }] = await Promise.all([
    supabase
      .from("orden_trabajo")
      .select("id, numero, estado, fecha_ingreso, km_ingreso, total")
      .eq("vehiculo_id", vehiculo.id)
      .order("fecha_ingreso", { ascending: false }),
    supabase
      .from("vehiculo_cliente")
      .select("desde, hasta, cliente:cliente_id(nombre, apellido, telefono)")
      .eq("vehiculo_id", vehiculo.id)
      .order("desde", { ascending: false }),
  ]);

  const lista = ordenes ?? [];
  const esDueno = sesion.perfil.rol === "dueno";
  const gastado = lista
    .filter((o) => ["entregado", "cerrado"].includes(o.estado))
    .reduce((s, o) => s + Number(o.total ?? 0), 0);

  const vigente = (duenos ?? []).find((d) => !d.hasta);
  const descripcion = [vehiculo.marca?.nombre, vehiculo.modelo?.nombre, vehiculo.anio]
    .filter(Boolean)
    .join(" ");

  return (
    <main className="flex-1 pt-[calc(var(--safe-top)+1.25rem)] pb-4 scroll-inset">
      <div className="contenedor space-y-5">
        <Link
          href="/vehiculos"
          className="entrar inline-flex items-center gap-1.5 text-caption font-medium text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden />
          Volver a autos
        </Link>

        <header className="entrar flex flex-wrap items-end justify-between gap-3" style={{ "--i": 1 } as React.CSSProperties}>
          <div className="space-y-1">
            <p className="t-seccion">{descripcion || "Sin marca ni modelo"}</p>
            <h1 className="text-display text-4xl text-foreground">
              {formatearPatente(vehiculo.patente)}
            </h1>
          </div>
          <Link
            href={`/ot/nueva?patente=${encodeURIComponent(vehiculo.patente)}`}
            className="flex min-h-11 items-center gap-2 rounded-[var(--radius-sm)] bg-accent px-4 text-sm font-semibold text-accent-foreground shadow-[var(--sombra-sutil)] transition-transform hover:brightness-110 active:scale-[0.98]"
          >
            <Plus className="h-4 w-4" strokeWidth={2.5} aria-hidden />
            Nueva orden
          </Link>
        </header>

        <div className="grid gap-5 lg:grid-cols-3">
          <div className="space-y-3 lg:col-span-2">
            <h2 className="t-seccion">Historial ({lista.length})</h2>

            {lista.length === 0 ? (
              <p className="tarjeta px-4 py-10 text-center text-sm text-muted-foreground">
                Este auto todavía no tuvo órdenes de trabajo.
              </p>
            ) : (
              <ul className="space-y-2">
                {lista.map((o, i) => (
                  <li key={o.id} className="entrar" style={{ "--i": i + 2 } as React.CSSProperties}>
                    <Link href={`/ot/${o.id}`} className="tarjeta tarjeta-accion flex items-center gap-3 p-3.5">
                      <span className="min-w-0 flex-1">
                        <span className="block text-sm font-semibold text-foreground">{o.numero}</span>
                        <span className="flex flex-wrap items-center gap-x-2 text-caption text-muted-foreground">
                          <span>{fecha(o.fecha_ingreso)}</span>
                          {o.km_ingreso != null && (
                            <span className="tabular">· {o.km_ingreso.toLocaleString("es-AR")} km</span>
                          )}
                        </span>
                      </span>
                      <span className="flex shrink-0 flex-col items-end gap-1">
                        <span className={`rounded-full px-2.5 py-0.5 text-[0.6875rem] font-semibold ${ESTADO_TONO[o.estado] ?? ""}`}>
                          {ESTADO_LABEL[o.estado] ?? o.estado}
                        </span>
                        {esDueno && Number(o.total) > 0 && (
                          <span className="tabular text-caption font-semibold text-foreground">
                            {money(Number(o.total))}
                          </span>
                        )}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <aside className="space-y-5">
            <section className="tarjeta space-y-3 p-4">
              <h2 className="t-seccion">Ficha</h2>
              <dl className="space-y-2 text-sm">
                <Dato icono={Car} etiqueta="Modelo" valor={descripcion || "—"} />
                <Dato
                  icono={Gauge}
                  etiqueta="Kilómetros"
                  valor={vehiculo.km_actual != null ? `${vehiculo.km_actual.toLocaleString("es-AR")} km` : "Sin registrar"}
                />
                {vehiculo.color && <Dato etiqueta="Color" valor={vehiculo.color} />}
                {vehiculo.combustible && <Dato etiqueta="Combustible" valor={vehiculo.combustible} />}
                {vehiculo.vin && <Dato etiqueta="Chasis" valor={vehiculo.vin} />}
              </dl>
            </section>

            {esDueno && gastado > 0 && (
              <section className="tarjeta space-y-1 p-4">
                <h2 className="t-seccion">Facturado a este auto</h2>
                <p className="t-dato text-foreground">{money(gastado)}</p>
                <p className="text-caption text-muted-foreground">Órdenes entregadas o cerradas</p>
              </section>
            )}

            <section className="space-y-3">
              <h2 className="t-seccion">Dueños</h2>
              {(duenos ?? []).length === 0 ? (
                <p className="tarjeta px-4 py-4 text-caption text-muted-foreground">
                  Sin dueño asignado.
                </p>
              ) : (
                <ul className="tarjeta divide-y divide-border overflow-hidden">
                  {duenos!.map((d, i) => (
                    <li key={i} className="flex items-center gap-2.5 px-3.5 py-3">
                      <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-muted text-muted-foreground">
                        <User className="h-4 w-4" aria-hidden />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-medium text-foreground">
                          {d.cliente?.nombre} {d.cliente?.apellido}
                        </span>
                        <span className="block text-caption text-muted-foreground">
                          {d === vigente ? "Dueño actual" : `Hasta ${d.hasta ? fecha(d.hasta) : "—"}`}
                        </span>
                      </span>
                      {d.cliente?.telefono && (
                        <a
                          href={`https://wa.me/${paraWhatsApp(d.cliente.telefono)}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          aria-label={`Escribir a ${d.cliente.nombre} por WhatsApp`}
                          title={formatearTelefono(d.cliente.telefono)}
                          className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-accent-suave text-accent"
                        >
                          <Phone className="h-4 w-4" aria-hidden />
                        </a>
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </section>
          </aside>
        </div>
      </div>
    </main>
  );
}

function Dato({
  icono: Icono,
  etiqueta,
  valor,
}: {
  icono?: typeof Car;
  etiqueta: string;
  valor: string;
}) {
  return (
    <div className="flex items-center justify-between gap-3">
      <dt className="flex items-center gap-1.5 text-caption text-muted-foreground">
        {Icono && <Icono className="h-3.5 w-3.5" aria-hidden />}
        {etiqueta}
      </dt>
      <dd className="truncate text-right font-medium text-foreground">{valor}</dd>
    </div>
  );
}
