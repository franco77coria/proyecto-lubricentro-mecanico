import {
  AlertTriangle,
  ArrowRight,
  CalendarDays,
  Car,
  CheckCircle2,
  Clock,
  Gauge,
  Layers,
  PackageSearch,
  Plus,
  TrendingUp,
  Wrench,
} from "lucide-react";
import Link from "next/link";

import { crearClienteServidor } from "@/lib/supabase/server";
import { ESTADO_LABEL, ESTADO_TONO } from "@/lib/estados-ot";
import { listarTurnos } from "@/lib/actions/turnos";
import { MotionCard } from "@/components/ui/motion-card";
import { PlacaPatente } from "@/components/ui/PlacaPatente";
import { exigirVista } from "@/lib/permisos";
import { obtenerAjustesTaller } from "@/lib/taller";
import { formatearMoneda, formatearNumero, localeDe } from "@/lib/i18n";

export const dynamic = "force-dynamic";

/* El formato de plata sale del taller. */

export default async function PaginaTablero() {
  const sesion = await exigirVista("/tablero");
  const { idioma, moneda } = await obtenerAjustesTaller();
  const money = (n: number) => formatearMoneda(n, moneda, idioma);
  const localeTablero = localeDe(idioma);

  const supabase = await crearClienteServidor();
  const tallerId = sesion.perfil.taller_id;
  const esDueno = sesion.perfil.rol === "dueno";

  const inicioMes = new Date();
  inicioMes.setDate(1);
  inicioMes.setHours(0, 0, 0, 0);

  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);
  const finHoy = new Date(hoy);
  finHoy.setHours(23, 59, 59, 999);

  const [
    { data: ordenes },
    { data: bajoStock },
    { data: delMes },
    { data: estadosActivos },
    turnosHoy,
  ] = await Promise.all([
    supabase
      .from("orden_trabajo")
      .select(
        `id, numero, estado, fecha_ingreso, total, km_ingreso, observaciones,
         vehiculo:vehiculo_id ( patente, notas, marca:marca_id(nombre), modelo:modelo_id(nombre) ),
         cliente:cliente_id ( nombre, apellido, telefono )`,
      )
      .eq("taller_id", tallerId)
      .order("fecha_ingreso", { ascending: false })
      .limit(10),
    supabase
      .from("producto")
      .select("id, nombre, stock, stock_min, categoria")
      .eq("taller_id", tallerId)
      .eq("bajo_stock", true)
      .eq("activo", true)
      .limit(5),
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
    listarTurnos(hoy, finHoy),
  ]);

  const otList = ordenes ?? [];
  const cuenta = (e: string) => (estadosActivos ?? []).filter((o) => o.estado === e).length;

  const facturadoMes = (delMes ?? [])
    .filter((o) => ["entregado", "cerrado"].includes(o.estado))
    .reduce((s, o) => s + Number(o.total ?? 0), 0);

  const totalActivas = (estadosActivos ?? []).length;

  const metricas = [
    {
      etiqueta: "En Fosa / Trabajo",
      valor: cuenta("en_trabajo"),
      icono: Wrench,
      tono: "text-amber-500 bg-amber-500/10 border-amber-500/30 shadow-[0_0_15px_rgba(245,158,11,0.15)]",
      badge: "En proceso",
    },
    {
      etiqueta: "Listos p/ Entregar",
      valor: cuenta("listo"),
      icono: CheckCircle2,
      tono: "text-emerald-400 bg-emerald-500/10 border-emerald-500/30 shadow-[0_0_15px_rgba(34,197,94,0.15)]",
      badge: "Finalizados",
    },
    {
      etiqueta: "Esperando Repuesto",
      valor: cuenta("esperando_repuesto"),
      icono: Clock,
      tono: "text-violet-400 bg-violet-500/10 border-violet-500/30 shadow-[0_0_15px_rgba(168,85,247,0.15)]",
      badge: "Piezas",
    },
    {
      etiqueta: "Presupuestos / Aprob.",
      valor: cuenta("presupuesto") + cuenta("aprobado") + cuenta("recibido"),
      icono: PackageSearch,
      tono: "text-sky-400 bg-sky-500/10 border-sky-500/30 shadow-[0_0_15px_rgba(56,189,248,0.15)]",
      badge: "Recepción",
    },
  ];

  return (
    <main className="flex-1 pt-[calc(var(--safe-top)+1.25rem)] pb-12 scroll-inset">
      <div className="contenedor space-y-8">
        {/* HUD Header Automotor */}
        <header className="flex flex-wrap items-center justify-between gap-4 rounded-3xl border border-border/80 bg-gradient-to-r from-card via-card/90 to-card-elevada p-5 sm:p-7 shadow-xl">
          <div className="space-y-1.5 min-w-0">
            <div className="flex items-center gap-2">
              <span className="flex h-2.5 w-2.5 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500" />
              </span>
              <p className="text-[11px] font-black uppercase tracking-widest text-accent">
                Fosa &amp; Taller en Vivo
              </p>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-foreground flex items-center gap-3">
              Tablero de Operaciones
            </h1>
            <p className="text-xs text-muted-foreground font-medium">
              {totalActivas} vehículos en circuito de servicio hoy
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/kanban"
              className="flex min-h-11 items-center gap-2 rounded-2xl border border-border/80 bg-card/80 px-4 py-2 text-xs font-bold text-foreground transition-all hover:bg-muted active:scale-95 shadow-sm"
            >
              <Layers className="h-4 w-4 text-accent" />
              <span>Ver Kanban</span>
            </Link>

            <Link
              href="/ot/nueva"
              className="flex min-h-11 items-center gap-2 rounded-2xl bg-gradient-to-r from-accent to-amber-500 px-5 py-2 text-sm font-black text-white shadow-lg shadow-accent/25 transition-all hover:brightness-110 active:scale-95"
            >
              <Plus className="h-5 w-5 stroke-[3]" />
              <span>Nueva Orden</span>
            </Link>
          </div>
        </header>

        {/* Telemetry / Cockpit KPIs */}
        <section className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
          {metricas.map((m, i) => {
            const Icono = m.icono;
            return (
              <MotionCard
                key={m.etiqueta}
                delay={i * 0.05}
                interactive
                className="group relative overflow-hidden rounded-3xl border border-border/80 bg-card p-4 sm:p-5 shadow-lg transition-all hover:border-accent/40"
              >
                <div className="flex items-center justify-between pb-3">
                  <span className={`grid h-11 w-11 sm:h-12 sm:w-12 place-items-center rounded-2xl border ${m.tono} transition-transform group-hover:scale-105`}>
                    <Icono className="h-5 w-5 sm:h-6 sm:w-6" aria-hidden />
                  </span>
                  <span className="rounded-full bg-muted/60 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                    {m.badge}
                  </span>
                </div>
                <div className="mt-1">
                  <span className="text-3xl sm:text-4xl font-black tabular-nums text-foreground tracking-tight">
                    {m.valor}
                  </span>
                  <span className="block truncate text-xs font-bold text-muted-foreground mt-0.5">
                    {m.etiqueta}
                  </span>
                </div>
              </MotionCard>
            );
          })}
        </section>

        {/* Panel Principal: Órdenes Recientes & Widgets */}
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Órdenes Recientes con Placas Patentes y Telemetría */}
          <section className="space-y-4 lg:col-span-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Gauge className="h-5 w-5 text-accent" />
                <h2 className="text-sm font-black uppercase tracking-wider text-foreground">
                  Flujo de Vehículos Recientes
                </h2>
              </div>
              {otList.length > 0 && (
                <Link
                  href="/vehiculos"
                  className="flex items-center gap-1 text-xs font-bold text-accent hover:text-accent/80 transition-colors"
                >
                  Ver todos <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              )}
            </div>

            {otList.length === 0 ? (
              <MotionCard delay={0.2} className="flex flex-col items-center gap-4 rounded-3xl px-6 py-16 text-center border-dashed">
                <span className="grid h-16 w-16 place-items-center rounded-full bg-accent/10 text-accent ring-8 ring-accent/5">
                  <Car className="h-8 w-8" aria-hidden />
                </span>
                <p className="max-w-xs text-sm text-muted-foreground font-medium">
                  Todavía no hay órdenes registradas. Creá la primera para empezar el circuito.
                </p>
                <Link
                  href="/ot/nueva"
                  className="mt-2 flex min-h-11 items-center gap-2 rounded-2xl bg-accent px-6 py-2 text-sm font-black text-white shadow-md transition-transform hover:brightness-110 active:scale-95"
                >
                  <Plus className="h-4 w-4 stroke-[3]" />
                  Crear la primera orden
                </Link>
              </MotionCard>
            ) : (
              <ul className="space-y-3">
                {otList.map((ot, i) => {
                  const patente = ot.vehiculo?.patente || "MUN001";
                  const modeloTexto =
                    [ot.vehiculo?.marca?.nombre, ot.vehiculo?.modelo?.nombre].filter(Boolean).join(" ") ||
                    ot.vehiculo?.notas ||
                    "Vehículo en taller";

                  return (
                    <li key={ot.id}>
                      <MotionCard
                        delay={0.15 + i * 0.04}
                        interactive
                        className="group overflow-hidden rounded-3xl border border-border/80 bg-card p-0 shadow-md transition-all hover:border-accent/50 hover:shadow-xl"
                      >
                        <Link
                          href={`/ot/${ot.id}`}
                          className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 sm:p-5 w-full"
                        >
                          <div className="flex items-center gap-4 min-w-0">
                            {/* Placa Patente Vectorizada */}
                            <PlacaPatente patente={patente} size="sm" className="shrink-0 shadow-sm" />

                            <div className="min-w-0 flex-1 space-y-0.5">
                              <span className="block truncate text-base font-black tracking-tight text-foreground group-hover:text-accent transition-colors">
                                {modeloTexto}
                              </span>
                              <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground font-medium">
                                <span className="font-mono font-bold text-accent">{ot.numero}</span>
                                {ot.cliente && (
                                  <span className="truncate">
                                    · {ot.cliente.nombre} {ot.cliente.apellido || ""}
                                  </span>
                                )}
                                {Number(ot.km_ingreso) > 0 && (
                                  <span className="hidden sm:inline tabular-nums">
                                    · {formatearNumero(Number(ot.km_ingreso), idioma)} km
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0 pt-2 sm:pt-0 border-t border-border/40 sm:border-0">
                            <span
                              className={`rounded-full px-3.5 py-1 text-[11px] font-black uppercase tracking-wider ${
                                ESTADO_TONO[ot.estado] ?? "bg-muted text-foreground"
                              }`}
                            >
                              {ESTADO_LABEL[ot.estado] ?? ot.estado}
                            </span>
                            {esDueno && Number(ot.total) > 0 && (
                              <span className="text-base font-black tabular-nums text-foreground">
                                {money(Number(ot.total))}
                              </span>
                            )}
                          </div>
                        </Link>
                      </MotionCard>
                    </li>
                  );
                })}
              </ul>
            )}
          </section>

          {/* Barra Lateral de Control: Facturación, Stock & Turnos */}
          <aside className="space-y-6">
            {/* Facturación del Mes */}
            {esDueno && (
              <section className="space-y-3">
                <h2 className="text-xs font-black uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                  <TrendingUp className="h-4 w-4 text-emerald-400" />
                  Rendimiento del Mes
                </h2>
                <MotionCard
                  delay={0.25}
                  interactive
                  className="relative overflow-hidden rounded-3xl border border-emerald-500/30 bg-gradient-to-br from-card via-card to-emerald-950/20 p-5 shadow-lg"
                >
                  <div className="absolute -right-8 -top-8 h-28 w-28 bg-emerald-500/10 blur-2xl rounded-full" />
                  <p className="text-3xl font-black text-foreground tabular-nums tracking-tight">
                    {money(facturadoMes)}
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground font-semibold">
                    Facturado en órdenes entregadas este mes
                  </p>
                </MotionCard>
              </section>
            )}

            {/* Turnos de Hoy */}
            <section className="space-y-3">
              <div className="flex items-center justify-between">
                <h2 className="text-xs font-black uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                  <CalendarDays className="h-4 w-4 text-accent" />
                  Turnos de Hoy
                </h2>
                <Link
                  href="/turnos"
                  className="text-xs font-bold text-accent hover:underline"
                >
                  Ver agenda
                </Link>
              </div>

              {(turnosHoy ?? []).length === 0 ? (
                <MotionCard delay={0.3} className="rounded-3xl p-4 text-center">
                  <p className="text-xs text-muted-foreground font-medium">
                    No hay turnos programados para hoy.
                  </p>
                </MotionCard>
              ) : (
                <MotionCard delay={0.3} className="overflow-hidden rounded-3xl border border-border/80 bg-card p-0 shadow-md">
                  <ul className="divide-y divide-border/50">
                    {turnosHoy!.map((t) => {
                      const horaStr = new Date(t.fecha_hora).toLocaleTimeString(localeTablero, {
                        hour: "2-digit",
                        minute: "2-digit",
                      });
                      return (
                        <li key={t.id} className="flex items-center justify-between gap-3 p-3.5 hover:bg-muted/30 transition-colors">
                          <div className="min-w-0">
                            <span className="block truncate text-xs font-bold text-foreground">
                              {t.motivo}
                            </span>
                            <span className="text-[10px] font-semibold text-muted-foreground">
                              Confirmado
                            </span>
                          </div>
                          <span className="rounded-xl bg-accent/10 px-2.5 py-1 text-xs font-black text-accent tabular-nums">
                            {horaStr} hs
                          </span>
                        </li>
                      );
                    })}
                  </ul>
                </MotionCard>
              )}
            </section>

            {/* Repuestos Bajo Mínimo */}
            <section className="space-y-3">
              <div className="flex items-center justify-between">
                <h2 className="text-xs font-black uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                  <AlertTriangle className="h-4 w-4 text-amber-500" />
                  Stock Crítico
                </h2>
                <Link
                  href="/stock"
                  className="text-xs font-bold text-accent hover:underline"
                >
                  Ver stock
                </Link>
              </div>

              {(bajoStock ?? []).length === 0 ? (
                <MotionCard delay={0.35} className="rounded-3xl p-4 text-center">
                  <p className="text-xs text-muted-foreground font-medium">
                    Todos los fluidos y filtros están en nivel óptimo.
                  </p>
                </MotionCard>
              ) : (
                <MotionCard delay={0.35} className="overflow-hidden rounded-3xl border border-border/80 bg-card p-0 shadow-md">
                  <ul className="divide-y divide-border/50">
                    {bajoStock!.map((p) => (
                      <li key={p.id} className="flex items-center gap-3 p-3.5 hover:bg-muted/30 transition-colors">
                        <AlertTriangle className="h-4 w-4 shrink-0 text-amber-500" aria-hidden />
                        <span className="min-w-0 flex-1 truncate text-xs font-bold text-foreground">
                          {p.nombre}
                        </span>
                        <span className="tabular-nums shrink-0 text-xs font-black text-amber-500 bg-amber-500/10 px-2 py-0.5 rounded-lg border border-amber-500/20">
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
