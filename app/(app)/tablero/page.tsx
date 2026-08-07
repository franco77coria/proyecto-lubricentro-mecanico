import { AlertTriangle, Car, ChevronRight, Clock, Plus, Wrench } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";

import { crearClienteServidor, obtenerSesion } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

const ESTADO_BADGE_STYLE: Record<string, string> = {
  presupuesto: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300",
  aprobado: "bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  recibido: "bg-indigo-50 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400",
  en_trabajo: "bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
  esperando_repuesto: "bg-purple-50 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400",
  listo: "bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
  entregado: "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400",
  cerrado: "bg-slate-900 text-white",
  anulado: "bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-400",
};

const ESTADO_LABEL: Record<string, string> = {
  presupuesto: "Presupuesto",
  aprobado: "Aprobado",
  recibido: "Recibido",
  en_trabajo: "En Trabajo",
  esperando_repuesto: "Esperando Repuesto",
  listo: "Listo para entregar",
  entregado: "Entregado",
  cerrado: "Cerrado",
  anulado: "Anulado",
};

export default async function PaginaTablero() {
  const sesion = await obtenerSesion();
  if (!sesion?.perfil) redirect("/login");

  const supabase = await crearClienteServidor();
  const tallerId = sesion.perfil.taller_id;

  // 1. Obtener nombre del taller
  const { data: taller } = await supabase
    .from("taller")
    .select("nombre")
    .eq("id", tallerId)
    .single();

  // 2. Obtener OTs activas
  const { data: ordenes } = await supabase
    .from("orden_trabajo")
    .select(`
      id, numero, estado, tipo, fecha_ingreso, total,
      vehiculo:vehiculo_id (
        patente, marca:marca_id(nombre), modelo:modelo_id(nombre)
      ),
      cliente:cliente_id (
        nombre, apellido
      )
    `)
    .eq("taller_id", tallerId)
    .order("fecha_ingreso", { ascending: false })
    .limit(20);

  // 3. Contadores
  const otList = ordenes || [];
  const enTrabajo = otList.filter((o) => o.estado === "en_trabajo").length;
  const listos = otList.filter((o) => o.estado === "listo").length;
  const esperandoRepuesto = otList.filter((o) => o.estado === "esperando_repuesto").length;

  // 4. Productos con stock bajo
  const { data: bajoStock } = await supabase
    .from("producto")
    .select("id, nombre, stock_min")
    .eq("taller_id", tallerId)
    .eq("bajo_stock", true)
    .limit(5);

  return (
    <main className="flex-1 px-4 pt-[calc(var(--safe-top)+4.5rem)] pb-24 scroll-inset">
      <div className="mx-auto max-w-[28rem] space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <p className="text-caption font-semibold text-muted-foreground">{taller?.nombre || "Mi Taller"}</p>
            <h1 className="text-2xl font-bold tracking-tight text-foreground">Tablero General</h1>
          </div>
          <Link
            href="/ot/nueva"
            className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-accent px-4 text-xs font-bold text-white shadow-md transition-transform active:scale-95"
          >
            <Plus className="h-4 w-4" />
            <span>Nueva OT</span>
          </Link>
        </div>

        {/* Alerta de Stock Bajo */}
        {bajoStock && bajoStock.length > 0 && (
          <div className="flex items-center justify-between rounded-xl border border-amber-500/30 bg-amber-500/10 p-3.5 text-xs text-amber-900 dark:text-amber-300">
            <div className="flex items-center gap-2 font-medium">
              <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0" />
              <span>{bajoStock.length} producto(s) con stock bajo mínimo.</span>
            </div>
            <Link href="/stock" className="font-bold underline text-amber-700 dark:text-amber-400">
              Ver Stock
            </Link>
          </div>
        )}

        {/* Métricas rápidas */}
        <div className="grid grid-cols-3 gap-3">
          <div className="rounded-xl border border-border bg-card p-3 shadow-sm text-center">
            <p className="text-display text-2xl font-black text-amber-600">{enTrabajo}</p>
            <p className="text-caption text-muted-foreground">En trabajo</p>
          </div>
          <div className="rounded-xl border border-border bg-card p-3 shadow-sm text-center">
            <p className="text-display text-2xl font-black text-emerald-600">{listos}</p>
            <p className="text-caption text-muted-foreground">Listos</p>
          </div>
          <div className="rounded-xl border border-border bg-card p-3 shadow-sm text-center">
            <p className="text-display text-2xl font-black text-purple-600">{esperandoRepuesto}</p>
            <p className="text-caption text-muted-foreground">Esperando rep.</p>
          </div>
        </div>

        {/* Lista de Órdenes de Trabajo */}
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Órdenes Recientes ({otList.length})
            </h2>
          </div>

          <div className="space-y-2.5">
            {otList.length > 0 ? (
              otList.map((ot) => {
                const descVehiculo = [ot.vehiculo?.marca?.nombre, ot.vehiculo?.modelo?.nombre]
                  .filter(Boolean)
                  .join(" ");

                return (
                  <Link
                    key={ot.id}
                    href={`/ot/${ot.id}`}
                    className="flex items-center justify-between rounded-xl border border-border bg-card p-4 shadow-sm transition-all hover:border-accent/50 active:scale-[0.99]"
                  >
                    <div className="min-w-0 space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-display font-bold text-foreground">#{ot.numero}</span>
                        <span className="text-caption font-bold text-accent">{ot.vehiculo?.patente}</span>
                        <span className={`px-2 py-0.5 text-[10px] font-bold rounded-full uppercase ${ESTADO_BADGE_STYLE[ot.estado] || ""}`}>
                          {ESTADO_LABEL[ot.estado] || ot.estado}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground font-medium truncate">
                        {descVehiculo || "Sin modelo"} • {ot.cliente ? `${ot.cliente.nombre} ${ot.cliente.apellido || ""}` : "Sin cliente"}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-foreground tabular">
                        $ {Number(ot.total || 0).toLocaleString("es-AR", { minimumFractionDigits: 2 })}
                      </span>
                      <ChevronRight className="h-4 w-4 text-muted-foreground" />
                    </div>
                  </Link>
                );
              })
            ) : (
              <div className="rounded-2xl border border-dashed border-border bg-card p-8 text-center space-y-3">
                <Car className="mx-auto h-8 w-8 text-muted-foreground opacity-50" />
                <p className="text-xs font-medium text-muted-foreground">
                  No tenés órdenes de trabajo cargadas todavía.
                </p>
                <Link
                  href="/ot/nueva"
                  className="inline-flex min-h-10 items-center justify-center rounded-xl bg-accent px-4 text-xs font-bold text-white"
                >
                  Crear la primera OT
                </Link>
              </div>
            )}
          </div>
        </section>
      </div>
    </main>
  );
}
