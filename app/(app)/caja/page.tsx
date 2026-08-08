import { CreditCard, DollarSign, Smartphone, Wallet } from "lucide-react";
import { redirect } from "next/navigation";

import { BotonCierreCaja } from "./BotonCierreCaja";
import { crearClienteServidor, obtenerSesion } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function PaginaCaja() {
  const sesion = await obtenerSesion();
  if (!sesion?.perfil) redirect("/login");

  const supabase = await crearClienteServidor();
  const tallerId = sesion.perfil.taller_id;

  const inicioHoy = new Date();
  inicioHoy.setHours(0, 0, 0, 0);

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
    .select("*")
    .eq("taller_id", tallerId)
    .order("fecha", { ascending: false })
    .limit(7);

  return (
    <main className="flex-1 pt-[calc(var(--safe-top)+1.25rem)] pb-4 scroll-inset">
      <div className="contenedor space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <p className="text-caption font-semibold text-muted-foreground">Gestión Financiera</p>
            <h1 className="text-2xl font-bold tracking-tight text-foreground">Caja Diaria</h1>
          </div>
          <BotonCierreCaja />
        </div>

        {/* Resumen Total */}
        <div className="rounded-2xl border border-border bg-card p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-caption font-bold uppercase tracking-wider text-muted-foreground">Ingresos de Hoy</span>
            <span className="text-caption text-muted-foreground">{new Date().toLocaleDateString("es-AR")}</span>
          </div>
          <p className="text-display text-4xl font-black text-accent tabular">
            $ {totalGeneral.toLocaleString("es-AR", { minimumFractionDigits: 2 })}
          </p>

          <div className="grid grid-cols-2 gap-3 border-t border-border pt-4 text-xs font-semibold">
            <div className="flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-emerald-600" />
              <div>
                <p className="text-muted-foreground text-caption">Efectivo</p>
                <p className="text-foreground font-bold">$ {totalEfectivo.toLocaleString("es-AR")}</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Wallet className="h-4 w-4 text-blue-600" />
              <div>
                <p className="text-muted-foreground text-caption">Transferencia</p>
                <p className="text-foreground font-bold">$ {totalTransferencia.toLocaleString("es-AR")}</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <CreditCard className="h-4 w-4 text-purple-600" />
              <div>
                <p className="text-muted-foreground text-caption">Tarjetas</p>
                <p className="text-foreground font-bold">$ {totalTarjeta.toLocaleString("es-AR")}</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Smartphone className="h-4 w-4 text-cyan-600" />
              <div>
                <p className="text-muted-foreground text-caption">Mercado Pago</p>
                <p className="text-foreground font-bold">$ {totalMP.toLocaleString("es-AR")}</p>
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
                  className="flex items-center justify-between rounded-xl border border-border bg-card p-3.5 shadow-sm"
                >
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-foreground">
                        OT #{p.orden_trabajo?.numero || "N/A"}
                      </span>
                      <span className="text-caption font-bold text-accent">
                        {p.orden_trabajo?.vehiculo?.patente}
                      </span>
                    </div>
                    <p className="text-caption text-muted-foreground capitalize font-medium">
                      Metodo: {p.metodo.replace("_", " ")}
                    </p>
                  </div>
                  <span className="text-sm font-bold text-emerald-600 tabular">
                    +$ {Number(p.monto || 0).toLocaleString("es-AR", { minimumFractionDigits: 2 })}
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
                      {new Intl.DateTimeFormat("es-AR", {
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
                    $ {Number(c.total || 0).toLocaleString("es-AR")}
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
