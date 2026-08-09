import { CheckCircle2, Clock, PartyPopper, Wrench } from "lucide-react";
import { notFound } from "next/navigation";

import { BotonAprobar } from "@/components/seguimiento/BotonAprobar";
import { obtenerSeguimiento } from "@/lib/actions/seguimiento";
import { COLUMNAS_KANBAN, etiquetaEstado } from "@/lib/estados-ot";

export const dynamic = "force-dynamic";

const money = (n: number) =>
  new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS", maximumFractionDigits: 0 }).format(n);

const hora = (iso: string) =>
  new Date(iso).toLocaleString("es-AR", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });

/** Las cinco etapas que ve el cliente, mapeadas desde los estados internos. */
const ETAPAS = [
  { clave: "ingresado", texto: "Ingresado", estados: ["recibido"] },
  { clave: "presupuesto", texto: "Presupuesto", estados: ["presupuesto", "aprobado"] },
  { clave: "reparacion", texto: "En reparación", estados: ["en_trabajo", "esperando_repuesto"] },
  { clave: "control", texto: "Control final", estados: [] },
  { clave: "listo", texto: "Listo", estados: ["listo", "entregado", "cerrado"] },
] as const;

const TITULO_NOTA: Record<string, string> = {
  anomalia: "Lo que nos contaste",
  descargo: "Lo que encontramos",
  recomendado: "Queda pendiente",
};

/**
 * Portal público de seguimiento.
 *
 * No pide usuario ni instala nada: el cliente entra desde el link de WhatsApp.
 * Todos los datos vienen de una función SECURITY DEFINER (0030) que elige a mano
 * las columnas — `anon` no tiene acceso a ninguna tabla, y las observaciones
 * internas de la orden no salen nunca.
 */
