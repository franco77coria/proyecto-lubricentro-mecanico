import { Car, CheckCircle2, Gauge, Plus, Wrench } from "lucide-react";
import Link from "next/link";

import { Buscador, EncabezadoPantalla } from "@/components/ui/EncabezadoPantalla";
import { PlacaPatente } from "@/components/ui/PlacaPatente";
import { ESTADO_LABEL, ESTADO_TONO } from "@/lib/estados-ot";
import { crearClienteServidor } from "@/lib/supabase/server";
import { exigirVista } from "@/lib/permisos";
import { obtenerAjustesTaller } from "@/lib/taller";
import { formatearNumero } from "@/lib/i18n";
import { obtenerResponsablesOT, type DatosOTResponsables } from "@/lib/ot-usuarios";

export const dynamic = "force-dynamic";

export default async function PaginaVehiculos({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const sesion = await exigirVista("/vehiculos");
  const { idioma } = await obtenerAjustesTaller();

  const { q } = await searchParams;
  const supabase = await crearClienteServidor();

  let query = supabase
    .from("vehiculo")
    .select(
      `id, patente, anio, color, km_actual,
       marca:marca_id(nombre), modelo:modelo_id(nombre)`,
    )
    .eq("taller_id", sesion.perfil.taller_id)
    .order("creado_en", { ascending: false })
    .limit(60);

  if (q?.trim()) {
    const texto = q.trim();
    const limpio = texto.toUpperCase().replace(/[^A-Z0-9]/g, "");

    // Buscar si coincide con marcas o modelos
    const [{ data: marcas }, { data: modelos }] = await Promise.all([
      supabase.from("marca").select("id").ilike("nombre", `%${texto}%`).limit(10),
      supabase.from("modelo").select("id").ilike("nombre", `%${texto}%`).limit(10),
    ]);

    const marcaIds = (marcas ?? []).map((m) => m.id);
    const modeloIds = (modelos ?? []).map((m) => m.id);

    const filtrosOr: string[] = [];
    if (limpio) {
      filtrosOr.push(`patente_norm.ilike.%${limpio}%`);
    }
    if (marcaIds.length > 0) {
      filtrosOr.push(`marca_id.in.(${marcaIds.join(",")})`);
    }
    if (modeloIds.length > 0) {
      filtrosOr.push(`modelo_id.in.(${modeloIds.join(",")})`);
    }

    if (filtrosOr.length > 0) {
      query = query.or(filtrosOr.join(","));
    } else if (limpio) {
      query = query.ilike("patente_norm", `%${limpio}%`);
    }
  }

  const { data: vehiculos } = await query;
  const lista = vehiculos ?? [];

  // Buscar la última orden de trabajo para cada vehículo encontrado
  const vehiculoIds = lista.map((v) => v.id);
  const { data: ordenesRecientes } = vehiculoIds.length > 0
    ? await supabase
        .from("orden_trabajo")
        .select(`
          id, numero, estado, fecha_ingreso, fecha_entrega, vehiculo_id, asignado_a,
          mecanico:asignado_a ( user_id, nombre, rol ),
          logs:ot_estado_log (
            id, estado_anterior, estado_nuevo, creado_en, usuario_id,
            usuario:usuario_id ( user_id, nombre, rol )
          )
        `)
        .eq("taller_id", sesion.perfil.taller_id)
        .in("vehiculo_id", vehiculoIds)
        .order("fecha_ingreso", { ascending: false })
    : { data: [] };

  const ultimasOTPorVehiculo = new Map<string, DatosOTResponsables>();
  for (const ot of ordenesRecientes ?? []) {
    if (!ultimasOTPorVehiculo.has(ot.vehiculo_id)) {
      ultimasOTPorVehiculo.set(ot.vehiculo_id, ot as unknown as DatosOTResponsables);
    }
  }

  return (
    <main className="flex-1 pt-[calc(var(--safe-top)+1.25rem)] pb-4 scroll-inset">
      <div className="contenedor space-y-5">
        <EncabezadoPantalla
          seccion="Autos"
          titulo={q ? `Resultados de "${q}"` : "Autos del taller"}
          accion={
            <Link
              href="/ot/nueva"
              className="flex min-h-11 items-center gap-2 rounded-[var(--radius-sm)] bg-accent px-4 text-sm font-semibold text-accent-foreground shadow-[var(--sombra-sutil)] transition-transform hover:brightness-110 active:scale-[0.98]"
            >
              <Plus className="h-4 w-4" strokeWidth={2.5} aria-hidden />
              Recibir auto
            </Link>
          }
        />

        <Buscador valor={q} placeholder="Buscar por patente, marca o modelo (ej: AF123CD, Hilux, Gol)..." />

        {lista.length === 0 ? (
          <div className="tarjeta entrar flex flex-col items-center gap-3 px-6 py-14 text-center">
            <span className="grid h-12 w-12 place-items-center rounded-full bg-accent-suave text-accent">
              <Car className="h-6 w-6" aria-hidden />
            </span>
            <p className="max-w-xs text-sm text-muted-foreground">
              {q
                ? "Ningún auto coincide con esa búsqueda."
                : "Todavía no hay autos cargados. Se dan de alta al recibir el primero."}
            </p>
          </div>
        ) : (
          <>
            <p className="text-caption text-muted-foreground">
              {lista.length} {lista.length === 1 ? "auto" : "autos"}
            </p>
            <ul className="grid gap-3.5 sm:grid-cols-2 xl:grid-cols-3">
              {lista.map((v, i) => {
                const desc = [v.marca?.nombre, v.modelo?.nombre, v.anio].filter(Boolean).join(" ");
                const ultimaOT = ultimasOTPorVehiculo.get(v.id);
                const resp = ultimaOT ? obtenerResponsablesOT(ultimaOT) : null;

                return (
                  <li key={v.id} className="entrar" style={{ "--i": i + 2 } as React.CSSProperties}>
                    <Link
                      href={`/vehiculos/${encodeURIComponent(v.patente)}`}
                      className="tarjeta tarjeta-accion flex h-full flex-col justify-between gap-3 p-4 hover:border-accent/40 transition-colors"
                    >
                      <div className="space-y-2.5">
                        <div className="flex items-start justify-between gap-2">
                          <PlacaPatente patente={v.patente} size="sm" />
                          <span className="grid h-8 w-8 shrink-0 place-items-center rounded-xl bg-muted text-muted-foreground">
                            <Car className="h-4 w-4" aria-hidden />
                          </span>
                        </div>

                        <div>
                          <p className="text-sm font-bold text-foreground">
                            {desc || "Sin marca ni modelo"}
                          </p>
                          <div className="flex items-center gap-3 text-caption text-muted-foreground mt-0.5">
                            {v.km_actual != null && (
                              <span className="flex items-center gap-1">
                                <Gauge className="h-3 w-3" aria-hidden />
                                <span className="tabular">{formatearNumero(v.km_actual, idioma)} km</span>
                              </span>
                            )}
                            {v.color && <span className="truncate">{v.color}</span>}
                          </div>
                        </div>
                      </div>

                      {/* Bloque de Último Trabajo y Mecánico que lo hizo / cerró */}
                      <div className="mt-2 pt-2.5 border-t border-border/70 text-xs space-y-1.5">
                        {ultimaOT ? (
                          <>
                            <div className="flex items-center justify-between text-caption">
                              <span className="font-bold text-foreground">
                                Última orden: #{ultimaOT.numero}
                              </span>
                              <span
                                className={`rounded-full px-2 py-0.5 text-[0.625rem] font-semibold ${
                                  ESTADO_TONO[ultimaOT.estado] ?? ""
                                }`}
                              >
                                {ESTADO_LABEL[ultimaOT.estado] ?? ultimaOT.estado}
                              </span>
                            </div>

                            <div className="flex items-center gap-1.5 text-muted-foreground truncate">
                              <Wrench className="h-3.5 w-3.5 text-accent shrink-0" aria-hidden />
                              <span className="truncate">
                                {resp?.mecanicoNombre ? (
                                  <>
                                    Mecánico:{" "}
                                    <strong className="text-foreground font-semibold">
                                      {resp.mecanicoNombre}
                                    </strong>
                                  </>
                                ) : (
                                  "Sin mecánico asignado"
                                )}
                              </span>
                            </div>

                            {resp?.cerradoPorNombre && (
                              <div className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 truncate">
                                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 shrink-0" aria-hidden />
                                <span className="truncate">
                                  Cerrado por:{" "}
                                  <strong className="font-semibold">
                                    {resp.cerradoPorNombre}
                                  </strong>
                                </span>
                              </div>
                            )}
                          </>
                        ) : (
                          <p className="text-caption text-muted-foreground italic">
                            Sin servicios registrados aún
                          </p>
                        )}
                      </div>
                    </Link>
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
