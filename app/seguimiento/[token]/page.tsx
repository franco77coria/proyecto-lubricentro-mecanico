import { CheckCircle2, Clock, Wrench } from "lucide-react";
import { notFound } from "next/navigation";

import { BotonAprobar } from "@/components/seguimiento/BotonAprobar";
import { TrackerVehiculo } from "@/components/seguimiento/TrackerVehiculo";
import { TelemetriaIngreso } from "@/components/seguimiento/TelemetriaIngreso";
import { GaleriaReparacion } from "@/components/seguimiento/GaleriaReparacion";
import { BotonWhatsAppTaller } from "@/components/seguimiento/BotonWhatsAppTaller";
import { LivePoller } from "@/components/seguimiento/LivePoller";
import { PlacaPatente } from "@/components/ui/PlacaPatente";
import { obtenerSeguimiento } from "@/lib/actions/seguimiento";
import { COLUMNAS_KANBAN, etiquetaEstado } from "@/lib/estados-ot";
import { formatearFecha, formatearMoneda, localeDe } from "@/lib/i18n";

export const dynamic = "force-dynamic";

/* Esta pantalla la abre el CLIENTE del taller, que puede estar en cualquier
   país: los importes y las fechas salen del idioma y la moneda que el taller
   tenga configurados, no de "es-AR"/"ARS" fijos. Acá no hay contexto de i18n
   porque no hay sesión, así que los valores viajan dentro de la respuesta. */

const TITULO_NOTA: Record<string, string> = {
  anomalia: "Lo que nos contaste",
  descargo: "Diagnóstico del Taller",
  recomendado: "Trabajos recomendados a futuro",
};

/**
 * Portal público de seguimiento en tiempo real estilo Mercado Libre / Rappi.
 */
