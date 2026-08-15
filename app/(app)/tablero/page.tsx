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
import { MotionCard } from "@/components/ui/motion-card";

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

  const [{ data: ordenes }, { data: bajoStock }, { data: delMes }, { data: estadosActivos }] = await Promise.all([
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
    supabase
      .from("orden_trabajo")
      .select("estado")
      .eq("taller_id", tallerId)
      .not("estado", "in", '("cerrado","anulado","entregado")'),
  ]);

  const otList = ordenes ?? [];
  const cuenta = (e: string) => (estadosActivos ?? []).filter((o) => o.estado === e).length;

  const facturadoMes = (delMes ?? [])
    .filter((o) => ["entregado", "cerrado"].includes(o.estado))
    .reduce((s, o) => s + Number(o.total ?? 0), 0);

  const metricas = [
    { etiqueta: "En trabajo", valor: cuenta("en_trabajo"), icono: Wrench, tono: "text-amber-500 bg-amber-500/10 border-amber-500/20" },
    { etiqueta: "Listos", valor: cuenta("listo"), icono: ClipboardList, tono: "text-emerald-500 bg-emerald-500/10 border-emerald-500/20" },
    { etiqueta: "Esperando rep.", valor: cuenta("esperando_repuesto"), icono: Clock, tono: "text-violet-500 bg-violet-500/10 border-violet-500/20" },
    { etiqueta: "Presupuestos", valor: cuenta("presupuesto"), icono: PackageSearch, tono: "text-sky-500 bg-sky-500/10 border-sky-500/20" },
  ];

  return (
    <main className="flex-1 pt-[calc(var(--safe-top)+1.25rem)] pb-4 scroll-inset">
      <div className="contenedor space-y-8">
        <header className="flex flex-wrap items-end justify-between gap-3">
          <div className="space-y-1">
            <p className="t-seccion text-accent">Tablero</p>
            <h1 className="t-pantalla text-foreground tracking-tight">
              Hoy en el taller
            </h1>
          </div>
          {/* En celular esta acción ya vive en la barra inferior. */}
          <Link
            href="/ot/nueva"
            className="hidden min-h-11 items-center gap-2 rounded-[var(--radius-sm)] bg-accent px-5 py-2 text-sm font-bold text-accent-foreground shadow-[var(--sombra-alta)] transition-all hover:brightness-110 active:scale-[0.96] sm:flex"
          >
            <Plus className="h-5 w-5" strokeWidth={2.5} aria-hidden />
            Nueva orden
          </Link>
        </header>

        <section className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {metricas.map((m, i) => {
            const Icono = m.icono;
            return (
              <MotionCard
                key={m.etiqueta}
                delay={i * 0.05}
                interactive
                className="flex items-center gap-4 p-4"
              >
                <span className={`grid h-12 w-12 shrink-0 place-items-center rounded-[var(--radius-md)] border ${m.tono}`}>
                  <Icono className="h-6 w-6" aria-hidden />
                </span>
                <span className="min-w-0">
                  <span className="t-dato block text-foreground">{m.valor}</span>
                  <span className="block truncate text-caption text-muted-foreground">{m.etiqueta}</span>
                </span>
              </MotionCard>
            );
          })}
        </section>

        <div className="grid gap-6 lg:grid-cols-3">
          <section className="space-y-4 lg:col-span-2">
            <div className="flex items-center justify-between">
              <h2 className="t-seccion">Órdenes recientes</h2>
              {otList.length > 0 && (
                <Link
                  href="/vehiculos"
                  className="flex items-center gap-1 text-caption font-medium text-accent hover:text-accent/80 transition-colors"
                >
                  Ver autos <ArrowRight className="h-3.5 w-3.5" aria-hidden />
                </Link>
              )}
            </div>

            {otList.length === 0 ? (
              <MotionCard delay={0.2} className="flex flex-col items-center gap-4 px-6 py-16 text-center border-dashed">
                <span className="grid h-16 w-16 place-items-center rounded-full bg-accent/10 text-accent ring-4 ring-accent/5">
                  <Car className="h-8 w-8" aria-hidden />
                </span>
                <p className="max-w-xs text-sm text-muted-foreground">
                  Todavía no cargaste ninguna orden. Empezá por recibir un auto.
                </p>
                <Link
                  href="/ot/nueva"
                  className="mt-2 flex min-h-11 items-center gap-2 rounded-[var(--radius-sm)] bg-accent px-6 py-2 text-sm font-bold text-accent-foreground transition-transform hover:brightness-110 active:scale-[0.96]"
                >
                  <Plus className="h-4 w-4" strokeWidth={2.5} aria-hidden />
                  Crear la primera orden
                </Link>
              </MotionCard>
            ) : (
              <ul className="space-y-3">
                {otList.map((ot, i) => (
                  <li key={ot.id}>
                    <MotionCard delay={0.2 + (i * 0.05)} interactive className="p-0">
                      <Link
                        href={`/ot/${ot.id}`}
                        className="flex items-center gap-4 p-4 w-full h-full"
                      >
                        <span className="grid h-12 w-12 shrink-0 place-items-center rounded-[var(--radius-md)] bg-muted/50 text-muted-foreground border border-border/50">
                          <Car className="h-6 w-6" aria-hidden />
                        </span>

                        <span className="min-w-0 flex-1">
                          <span className="flex items-baseline gap-2">
                            <span className="text-display text-lg tracking-normal text-foreground">
                              {ot.vehiculo?.patente ?? "Sin patente"}
                            </span>
                            <span className="truncate text-caption text-muted-foreground">
                              {[ot.vehiculo?.marca?.nombre, ot.vehiculo?.modelo?.nombre]
                                .filter(Boolean)
                                .join(" ") || "Sin modelo"}
                            </span>
                          </span>
                          <span className="mt-1 flex items-center gap-2">
                            <span className="text-caption font-mono text-muted-foreground/70">{ot.numero}</span>
                            {ot.cliente && (
                              <span className="truncate text-caption text-muted-foreground">
                                · {ot.cliente.nombre} {ot.cliente.apellido}
                              </span>
                            )}
                          </span>
                        </span>

                        <span className="flex shrink-0 flex-col items-end gap-1.5">
                          <span
                            className={`rounded-full px-3 py-0.5 text-[0.6875rem] font-bold tracking-wide uppercase ${ESTADO_TONO[ot.estado] ?? ""}`}
                          >
                            {ESTADO_LABEL[ot.estado] ?? ot.estado}
                          </span>
                          {esDueno && Number(ot.total) > 0 && (
                            <span className="tabular text-sm font-bold text-foreground">
                              {money(Number(ot.total))}
                            </span>
                          )}
                        </span>
                      </Link>
                    </MotionCard>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <aside className="space-y-8">
            {esDueno && (
              <section className="space-y-4">
                <h2 className="t-seccion">Facturado este mes</h2>
                <MotionCard delay={0.3} interactive className="space-y-2 p-6 bg-gradient-to-br from-card to-background border-accent/20 relative overflow-hidden group">
                  <div className="absolute -right-10 -top-10 h-32 w-32 bg-accent/10 blur-3xl rounded-full group-hover:bg-accent/20 transition-colors duration-500" />
                  <p className="t-dato text-foreground text-3xl">{money(facturadoMes)}</p>
                  <p className="text-caption text-muted-foreground">
                    Órdenes entregadas o cerradas desde el 1°
                  </p>
                </MotionCard>
              </section>
            )}

            <section className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="t-seccion">Bajo mínimo</h2>
                <Link href="/stock" className="text-caption font-medium text-accent hover:text-accent/80 transition-colors">
                  Ver stock
                </Link>
              </div>

              {(bajoStock ?? []).length === 0 ? (
                <MotionCard delay={0.4} className="px-5 py-6 text-center">
                  <p className="text-caption text-muted-foreground">
                    Todo el stock está por encima del mínimo.
                  </p>
                </MotionCard>
              ) : (
                <MotionCard delay={0.4} className="overflow-hidden">
                  <ul className="divide-y divide-border/50">
                    {bajoStock!.map((p) => (
                      <li key={p.id} className="flex items-center gap-3 px-4 py-3.5 hover:bg-muted/20 transition-colors">
                        <AlertTriangle className="h-4 w-4 shrink-0 text-estado-observado drop-shadow-[0_0_8px_rgba(245,158,11,0.5)]" aria-hidden />
                        <span className="min-w-0 flex-1 truncate text-sm text-foreground">{p.nombre}</span>
                        <span className="tabular shrink-0 text-caption font-bold text-estado-observado">
                          {Number(p.stock)} / {Number(p.stock_min)}
                        </span>
                      </li>
                    ))}
                  </ul>
                </MotionCard>
              )}
            </section>
          </aside>
        </div>
      </div>
    </main>
  );
}
