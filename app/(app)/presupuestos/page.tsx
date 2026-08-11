import { Plus, FileText, Search } from "lucide-react";
import Link from "next/link";
import { listarPresupuestos } from "@/lib/actions/presupuestos";
import { TarjetaPresupuesto } from "./TarjetaPresupuesto";

export const dynamic = "force-dynamic";

export default async function PaginaPresupuestos() {
  const presupuestos = await listarPresupuestos();

  return (
    <main className="flex-1 overflow-y-auto pt-[calc(var(--safe-top)+1.25rem)] pb-24 lg:pb-8 relative">
      <div className="contenedor-ancho space-y-6">
        <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-foreground">Presupuestos</h1>
            <p className="text-sm text-muted-foreground">Historial de cotizaciones</p>
          </div>
          <Link
            href="/presupuestos/nueva"
            className="flex h-10 items-center justify-center gap-2 rounded-xl bg-accent px-4 text-sm font-semibold text-accent-foreground shadow-sm hover:brightness-110 active:scale-95"
          >
            <Plus className="h-4 w-4" />
            <span>Nuevo Presupuesto</span>
          </Link>
        </header>

        {presupuestos.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-border bg-card p-12 text-center text-muted-foreground">
            <FileText className="h-10 w-10 opacity-20" />
            <p>No hay presupuestos generados recientemente.</p>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {presupuestos.map((p) => (
              <TarjetaPresupuesto key={p.id} presupuesto={p} />
            ))}
          </div>
        )}
      </div>

      {/* FAB para Móvil */}
      <Link
        href="/presupuestos/nueva"
        className="fixed bottom-[calc(var(--safe-bottom)+5rem)] right-4 flex h-14 w-14 items-center justify-center rounded-full bg-accent text-white shadow-lg shadow-accent/30 sm:hidden z-50 transition-transform active:scale-95"
      >
        <Plus className="h-6 w-6" />
      </Link>
    </main>
  );
}
