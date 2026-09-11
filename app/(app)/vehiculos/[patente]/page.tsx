import { ArrowLeft, Car, CheckCircle2, Gauge, Phone, Plus, User, Wrench } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";

import { EditarVehiculo } from "@/components/vehiculos/EditarVehiculo";
import { PlacaPatente } from "@/components/ui/PlacaPatente";
import { ESTADO_LABEL, ESTADO_TONO } from "@/lib/estados-ot";
import { formatearPatente, normalizarPatente } from "@/lib/patente";
import { formatearTelefono, paraWhatsApp } from "@/lib/telefono";
import { crearClienteServidor } from "@/lib/supabase/server";
import { exigirVista } from "@/lib/permisos";
import { obtenerAjustesTaller } from "@/lib/taller";
import { formatearFecha, formatearMoneda, formatearNumero } from "@/lib/i18n";
import { obtenerResponsablesOT, formatearRol, type DatosOTResponsables } from "@/lib/ot-usuarios";

export const dynamic = "force-dynamic";

/* El formato de plata y de fecha sale del taller. */



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
  const sesion = await exigirVista("/vehiculos");
  const { idioma, moneda } = await obtenerAjustesTaller();
  const money = (n: number) => formatearMoneda(n, moneda, idioma);
  const fecha = (iso: string) =>
    formatearFecha(iso, idioma, { day: "2-digit", month: "short", year: "numeric" });

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
    .eq("taller_id", sesion.perfil.taller_id)
    .maybeSingle();

  if (!vehiculo) notFound();

  const [{ data: ordenes }, { data: duenos }, { data: clientesTaller }] = await Promise.all([
    supabase
      .from("orden_trabajo")
      .select(`
        id, numero, estado, fecha_ingreso, fecha_entrega, km_ingreso, total, asignado_a,
        mecanico:asignado_a ( user_id, nombre, rol ),
        logs:ot_estado_log (
          id, estado_anterior, estado_nuevo, creado_en, usuario_id,
          usuario:usuario_id ( user_id, nombre, rol )
        )
      `)
      .eq("taller_id", sesion.perfil.taller_id)
      .eq("vehiculo_id", vehiculo.id)
      .order("fecha_ingreso", { ascending: false }),
    supabase
      .from("vehiculo_cliente")
      .select("desde, hasta, cliente:cliente_id(id, nombre, apellido, telefono)")
      .eq("taller_id", sesion.perfil.taller_id)
      .eq("vehiculo_id", vehiculo.id)
      .order("desde", { ascending: false }),
    supabase
      .from("cliente")
      .select("id, nombre, apellido")
      .eq("taller_id", sesion.perfil.taller_id)
      .eq("archivado", false)
      .order("nombre")
      .limit(200),
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
    <main className="flex-1 pt-[calc(var(--safe-top)+var(--isla-height)+0.75rem)] pb-8 scroll-inset">
      <div className="contenedor space-y-5">
        <Link
          href="/vehiculos"
          className="entrar inline-flex items-center gap-1.5 text-caption font-medium text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden />
          Volver a autos
        </Link>

        <header className="entrar flex flex-wrap items-end justify-between gap-4" style={{ "--i": 1 } as React.CSSProperties}>
          <div className="flex flex-col sm:flex-row sm:items-center gap-3.5">
            <PlacaPatente patente={vehiculo.patente} size="lg" />
            <div>
              <p className="t-seccion">{descripcion || "Sin marca ni modelo"}</p>
              <h1 className="text-display text-2xl sm:text-3xl text-foreground font-extrabold tracking-tight">
                {formatearPatente(vehiculo.patente)}
              </h1>
            </div>
          </div>
          <Link
            href={`/ot/nueva?patente=${encodeURIComponent(vehiculo.patente)}`}
            className="flex min-h-12 items-center gap-2 rounded-xl bg-accent px-5 text-sm font-semibold text-accent-foreground shadow-[var(--sombra-sutil)] transition-transform hover:brightness-110 active:scale-[0.98]"
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
              <ul className="space-y-2.5">
                {lista.map((o, i) => {
                  const resp = obtenerResponsablesOT(o as unknown as DatosOTResponsables);
                  return (
                    <li key={o.id} className="entrar" style={{ "--i": i + 2 } as React.CSSProperties}>
                      <Link
                        href={`/ot/${o.id}`}
                        className="tarjeta tarjeta-accion flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4"
                      >
                        <div className="min-w-0 flex-1 space-y-1.5">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-bold text-foreground">#{o.numero}</span>
                            <span
                              className={`rounded-full px-2.5 py-0.5 text-[0.6875rem] font-semibold ${
                                ESTADO_TONO[o.estado] ?? ""
                              }`}
                            >
                              {ESTADO_LABEL[o.estado] ?? o.estado}
                            </span>
                          </div>
                          <div className="flex flex-wrap items-center gap-x-2.5 text-caption text-muted-foreground">
                            <span>Ingreso: {fecha(o.fecha_ingreso)}</span>
                            {o.km_ingreso != null && (
                              <span className="tabular">· {formatearNumero(o.km_ingreso, idioma)} km</span>
                            )}
                          </div>

                          {/* Responsables de la orden: Mecánico asignado y quién la cerró */}
                          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 pt-1 text-xs">
                            {resp.mecanicoNombre ? (
                              <span className="inline-flex items-center gap-1.5 text-foreground/90 font-medium">
                                <Wrench className="h-3.5 w-3.5 text-accent shrink-0" aria-hidden />
                                <span>
                                  Mecánico:{" "}
                                  <strong className="font-semibold text-foreground">
                                    {resp.mecanicoNombre}
                                  </strong>
                                </span>
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1.5 text-muted-foreground">
                                <Wrench className="h-3.5 w-3.5 text-muted-foreground/60 shrink-0" aria-hidden />
                                <span>Sin mecánico asignado</span>
                              </span>
                            )}

                            {resp.cerradoPorNombre && (
                              <span className="inline-flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 font-medium">
                                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 shrink-0" aria-hidden />
                                <span>
                                  Cerrado por:{" "}
                                  <strong className="font-semibold">
                                    {resp.cerradoPorNombre}
                                  </strong>{" "}
                                  <span className="text-muted-foreground font-normal">
                                    ({formatearRol(resp.cerradoPorRol)})
                                  </span>
                                </span>
                              </span>
                            )}
                          </div>
                        </div>

                        <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-center border-t sm:border-t-0 pt-2 sm:pt-0 border-border/60 shrink-0 gap-1">
                          {esDueno && Number(o.total) > 0 && (
                            <span className="tabular text-sm font-bold text-foreground">
                              {money(Number(o.total))}
                            </span>
                          )}
                          {resp.cerradoEn && (
                            <span className="text-[11px] text-muted-foreground">
                              Entregado: {fecha(resp.cerradoEn)}
                            </span>
                          )}
                        </div>
                      </Link>
                    </li>
                  );
                })}
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
                  valor={vehiculo.km_actual != null ? `${formatearNumero(vehiculo.km_actual, idioma)} km` : "Sin registrar"}
                />
                {vehiculo.color && <Dato etiqueta="Color" valor={vehiculo.color} />}
                {vehiculo.combustible && <Dato etiqueta="Combustible" valor={vehiculo.combustible} />}
                {vehiculo.vin && <Dato etiqueta="Chasis" valor={vehiculo.vin} />}
              </dl>
              <EditarVehiculo
                vehiculo={{
                  id: vehiculo.id,
                  anio: vehiculo.anio,
                  color: vehiculo.color,
                  vin: vehiculo.vin,
                  km_actual: vehiculo.km_actual,
                  combustible: vehiculo.combustible,
                }}
                clientes={clientesTaller ?? []}
                duenoActualId={vigente?.cliente?.id ?? null}
              />
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
                          className="grid min-h-12 min-w-12 place-items-center rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/20 active:scale-95 transition-all"
                        >
                          <Phone className="h-4.5 w-4.5" aria-hidden />
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
