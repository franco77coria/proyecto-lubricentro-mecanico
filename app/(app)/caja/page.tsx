import { CreditCard, DollarSign, Smartphone, Wallet } from "lucide-react";

import { BotonCierreCaja } from "./BotonCierreCaja";
import { PlacaPatente } from "@/components/ui/PlacaPatente";
import { crearClienteServidor } from "@/lib/supabase/server";
import { exigirVista } from "@/lib/permisos";
import { obtenerAjustesTaller } from "@/lib/taller";
import { formatearMoneda, localeDe } from "@/lib/i18n";
import { hoyEnZona, inicioDelDiaEnZona } from "@/lib/fechas";

export const dynamic = "force-dynamic";

export default async function PaginaCaja() {
  const sesion = await exigirVista("/caja");
  const { idioma, moneda, zonaHoraria } = await obtenerAjustesTaller();
  const money = (n: number) => formatearMoneda(n, moneda, idioma);
  const localeCaja = localeDe(idioma);

  const supabase = await crearClienteServidor();
  const tallerId = sesion.perfil.taller_id;

  // La misma zona horaria que usa `realizarCierreCaja`: `new Date()` crudo es
  // la hora del servidor (UTC), no la del taller — sin esto, "hoy" se corre
  // hasta 3 horas cerca de la medianoche argentina.
  const fechaHoy = hoyEnZona(zonaHoraria);
  const inicioHoy = inicioDelDiaEnZona(zonaHoraria, fechaHoy);

  // 1. Obtener pagos del día
  const { data: pagos } = await supabase
    .from("pago")
    .select(`
      id, metodo, monto, fecha, notas,
      orden_trabajo:ot_id (numero, vehiculo:vehiculo_id(patente))
    `)
    .eq("taller_id", tallerId)
    .gte("fecha", inicioHoy.toISOString())
    .order("fecha", { ascending: false });

  // 2. Calcular acumulados por método
  let totalEfectivo = 0;
  let totalTransferencia = 0;
  let totalTarjeta = 0;
  let totalMP = 0;
  let totalGeneral = 0;

  if (pagos) {
    for (const p of pagos) {
      const m = Number(p.monto || 0);
      totalGeneral += m;
      if (p.metodo === "efectivo") totalEfectivo += m;
      else if (p.metodo === "transferencia") totalTransferencia += m;
      else if (p.metodo === "tarjeta_credito" || p.metodo === "tarjeta_debito") totalTarjeta += m;
      else if (p.metodo === "mercado_pago") totalMP += m;
    }
  }

  // 3. Obtener cierres de caja recientes
  const { data: cierres } = await supabase
    .from("cierre_caja")
    .select("id, fecha, notas, total")
    .eq("taller_id", tallerId)
    .order("fecha", { ascending: false })
    .limit(7);

  const cierreDeHoy = cierres?.find((c) => c.fecha === fechaHoy) ?? null;

  return (
    <main className="flex-1 pt-[calc(var(--safe-top)+var(--isla-height)+0.75rem)] pb-4 scroll-inset">
      <div className="contenedor space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <p className="text-caption font-semibold text-muted-foreground">Gestión Financiera</p>
            <h1 className="text-2xl font-bold tracking-tight text-foreground">Caja Diaria</h1>
          </div>
          <BotonCierreCaja yaCerradoHoy={Boolean(cierreDeHoy)} />
        </div>

        {cierreDeHoy && (
          <div className="rounded-2xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-xs font-semibold text-amber-600 dark:text-amber-400">
            Ya se registró un cierre de caja hoy, por {money(Number(cierreDeHoy.total || 0))}. Si los ingresos de arriba no coinciden, es porque hubo cobros después del cierre — volvé a cerrar para actualizarlo.
          </div>
        )}

        {/* Resumen Total */}
        <div className="rounded-2xl border border-border bg-card p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-caption font-bold uppercase tracking-wider text-muted-foreground">Ingresos de Hoy</span>
            <span className="text-caption text-muted-foreground">
              {new Intl.DateTimeFormat(localeCaja, { day: "2-digit", month: "short", year: "numeric" }).format(new Date(`${fechaHoy}T12:00:00`))}
            </span>
          </div>
          <p className="text-display text-4xl font-black text-accent tabular">
            {money(totalGeneral)}
          </p>

          <div className="grid grid-cols-2 gap-3 border-t border-border pt-4 text-xs font-semibold">
            <div className="flex items-center gap-3">
              <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                <DollarSign className="h-4 w-4" />
              </span>
              <div>
                <p className="text-muted-foreground text-caption">Efectivo</p>
                <p className="text-foreground font-bold">{money(totalEfectivo)}</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-sky-500/10 text-sky-400 border border-sky-500/20">
                <Wallet className="h-4 w-4" />
              </span>
              <div>
                <p className="text-muted-foreground text-caption">Transferencia</p>
                <p className="text-foreground font-bold">{money(totalTransferencia)}</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/20">
                <CreditCard className="h-4 w-4" />
              </span>
              <div>
                <p className="text-muted-foreground text-caption">Tarjetas</p>
                <p className="text-foreground font-bold">{money(totalTarjeta)}</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                <Smartphone className="h-4 w-4" />
              </span>
              <div>
                <p className="text-muted-foreground text-caption">Mercado Pago</p>
                <p className="text-foreground font-bold">{money(totalMP)}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Lista de Pagos de Hoy */}
        <section className="space-y-3">
          <h2 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
            Cobros Registrados Hoy ({pagos?.length || 0})
          </h2>

          <div className="space-y-2">
            {pagos && pagos.length > 0 ? (
              pagos.map((p) => (
                <div
                  key={p.id}
                  className="flex items-center justify-between gap-3 rounded-xl border border-border bg-card p-3.5 shadow-sm"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    {p.orden_trabajo?.vehiculo?.patente ? (
                      <PlacaPatente patente={p.orden_trabajo.vehiculo.patente} size="sm" />
                    ) : null}
                    <div className="space-y-0.5 min-w-0">
                      <span className="text-xs font-bold text-foreground block">
                        OT #{p.orden_trabajo?.numero || "N/A"}
                      </span>
                      <p className="text-caption text-muted-foreground capitalize font-medium">
                        Método: {p.metodo.replace("_", " ")}
                        {p.notas ? ` · ${p.notas}` : ""}
                      </p>
                    </div>
                  </div>
                  <span className="text-sm font-bold text-emerald-400 tabular shrink-0">
                    +{money(Number(p.monto || 0))}
                  </span>
                </div>
              ))
            ) : (
              <div className="rounded-2xl border border-dashed border-border bg-card p-6 text-center text-xs text-muted-foreground">
                No hay cobros registrados en el día de hoy.
              </div>
            )}
          </div>
        </section>

        {/* Cierres anteriores. Se consultaban pero no se mostraban en ningún
            lado: sin esto no hay forma de revisar lo que se cerró ayer. */}
        {(cierres ?? []).length > 0 && (
          <section className="space-y-3">
            <h2 className="t-seccion">Últimos cierres</h2>
            <ul className="tarjeta divide-y divide-border overflow-hidden">
              {cierres!.map((c) => (
                <li key={c.id} className="flex items-center justify-between gap-3 px-3.5 py-3">
                  <span className="min-w-0">
                    <span className="block text-sm font-medium text-foreground">
                      {new Intl.DateTimeFormat(localeCaja, {
                        weekday: "short",
                        day: "2-digit",
                        month: "short",
                      }).format(new Date(`${c.fecha}T12:00:00`))}
                    </span>
                    {c.notas && (
                      <span className="block truncate text-caption text-muted-foreground">{c.notas}</span>
                    )}
                  </span>
                  <span className="tabular shrink-0 text-sm font-bold text-foreground">
                    {money(Number(c.total || 0))}
                  </span>
                </li>
              ))}
            </ul>
          </section>
        )}
      </div>
    </main>
  );
}
