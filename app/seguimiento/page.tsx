import { Car, Search, Wrench } from "lucide-react";

import { consultarPorPatente } from "@/lib/actions/seguimiento";
import { etiquetaEstado } from "@/lib/estados-ot";

export const dynamic = "force-dynamic";

/**
 * Consulta pública por patente.
 *
 * Muestra SOLO el estado: ni nombre, ni teléfono, ni montos, ni bitácora. Una
 * patente es adivinable y enumerable, así que esta puerta tiene que alcanzar
 * para "¿está listo?" —que es casi toda la demanda— sin servir para recorrer el
 * padrón y llevarse la cartera de clientes del taller. Para ver el detalle hace
 * falta el link con token que el taller manda por WhatsApp.
 *
 * Es un form GET: funciona sin JavaScript, la consulta queda en la URL y el
 * cliente puede recargar para ver si cambió.
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
        <span className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-accent/10 text-accent">
          <Wrench className="h-6 w-6" aria-hidden />
        </span>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">
          ¿Cómo va mi vehículo?
        </h1>
        <p className="text-sm text-muted-foreground">
          Poné la patente y te decimos en qué estado está.
        </p>
      </header>

      <form method="GET" className="mt-6 flex gap-2">
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
          className="min-h-12 flex-1 rounded-xl border border-border bg-card px-4 text-base font-semibold uppercase tracking-wider text-foreground outline-none focus:border-accent"
        />
        <button
          type="submit"
          className="grid min-h-12 w-12 shrink-0 place-items-center rounded-xl bg-accent text-white active:scale-95"
          aria-label="Consultar"
        >
          <Search className="h-5 w-5" aria-hidden />
        </button>
      </form>

      {res?.demasiadas_consultas && (
        <p className="mt-6 rounded-xl bg-amber-50 px-4 py-3 text-sm text-amber-800">
          Muchas consultas seguidas para esa patente. Probá de nuevo en un rato.
        </p>
      )}

      {res && !res.encontrado && !res.demasiadas_consultas && (
        <p className="mt-6 rounded-xl bg-muted px-4 py-3 text-sm text-muted-foreground">
          No encontramos una orden abierta para esa patente. Revisá que esté bien
          escrita, o consultá directamente con el taller.
        </p>
      )}

      {res?.encontrado && (
        <section className="mt-6 space-y-3 rounded-2xl border border-border bg-card p-5 text-center">
          <p className="text-caption uppercase tracking-wider text-muted-foreground">
            {res.taller}
          </p>
          <p className="text-display flex items-center justify-center gap-2 text-2xl font-bold text-foreground">
            <Car className="h-5 w-5 text-accent" aria-hidden />
            {res.patente}
          </p>
          {res.vehiculo && <p className="text-sm text-muted-foreground">{res.vehiculo}</p>}

          <p
            className={`rounded-xl px-4 py-3 text-base font-bold ${
              ["listo", "entregado", "cerrado"].includes(res.estado ?? "")
                ? "bg-emerald-600 text-white"
                : "bg-muted text-foreground"
            }`}
          >
            {["listo", "entregado", "cerrado"].includes(res.estado ?? "")
              ? "¡Listo para retirar!"
              : etiquetaEstado(res.estado ?? "")}
          </p>

          <p className="text-caption text-muted-foreground">
            Para ver el detalle de los trabajos y el presupuesto, usá el link que
            te mandó el taller.
          </p>
        </section>
      )}
    </main>
  );
}