export default async function PaginaSeguimiento({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const ot = await obtenerSeguimiento(token);

  // Un token vencido, revocado o inventado da 404. No se distingue entre los
  // tres casos: decirle a quien prueba tokens que uno "existía pero venció" ya
  // es información.
  if (!ot) notFound();

  const listo = ["listo", "entregado", "cerrado"].includes(ot.estado);
  const esperandoAprobacion = ot.estado === "presupuesto";
  const indiceEtapa = ETAPAS.findIndex((e) =>
    (e.estados as readonly string[]).includes(ot.estado),
  );
  const avance = listo ? ETAPAS.length - 1 : Math.max(0, indiceEtapa);

  return (
    <main className="mx-auto w-full max-w-2xl px-4 py-8 sm:py-12">
      <header className="space-y-1 text-center">
        <p className="text-caption uppercase tracking-wider text-muted-foreground">
          {ot.taller.nombre}
        </p>
        <h1 className="text-display text-3xl font-bold tracking-tight text-foreground">
          {ot.patente}
        </h1>
        <p className="text-sm text-muted-foreground">
          {ot.vehiculo ?? "Tu vehículo"} · Orden {ot.numero}
        </p>
      </header>

      {/* El cartel de "listo" va arriba de todo y grande: es la única cosa que
          el cliente vino a saber. */}
      {listo && (
        <div className="mt-6 flex items-center gap-3 rounded-2xl bg-emerald-600 p-5 text-white shadow-lg">
          <PartyPopper className="h-8 w-8 shrink-0" aria-hidden />
          <div>
            <p className="text-lg font-black leading-tight">¡Tu vehículo está listo!</p>
            <p className="text-sm text-emerald-50">
              Podés pasar a retirarlo
              {ot.taller.direccion ? ` por ${ot.taller.direccion}` : ""}.
            </p>
          </div>
        </div>
      )}

      {/* Barra de progreso en 5 etapas */}
      <ol className="mt-6 grid grid-cols-5 gap-1" aria-label="Estado de la reparación">
        {ETAPAS.map((etapa, i) => {
          const hecha = i <= avance;
          return (
            <li key={etapa.clave} className="flex flex-col items-center gap-1.5 text-center">
              <span
                className={`grid h-9 w-9 place-items-center rounded-full text-xs font-bold ${
                  hecha ? "bg-accent text-white" : "bg-muted text-muted-foreground"
                }`}
                aria-hidden
              >
                {hecha ? <CheckCircle2 className="h-4.5 w-4.5" /> : i + 1}
              </span>
              <span
                className={`text-[0.6875rem] leading-tight ${
                  hecha ? "font-semibold text-foreground" : "text-muted-foreground"
                }`}
              >
                {etapa.texto}
              </span>
            </li>
          );
        })}
      </ol>

      <p className="mt-3 text-center text-sm font-semibold text-foreground">
        Estado actual: {etiquetaEstado(ot.estado)}
      </p>

      {/* Aprobación del presupuesto */}
      {esperandoAprobacion && !ot.aprobado_en && (
        <section className="mt-6 space-y-3 rounded-2xl border border-accent/40 bg-accent/5 p-5">
          <h2 className="text-base font-bold text-foreground">Presupuesto para aprobar</h2>
          <dl className="space-y-1 text-sm">
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Repuestos</dt>
              <dd className="tabular font-medium text-foreground">{money(ot.total_repuestos)}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Mano de obra</dt>
              <dd className="tabular font-medium text-foreground">{money(ot.total_mano_obra)}</dd>
            </div>
            <div className="flex justify-between border-t border-border pt-1">
              <dt className="font-bold text-foreground">Total</dt>
              <dd className="tabular text-lg font-black text-accent">{money(ot.total)}</dd>
            </div>
          </dl>
          <BotonAprobar token={token} />
          <p className="text-caption text-muted-foreground">
            Al aprobar autorizás al taller a hacer los trabajos de esta lista. Si
            querés cambiar algo, llamá al taller
            {ot.taller.telefono ? ` (${ot.taller.telefono})` : ""}.
          </p>
        </section>
      )}

      {ot.aprobado_en && (
        <p className="mt-6 flex items-center gap-2 rounded-xl bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-800">
          <CheckCircle2 className="h-4 w-4 shrink-0" aria-hidden />
          Aprobaste el presupuesto el {hora(ot.aprobado_en)}
        </p>
      )}

      {/* Bitácora */}
      {ot.notas.length > 0 && (
        <section className="mt-8 space-y-4">
          <h2 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">
            Qué pasó con tu vehículo
          </h2>
          {(["anomalia", "descargo", "recomendado"] as const).map((tipo) => {
            const delTipo = ot.notas.filter((n) => n.tipo === tipo);
            if (delTipo.length === 0) return null;
            return (
              <div key={tipo} className="space-y-2">
                <h3 className="text-caption font-bold text-accent">{TITULO_NOTA[tipo]}</h3>
                <ul className="space-y-2">
                  {delTipo.map((n, i) => (
                    <li
                      key={i}
                      className="rounded-xl border border-border bg-card p-3 text-sm text-foreground"
                    >
                      {n.texto}
                      {n.precio != null && (
                        <span className="mt-1 block text-caption font-semibold text-muted-foreground">
                          Presupuestado: {money(Number(n.precio))}
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

      {/* Detalle de trabajos, sin costos del taller */}
      {ot.items.length > 0 && (
        <section className="mt-8 space-y-2">
          <h2 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">
            Detalle
          </h2>
          <ul className="divide-y divide-border overflow-hidden rounded-xl border border-border bg-card">
            {ot.items.map((it, i) => (
              <li key={i} className="flex items-center justify-between gap-3 p-3 text-sm">
                <span className="min-w-0">
                  <span className="block truncate text-foreground">{it.descripcion}</span>
                  <span className="block text-caption text-muted-foreground">
                    {Number(it.cantidad)} × {it.tipo.replace("_", " ")}
                  </span>
                </span>
                <span className="tabular shrink-0 font-semibold text-foreground">
                  {money(Number(it.subtotal))}
                </span>
              </li>
            ))}
            <li className="flex items-center justify-between bg-muted/40 p-3">
              <span className="text-caption font-bold uppercase tracking-wider text-muted-foreground">
                Total
              </span>
              <span className="tabular text-base font-black text-foreground">
                {money(ot.total)}
              </span>
            </li>
          </ul>
        </section>
      )}

      {/* Línea de tiempo */}
      {ot.historial.length > 0 && (
        <section className="mt-8 space-y-2">
          <h2 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">
            Seguimiento
          </h2>
          <ul className="space-y-2">
            {ot.historial
              .filter((h) => (COLUMNAS_KANBAN as readonly string[]).includes(h.estado) || h.estado === "entregado")
              .map((h, i) => (
                <li key={i} className="flex items-center gap-2.5 text-sm">
                  <Clock className="h-3.5 w-3.5 shrink-0 text-muted-foreground" aria-hidden />
                  <span className="tabular shrink-0 text-caption text-muted-foreground">
                    {hora(h.fecha)}
                  </span>
                  <span className="text-foreground">{etiquetaEstado(h.estado)}</span>
                </li>
              ))}
          </ul>
        </section>
      )}

      <footer className="mt-10 flex items-center justify-center gap-2 text-caption text-muted-foreground">
        <Wrench className="h-3.5 w-3.5" aria-hidden />
        {ot.taller.nombre}
        {ot.taller.telefono ? ` · ${ot.taller.telefono}` : ""}
      </footer>
    </main>
  );
}
