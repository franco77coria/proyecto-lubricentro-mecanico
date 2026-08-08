import { Clock, Receipt, TrendingUp, Wrench } from "lucide-react";
import { redirect } from "next/navigation";

import { EncabezadoPantalla } from "@/components/ui/EncabezadoPantalla";
import { crearClienteServidor, obtenerSesion } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

const money = (n: number) =>
  new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS", maximumFractionDigits: 0 }).format(n);

const NOMBRE_MES = (ym: string) => {
  const [a, m] = ym.split("-").map(Number);
  return new Intl.DateTimeFormat("es-AR", { month: "short", year: "2-digit" }).format(new Date(a, m - 1, 1));
};

interface Metricas {
  resumen: {
    ordenes: number;
    facturado: number;
    mano_obra: number;
    repuestos: number;
    ticket_promedio: number;
    costo_repuestos: number;
  };
  meses: { mes: string; facturado: number; ordenes: number }[];
  top: { descripcion: string; tipo: string; veces: number; total: number }[];
}

export default async function Reportes() {
  const sesion = await obtenerSesion();
  if (!sesion?.perfil) redirect("/login");

  // Los reportes son del dueño. La función además lo valida del lado de
  // Postgres: esto es solo para no mostrar una pantalla de error.
  if (sesion.perfil.rol !== "dueno") redirect("/tablero");

  const supabase = await crearClienteServidor();
  const [{ data, error }, { data: horas }] = await Promise.all([
    supabase.rpc("metricas_taller"),
    supabase.rpc("tiempo_promedio_taller"),
  ]);

  if (error) {
    return (
      <main className="flex-1 pt-[calc(var(--safe-top)+1.25rem)] pb-4 scroll-inset">
        <div className="contenedor space-y-5">
          <EncabezadoPantalla seccion="Reportes" titulo="Números del taller" />
          <p className="tarjeta px-4 py-10 text-center text-sm text-muted-foreground">
            No se pudieron calcular los reportes.
          </p>
        </div>
      </main>
    );
  }

  const m = data as unknown as Metricas;
  const r = m.resumen;
  const margen = Number(r.repuestos) - Number(r.costo_repuestos);
  const ganancia = Number(r.mano_obra) + margen;
  const maxMes = Math.max(...m.meses.map((x) => Number(x.facturado)), 1);

  const tarjetas = [
    { etiqueta: "Facturado", valor: money(Number(r.facturado)), icono: Receipt, tono: "text-emerald-600 bg-emerald-50" },
    { etiqueta: "Órdenes cerradas", valor: String(r.ordenes), icono: Wrench, tono: "text-sky-600 bg-sky-50" },
    { etiqueta: "Ticket promedio", valor: money(Number(r.ticket_promedio)), icono: TrendingUp, tono: "text-violet-600 bg-violet-50" },
    {
      etiqueta: "Horas en taller",
      valor: Number(horas) > 0 ? `${horas} h` : "Sin datos",
      icono: Clock,
      tono: "text-amber-600 bg-amber-50",
    },
  ];

  return (
    <main className="flex-1 pt-[calc(var(--safe-top)+1.25rem)] pb-4 scroll-inset">
      <div className="contenedor space-y-6">
        <EncabezadoPantalla seccion="Reportes" titulo="Números del taller" />
        <p className="text-caption text-muted-foreground">Últimos 6 meses, órdenes entregadas o cerradas</p>

        <section className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          {tarjetas.map((t, i) => {
            const Icono = t.icono;
            return (
              <div key={t.etiqueta} className="tarjeta entrar flex items-center gap-3 p-3.5" style={{ "--i": i + 1 } as React.CSSProperties}>
                <span className={`grid h-10 w-10 shrink-0 place-items-center rounded-[var(--radius-sm)] ${t.tono}`}>
                  <Icono className="h-5 w-5" aria-hidden />
                </span>
                <span className="min-w-0">
                  <span className="tabular block text-lg font-bold text-foreground">{t.valor}</span>
                  <span className="block truncate text-caption text-muted-foreground">{t.etiqueta}</span>
                </span>
              </div>
            );
          })}
        </section>

        <div className="grid gap-5 lg:grid-cols-3">
          <section className="space-y-3 lg:col-span-2">
            <h2 className="t-seccion">Facturación por mes</h2>
            {m.meses.length === 0 ? (
              <p className="tarjeta px-4 py-10 text-center text-sm text-muted-foreground">
                Todavía no hay órdenes cerradas en el período.
              </p>
            ) : (
              <ul className="tarjeta space-y-3 p-4">
                {m.meses.map((x) => (
                  <li key={x.mes} className="space-y-1">
                    <div className="flex items-baseline justify-between text-sm">
                      <span className="font-medium capitalize text-foreground">{NOMBRE_MES(x.mes)}</span>
                      <span className="tabular text-muted-foreground">
                        {money(Number(x.facturado))}
                        <span className="ml-2 text-caption">
                          {x.ordenes} {x.ordenes === 1 ? "orden" : "órdenes"}
                        </span>
                      </span>
                    </div>
                    {/* Barra proporcional al mes más alto. Un gráfico entero
                        para seis valores sería más peso que información. */}
                    <div className="h-2 overflow-hidden rounded-full bg-muted">
                      <div
                        className="h-full rounded-full bg-accent"
                        style={{ width: `${Math.max((Number(x.facturado) / maxMes) * 100, 2)}%` }}
                      />
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <aside className="space-y-5">
            <section className="tarjeta space-y-3 p-4">
              <h2 className="t-seccion">De dónde sale</h2>
              <Fila etiqueta="Mano de obra" valor={money(Number(r.mano_obra))} />
              <Fila etiqueta="Repuestos" valor={money(Number(r.repuestos))} />
              <Fila etiqueta="Costo de repuestos" valor={`− ${money(Number(r.costo_repuestos))}`} tenue />
              <div className="border-t border-border pt-2">
                <Fila etiqueta="Margen de repuestos" valor={money(margen)} />
                <Fila etiqueta="Ganancia bruta" valor={money(ganancia)} fuerte />
              </div>
              <p className="text-caption text-muted-foreground">
                El costo es el que tenía el repuesto cuando se cargó, no el de hoy.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="t-seccion">Lo que más se hace</h2>
              {m.top.length === 0 ? (
                <p className="tarjeta px-4 py-4 text-caption text-muted-foreground">Sin datos todavía.</p>
              ) : (
                <ul className="tarjeta divide-y divide-border overflow-hidden">
                  {m.top.map((t, i) => (
                    <li key={`${t.descripcion}-${i}`} className="flex items-center gap-2 px-3.5 py-2.5">
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm text-foreground">{t.descripcion}</span>
                        <span className="block text-caption text-muted-foreground">{t.veces}×</span>
                      </span>
                      <span className="tabular shrink-0 text-caption font-semibold text-foreground">
                        {money(Number(t.total))}
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

function Fila({
  etiqueta,
  valor,
  fuerte,
  tenue,
}: {
  etiqueta: string;
  valor: string;
  fuerte?: boolean;
  tenue?: boolean;
}) {
  return (
    <div className="flex items-baseline justify-between gap-3 text-sm">
      <span className={tenue ? "text-muted-foreground" : "text-foreground"}>{etiqueta}</span>
      <span className={`tabular ${fuerte ? "text-base font-bold text-foreground" : tenue ? "text-muted-foreground" : "font-medium text-foreground"}`}>
        {valor}
      </span>
    </div>
  );
}