export default async function PaginaSeguimiento({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const ot = await obtenerSeguimiento(token);

  if (!ot) notFound();

  const idioma = ot.taller.idioma ?? "es";
  const moneda = ot.taller.moneda ?? "ARS";
  const money = (n: number) => formatearMoneda(n, moneda, idioma);
  const hora = (iso: string) =>
    formatearFecha(iso, idioma, {
      day: "2-digit",
      month: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });

  const esperandoAprobacion = ot.estado === "presupuesto";

  return (
    <main className="mx-auto w-full max-w-2xl px-4 py-8 sm:py-12 space-y-6 pb-28">
      {/* Sincronización en vivo sin recargas molestas */}
      <LivePoller estado={ot.estado} />

      {/* Cabecera del Vehículo y Taller */}
      <header className="space-y-3 text-center">
        <p className="text-caption uppercase font-extrabold tracking-widest text-accent">
          {ot.taller.nombre}
        </p>

        <div className="flex justify-center">
          <PlacaPatente patente={ot.patente} size="lg" />
        </div>

        <div>
          <h1 className="text-display text-2xl sm:text-3xl font-black tracking-tight text-foreground">
            {ot.vehiculo ?? "Tu Vehículo"}
          </h1>
          <p className="text-xs font-semibold text-muted-foreground mt-0.5">
            Orden de Servicio #{ot.numero}
          </p>
        </div>
      </header>

      {/* Live Tracker Animado (Mercado Libre / Rappi Style) */}
      <TrackerVehiculo estado={ot.estado} />

      {/* Telemetría de Recepción (Combustible y Kilometraje) */}
      {ot.telemetria && (
        <TelemetriaIngreso
          locale={localeDe(idioma)}
          km={ot.telemetria.km}
          combustible={ot.telemetria.combustible}
        />
      )}

      {/* Aprobación Digital del Presupuesto */}
      {esperandoAprobacion && !ot.aprobado_en && (
        <section className="space-y-3.5 rounded-3xl border-2 border-accent/50 bg-accent/5 p-6 shadow-md">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-black text-foreground uppercase tracking-wider">
              Presupuesto para Aprobación
            </h2>
            <span className="rounded-full bg-accent/20 px-2.5 py-0.5 text-xs font-bold text-accent">
              Pendiente de Firma
            </span>
          </div>

          <dl className="space-y-1.5 text-sm pt-1">
            <div className="flex justify-between">
              <dt className="text-muted-foreground font-medium">Repuestos y Materiales</dt>
              <dd className="tabular font-semibold text-foreground">{money(ot.total_repuestos)}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-muted-foreground font-medium">Mano de Obra Especializada</dt>
              <dd className="tabular font-semibold text-foreground">{money(ot.total_mano_obra)}</dd>
            </div>
            <div className="flex justify-between border-t border-border pt-2">
              <dt className="font-extrabold text-foreground text-base">Total Final</dt>
              <dd className="tabular text-xl font-black text-accent">{money(ot.total)}</dd>
            </div>
          </dl>

          <BotonAprobar token={token} />

          <p className="text-caption text-muted-foreground text-center">
            Al tocar &quot;Aprobar&quot; autorizás al taller a iniciar las tareas detalladas.
          </p>
        </section>
      )}

      {ot.aprobado_en && (
        <div className="flex items-center gap-3 rounded-2xl bg-emerald-600/15 border border-emerald-500/30 px-4 py-3.5 text-sm font-semibold text-emerald-400">
          <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-400" aria-hidden />
          <span>Aprobaste el presupuesto el {hora(ot.aprobado_en)} hs.</span>
        </div>
      )}

      {/* Galería Fotográfica del Servicio (Ingreso y Repuestos) */}
      <GaleriaReparacion fotos={ot.fotos} />

      {/* Bitácora y Observaciones */}
      {ot.notas.length > 0 && (
        <section className="space-y-4">
          <h2 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
            Bitácora de Inspección
          </h2>
          {(["anomalia", "descargo", "recomendado"] as const).map((tipo) => {
            const delTipo = ot.notas.filter((n) => n.tipo === tipo);
            if (delTipo.length === 0) return null;
            return (
              <div key={tipo} className="space-y-2">
                <h3 className="text-caption font-black text-accent uppercase tracking-wider">
                  {TITULO_NOTA[tipo]}
                </h3>
                <ul className="space-y-2">
                  {delTipo.map((n, i) => (
                    <li
                      key={i}
                      className="rounded-2xl border border-border/80 bg-card p-4 text-sm text-foreground space-y-1"
                    >
                      <p>{n.texto}</p>
                      {n.precio != null && (
                        <span className="block text-caption font-bold text-accent">
                          Estimado: {money(Number(n.precio))}
                        </span>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
        </section>
      )}

      {/* Detalle de Trabajos y Repuestos */}
      {ot.items.length > 0 && (
        <section className="space-y-2.5">
          <h2 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
            Detalle de Tareas & Repuestos
          </h2>
          <ul className="divide-y divide-border overflow-hidden rounded-2xl border border-border/80 bg-card">
            {ot.items.map((it, i) => (
              <li key={i} className="flex items-center justify-between gap-3 p-3.5 text-sm">
                <div className="min-w-0">
                  <span className="block font-semibold truncate text-foreground">
                    {it.descripcion}
                  </span>
                  <span className="block text-caption text-muted-foreground uppercase">
                    {Number(it.cantidad)} × {it.tipo.replace("_", " ")}
                  </span>
                </div>
                <span className="tabular shrink-0 font-bold text-foreground">
                  {money(Number(it.subtotal))}
                </span>
              </li>
            ))}
            <li className="flex items-center justify-between bg-muted/30 p-4">
              <span className="text-xs font-black uppercase tracking-wider text-muted-foreground">
                Monto Total
              </span>
              <span className="tabular text-lg font-black text-foreground">
                {money(ot.total)}
              </span>
            </li>
          </ul>
        </section>
      )}

      {/* Línea de Tiempo del Taller */}
      {ot.historial.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
            Historial de Avance
          </h2>
          <ul className="space-y-2.5">
            {ot.historial
              .filter((h) => (COLUMNAS_KANBAN as readonly string[]).includes(h.estado) || h.estado === "entregado")
              .map((h, i) => (
                <li key={i} className="flex items-center gap-3 text-sm rounded-xl bg-card border border-border/60 p-3">
                  <Clock className="h-4 w-4 shrink-0 text-accent" aria-hidden />
                  <span className="tabular shrink-0 text-caption font-mono font-bold text-muted-foreground">
                    {hora(h.fecha)}
                  </span>
                  <span className="font-semibold text-foreground">{etiquetaEstado(h.estado)}</span>
                </li>
              ))}
          </ul>
        </section>
      )}

      {/* Pie con datos del Taller */}
      <footer className="pt-6 border-t border-border/60 text-center space-y-2 text-caption text-muted-foreground">
        <div className="flex items-center justify-center gap-1.5 font-bold text-foreground">
          <Wrench className="h-4 w-4 text-accent" aria-hidden />
          {ot.taller.nombre}
        </div>
        {ot.taller.direccion && <p>{ot.taller.direccion}</p>}
        {ot.taller.telefono && <p>Tel: {ot.taller.telefono}</p>}
      </footer>

      {/* Botón Flotante de Contacto WhatsApp */}
      <BotonWhatsAppTaller
        telefono={ot.taller.telefono}
        tallerNombre={ot.taller.nombre}
        otNumero={ot.numero}
        patente={ot.patente}
        flotante={true}
      />
    </main>
  );
}
