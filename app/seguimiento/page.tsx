import { Search, Wrench, ShieldCheck } from "lucide-react";

import { consultarPorPatente } from "@/lib/actions/seguimiento";
import { etiquetaEstado } from "@/lib/estados-ot";
import { PlacaPatente } from "@/components/ui/PlacaPatente";

export const dynamic = "force-dynamic";

/**
 * Consulta pública por patente.
 */
export default async function PaginaConsultaPatente({
  searchParams,
}: {
  searchParams: Promise<{ patente?: string }>;
}) {
  const { patente } = await searchParams;
  const consultada = patente?.trim();
  const res = consultada ? await consultarPorPatente(consultada) : null;

  return (
    <main className="mx-auto w-full max-w-md px-4 py-10 sm:py-16">
      <header className="space-y-2 text-center">
        <span className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-accent/15 text-accent border border-accent/30 shadow-md">
          <Wrench className="h-7 w-7" aria-hidden />
        </span>
        <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-foreground">
          ¿Cómo va mi vehículo?
        </h1>
        <p className="text-sm text-muted-foreground">
          Ingresá la patente para conocer el estado actual de tu reparación.
        </p>
      </header>

      <form method="GET" className="mt-7 flex gap-2">
        <label htmlFor="patente" className="sr-only">
          Patente
        </label>
        <input
          id="patente"
          name="patente"
          defaultValue={consultada ?? ""}
          placeholder="AB123CD"
          autoCapitalize="characters"
          autoComplete="off"
          maxLength={12}
          required
          className="min-h-14 flex-1 rounded-2xl border-2 border-border/80 bg-card px-4 text-lg font-black uppercase tracking-wider text-foreground outline-none focus:border-accent shadow-sm"
        />
        <button
          type="submit"
          className="grid min-h-14 w-14 shrink-0 place-items-center rounded-2xl bg-accent text-white active:scale-95 shadow-md font-bold"
          aria-label="Consultar"
        >
          <Search className="h-6 w-6" aria-hidden />
        </button>
      </form>

      {res?.demasiadas_consultas && (
        <p className="mt-6 rounded-2xl bg-amber-500/15 border border-amber-500/30 px-4 py-3 text-sm text-amber-400 font-medium">
          Muchas consultas seguidas para esa patente. Probá de nuevo en unos minutos.
        </p>
      )}

      {res && !res.encontrado && !res.demasiadas_consultas && (
        <div className="mt-6 rounded-2xl border border-border/80 bg-card p-5 text-center space-y-2">
          <p className="text-sm font-semibold text-foreground">
            No encontramos una orden activa para esa patente.
          </p>
          <p className="text-xs text-muted-foreground">
            Revisá que la patente esté bien escrita o consultá directamente al taller si ya fue entregado.
          </p>
        </div>
      )}

      {res?.encontrado && (
        <section className="mt-6 space-y-4 rounded-3xl border border-border/80 bg-card p-6 text-center shadow-lg animate-in fade-in slide-in-from-bottom-3 duration-300">
          <p className="text-caption font-extrabold uppercase tracking-wider text-accent">
            {res.taller}
          </p>

          {res.patente && (
            <div className="flex justify-center">
              <PlacaPatente patente={res.patente} size="lg" />
            </div>
          )}

          {res.vehiculo && (
            <p className="text-base font-bold text-foreground">{res.vehiculo}</p>
          )}

          <div
            className={`rounded-2xl p-4 text-base font-black shadow-sm ${
              ["listo", "entregado", "cerrado"].includes(res.estado ?? "")
                ? "bg-emerald-600 text-white"
                : "bg-accent/15 text-accent border border-accent/30"
            }`}
          >
            {["listo", "entregado", "cerrado"].includes(res.estado ?? "")
              ? "¡Vehículo Listo para Retirar!"
              : `Estado: ${etiquetaEstado(res.estado ?? "")}`}
          </div>

          <div className="flex items-center justify-center gap-1.5 text-xs text-muted-foreground pt-2">
            <ShieldCheck className="h-4 w-4 text-accent" />
            <span>Para ver el detalle completo y presupuesto, usá el link enviado por WhatsApp.</span>
          </div>
        </section>
      )}
    </main>
  );
}
