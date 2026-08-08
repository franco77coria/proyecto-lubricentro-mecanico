import {
  AlertTriangle,
  ArrowRight,
  Car,
  ClipboardList,
  Clock,
  PackageSearch,
  Plus,
  Wrench,
} from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";

import { crearClienteServidor, obtenerSesion } from "@/lib/supabase/server";
import { ESTADO_LABEL, ESTADO_TONO } from "@/lib/estados-ot";

export const dynamic = "force-dynamic";

const money = (n: number) =>
  new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS", maximumFractionDigits: 0 }).format(n);

export default async function PaginaTablero() {
  const sesion = await obtenerSesion();
  if (!sesion?.perfil) redirect("/onboarding");

  const supabase = await crearClienteServidor();
  const tallerId = sesion.perfil.taller_id;
  const esDueno = sesion.perfil.rol === "dueno";

  const inicioMes = new Date();
  inicioMes.setDate(1);
  inicioMes.setHours(0, 0, 0, 0);

  const [{ data: ordenes }, { data: bajoStock }, { data: delMes }] = await Promise.all([
    supabase
      .from("orden_trabajo")
      .select(
        `id, numero, estado, fecha_ingreso, total,
         vehiculo:vehiculo_id ( patente, marca:marca_id(nombre), modelo:modelo_id(nombre) ),
         cliente:cliente_id ( nombre, apellido )`,
      )
      .eq("taller_id", tallerId)
      .order("fecha_ingreso", { ascending: false })
      .limit(12),
    supabase
      .from("producto")
      .select("id, nombre, stock, stock_min")
      .eq("taller_id", tallerId)
      .eq("bajo_stock", true)
      .eq("activo", true)
      .limit(4),
    supabase
      .from("orden_trabajo")
      .select("total, estado")
      .eq("taller_id", tallerId)
      .gte("fecha_ingreso", inicioMes.toISOString()),
  ]);

  const otList = ordenes ?? [];
  const cuenta = (e: string) => otList.filter((o) => o.estado === e).length;

  const facturadoMes = (delMes ?? [])
    .filter((o) => ["entregado", "cerrado"].includes(o.estado))
    .reduce((s, o) => s + Number(o.total ?? 0), 0);

  const metricas = [
    { etiqueta: "En trabajo", valor: cuenta("en_trabajo"), icono: Wrench, tono: "text-amber-600 bg-amber-50" },
    { etiqueta: "Listos", valor: cuenta("listo"), icono: ClipboardList, tono: "text-emerald-600 bg-emerald-50" },
    { etiqueta: "Esperando rep.", valor: cuenta("esperando_repuesto"), icono: Clock, tono: "text-violet-600 bg-violet-50" },
    { etiqueta: "Presupuestos", valor: cuenta("presupuesto"), icono: PackageSearch, tono: "text-sky-600 bg-sky-50" },
  ];

  return (
    <main className="flex-1 pt-[calc(var(--safe-top)+1.25rem)] pb-4 scroll-inset">
      <div className="contenedor space-y-6">
        <header className="entrar flex flex-wrap items-end justify-between gap-3">
          <div className="space-y-0.5">
            <p className="t-seccion">Tablero</p>
            <h1 className="t-pantalla text-foreground">Hoy en el taller</h1>
          </div>
          {/* En celular esta acción ya vive en la barra inferior. */}
          <Link
            href="/ot/nueva"
            className="hidden min-h-11 items-center gap-2 rounded-[var(--radius-sm)] bg-accent px-4 text-sm font-semibold text-accent-foreground shadow-[var(--sombra-sutil)] transition-transform hover:brightness-110 active:scale-[0.98] sm:flex"
          >
            <Plus className="h-4 w-4" strokeWidth={2.5} aria-hidden />
            Nueva orden
          </Link>
        </header>

        <section className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          {metricas.map((m, i) => {
            const Icono = m.icono;
            return (
              <div
                key={m.etiqueta}
                className="tarjeta entrar flex items-center gap-3 p-3.5"
                style={{ "--i": i + 1 } as React.CSSProperties}
              >
                <span className={`grid h-10 w-10 shrink-0 place-items-center rounded-[var(--radius-sm)] ${m.tono}`}>
                  <Icono className="h-5 w-5" aria-hidden />
                </span>
                <span className="min-w-0">
                  <span className="t-dato block text-foreground">{m.valor}</span>
                  <span className="block truncate text-caption text-muted-foreground">{m.etiqueta}</span>
                </span>
              </div>
            );
          })}
        </section>

        <div className="grid gap-6 lg:grid-cols-3">
          <section className="space-y-3 lg:col-span-2">
            <div className="flex items-center justify-between">
              <h2 className="t-seccion">Órdenes recientes</h2>
              {otList.length > 0 && (
                <Link
                  href="/vehiculos"
                  className="flex items-center gap-1 text-caption font-medium text-accent hover:underline"
                >
                  Ver autos <ArrowRight className="h-3.5 w-3.5" aria-hidden />
                </Link>
              )}
            </div>

            {otList.length === 0 ? (
              <div className="tarjeta entrar flex flex-col items-center gap-3 px-6 py-12 text-center">
                <span className="grid h-12 w-12 place-items-center rounded-full bg-accent-suave text-accent">
                  <Car className="h-6 w-6" aria-hidden />
                </span>
                <p className="max-w-xs text-sm text-muted-foreground">
                  Todavía no cargaste ninguna orden. Empezá por recibir un auto.
                </p>
                <Link
                  href="/ot/nueva"
                  className="mt-1 flex min-h-11 items-center gap-2 rounded-[var(--radius-sm)] bg-accent px-4 text-sm font-semibold text-accent-foreground transition-transform hover:brightness-110 active:scale-[0.98]"
                >
                  <Plus className="h-4 w-4" strokeWidth={2.5} aria-hidden />
                  Crear la primera orden
                </Link>
              </div>
            ) : (
              <ul className="space-y-2">
                {otList.map((ot, i) => (
                  <li key={ot.id} className="entrar" style={{ "--i": i + 2 } as React.CSSProperties}>
                    <Link
                      href={`/ot/${ot.id}`}
                      className="tarjeta tarjeta-accion flex items-center gap-3 p-3"
                    >
                      <span className="grid h-11 w-11 shrink-0 place-items-center rounded-[var(--radius-sm)] bg-muted text-muted-foreground">
                        <Car className="h-5 w-5" aria-hidden />
                      </span>

                      <span className="min-w-0 flex-1">
                        <span className="flex items-baseline gap-2">
                          <span className="text-display text-base tracking-normal text-foreground">
                            {ot.vehiculo?.patente ?? "Sin patente"}
                          </span>
                          <span className="truncate text-caption text-muted-foreground">
                            {[ot.vehiculo?.marca?.nombre, ot.vehiculo?.modelo?.nombre]
                              .filter(Boolean)
                              .join(" ") || "Sin modelo"}
                          </span>
                        </span>
                        <span className="mt-0.5 flex items-center gap-2">
                          <span className="text-caption text-muted-foreground">{ot.numero}</span>
                          {ot.cliente && (
                            <span className="truncate text-caption text-muted-foreground">
                              · {ot.cliente.nombre} {ot.cliente.apellido}
                            </span>
                          )}
                        </span>
                      </span>

                      <span className="flex shrink-0 flex-col items-end gap-1">
                        <span
                          className={`rounded-full px-2.5 py-0.5 text-[0.6875rem] font-semibold ${ESTADO_TONO[ot.estado] ?? ""}`}
                        >
                          {ESTADO_LABEL[ot.estado] ?? ot.estado}
                        </span>
                        {esDueno && Number(ot.total) > 0 && (
                          <span className="tabular text-caption font-semibold text-foreground">
                            {money(Number(ot.total))}
                          </span>
                        )}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <aside className="space-y-6">
            {esDueno && (
              <section className="space-y-3">
                <h2 className="t-seccion">Facturado este mes</h2>
                <div className="tarjeta entrar space-y-1 p-4">
                  <p className="t-dato text-foreground">{money(facturadoMes)}</p>
                  <p className="text-caption text-muted-foreground">
                    Órdenes entregadas o cerradas desde el 1°
                  </p>
                </div>
              </section>
            )}

            <section className="space-y-3">
              <div className="flex items-center justify-between">
                <h2 className="t-seccion">Bajo mínimo</h2>
                <Link href="/stock" className="text-caption font-medium text-accent hover:underline">
                  Ver stock
                </Link>
              </div>

              {(bajoStock ?? []).length === 0 ? (
                <p className="tarjeta px-4 py-5 text-caption text-muted-foreground">
                  Todo el stock está por encima del mínimo.
                </p>
              ) : (
                <ul className="tarjeta divide-y divide-border overflow-hidden">
                  {bajoStock!.map((p) => (
                    <li key={p.id} className="flex items-center gap-2.5 px-3.5 py-3">
                      <AlertTriangle className="h-4 w-4 shrink-0 text-estado-observado" aria-hidden />
                      <span className="min-w-0 flex-1 truncate text-sm text-foreground">{p.nombre}</span>
                      <span className="tabular shrink-0 text-caption font-semibold text-estado-observado">
                        {Number(p.stock)} / {Number(p.stock_min)}
                      </span>
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
