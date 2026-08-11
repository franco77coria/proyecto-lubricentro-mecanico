import { Wrench } from "lucide-react";
import { BuscadorFiltros } from "./BuscadorFiltros";

export const dynamic = "force-dynamic";

export default function PaginaEquivalencias() {
  return (
    <main className="flex-1 pt-[calc(var(--safe-top)+1.25rem)] pb-24 lg:pb-8">
      <div className="contenedor-angosto space-y-6">
        <header>
          <div className="flex items-center gap-2 text-accent mb-2">
            <Wrench className="h-5 w-5" />
            <span className="font-bold uppercase tracking-wider text-xs">Base Técnica</span>
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Equivalencia de Filtros</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Buscá un código (ej. Mann) para ver con qué otros filtros de distintas marcas es compatible.
          </p>
        </header>

        <BuscadorFiltros />
      </div>
    </main>
  );
}
