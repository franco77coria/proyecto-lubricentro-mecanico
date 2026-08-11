"use client";

import { Search, Plus, X, Filter } from "lucide-react";
import { useState, useTransition } from "react";
import { buscarEquivalenciasFiltro, agregarEquivalenciaFiltro, type EquivalenciaFiltro } from "@/lib/actions/tecnica";
import { useIsla } from "@/components/isla/IslaContext";

export function BuscadorFiltros() {
  const { notificar } = useIsla();
  const [isPending, startTransition] = useTransition();
  const [busqueda, setBusqueda] = useState("");
  const [resultados, setResultados] = useState<EquivalenciaFiltro[]>([]);
  const [buscando, setBuscando] = useState(false);
  const [busquedaActiva, setBusquedaActiva] = useState("");

  const [modoAgregar, setModoAgregar] = useState(false);
  const [nuevoCodA, setNuevoCodA] = useState("");
  const [nuevaMarcaA, setNuevaMarcaA] = useState("");
  const [nuevoCodB, setNuevoCodB] = useState("");
  const [nuevaMarcaB, setNuevaMarcaB] = useState("");

  const handleBuscar = (e: React.FormEvent) => {
    e.preventDefault();
    if (!busqueda.trim()) return;

    setBuscando(true);
    setBusquedaActiva(busqueda.trim().toUpperCase());
    
    startTransition(async () => {
      const res = await buscarEquivalenciasFiltro(busqueda);
      setResultados(res);
      setBuscando(false);
    });
  };

  const handleAgregar = (e: React.FormEvent) => {
    e.preventDefault();
    startTransition(async () => {
      const res = await agregarEquivalenciaFiltro({
        codigoA: nuevoCodA,
        marcaA: nuevaMarcaA,
        codigoB: nuevoCodB,
        marcaB: nuevaMarcaB
      });

      if (res.error) {
        notificar({ tipo: "alerta", mensaje: res.error });
      } else {
        notificar({ tipo: "exito", mensaje: "Equivalencia agregada (pendiente de aprobación)" });
        setModoAgregar(false);
        setNuevoCodA("");
        setNuevaMarcaA("");
        setNuevoCodB("");
        setNuevaMarcaB("");
        
        // Refrescar búsqueda si aplica
        if (busquedaActiva && (nuevoCodA === busquedaActiva || nuevoCodB === busquedaActiva)) {
          const res = await buscarEquivalenciasFiltro(busquedaActiva);
          setResultados(res);
        }
      }
    });
  };

  return (
    <div className="space-y-6">
      <form onSubmit={handleBuscar} className="relative flex items-center">
        <Search className="absolute left-4 h-5 w-5 text-muted-foreground" />
        <input
          type="text"
          placeholder="Ingresar código de filtro (ej: HU 719/7 x)"
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value.toUpperCase())}
          className="w-full h-14 pl-12 pr-28 rounded-2xl border-2 border-border bg-card text-lg focus-visible:outline-none focus-visible:border-accent transition-colors uppercase"
        />
        <div className="absolute right-2 flex items-center gap-1">
          {busqueda && (
            <button
              type="button"
              onClick={() => { setBusqueda(""); setResultados([]); setBusquedaActiva(""); }}
              className="p-2 text-muted-foreground hover:text-foreground transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          )}
          <button
            type="submit"
            disabled={isPending || !busqueda.trim()}
            className="h-10 px-4 rounded-xl bg-accent text-white font-bold text-sm hover:brightness-110 disabled:opacity-50 transition-all"
          >
            {buscando ? "..." : "Buscar"}
          </button>
        </div>
      </form>

      {busquedaActiva && !buscando && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold">
              Resultados para <span className="text-accent">{busquedaActiva}</span>
            </h2>
            {!modoAgregar && (
              <button
                onClick={() => { setModoAgregar(true); setNuevoCodA(busquedaActiva); }}
                className="flex items-center gap-1.5 text-sm font-bold text-emerald-600 bg-emerald-500/10 px-3 py-1.5 rounded-lg hover:bg-emerald-500/20"
              >
                <Plus className="h-4 w-4" /> Agregar Cruzada
              </button>
            )}
          </div>

          {resultados.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-border p-8 text-center text-muted-foreground flex flex-col items-center justify-center">
              <Filter className="h-8 w-8 mb-3 opacity-20" />
              <p className="mb-4">No se encontraron filtros equivalentes para este código.</p>
              {!modoAgregar && (
                <button
                  onClick={() => { setModoAgregar(true); setNuevoCodA(busquedaActiva); }}
                  className="flex items-center gap-2 text-sm font-bold text-emerald-600 bg-emerald-500/10 px-4 py-2 rounded-xl hover:bg-emerald-500/20"
                >
                  <Plus className="h-4 w-4" /> Aportar Equivalencia
                </button>
              )}
            </div>
          ) : (
            <div className="grid gap-3">
              {resultados.map((r, i) => (
                <div key={i} className="flex items-center justify-between p-4 rounded-xl border border-border bg-card shadow-sm">
                  <div>
                    <div className="text-sm font-semibold text-muted-foreground uppercase">{r.marca || 'Marca Desconocida'}</div>
                    <div className="text-xl font-black">{r.codigo}</div>
                  </div>
                  {r.tipo && (
                    <span className="px-3 py-1 rounded-full bg-muted text-xs font-bold uppercase tracking-wider">
                      {r.tipo}
                    </span>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {modoAgregar && (
        <div className="mt-6 rounded-2xl border-2 border-emerald-500/20 bg-emerald-500/5 p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-emerald-700 dark:text-emerald-500">Aportar Nueva Equivalencia</h3>
            <button onClick={() => setModoAgregar(false)} className="text-muted-foreground hover:text-foreground p-1">
              <X className="h-5 w-5" />
            </button>
          </div>
          
          <form onSubmit={handleAgregar} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-3">
                <div className="font-semibold text-sm border-b border-emerald-500/20 pb-1">Filtro A</div>
                <input
                  placeholder="Código"
                  required
                  value={nuevoCodA}
                  onChange={e => setNuevoCodA(e.target.value.toUpperCase())}
                  className="w-full h-10 px-3 rounded-lg border border-input bg-background focus:outline-none focus:ring-1 focus:ring-accent uppercase"
                />
                <input
                  placeholder="Marca (opcional)"
                  value={nuevaMarcaA}
                  onChange={e => setNuevaMarcaA(e.target.value.toUpperCase())}
                  className="w-full h-10 px-3 rounded-lg border border-input bg-background focus:outline-none focus:ring-1 focus:ring-accent uppercase"
                />
              </div>
              
              <div className="space-y-3">
                <div className="font-semibold text-sm border-b border-emerald-500/20 pb-1">Filtro B (Equivalente)</div>
                <input
                  placeholder="Código"
                  required
                  value={nuevoCodB}
                  onChange={e => setNuevoCodB(e.target.value.toUpperCase())}
                  className="w-full h-10 px-3 rounded-lg border border-input bg-background focus:outline-none focus:ring-1 focus:ring-accent uppercase"
                />
                <input
                  placeholder="Marca (opcional)"
                  value={nuevaMarcaB}
                  onChange={e => setNuevaMarcaB(e.target.value.toUpperCase())}
                  className="w-full h-10 px-3 rounded-lg border border-input bg-background focus:outline-none focus:ring-1 focus:ring-accent uppercase"
                />
              </div>
            </div>
            
            <button
              type="submit"
              disabled={isPending || !nuevoCodA || !nuevoCodB}
              className="w-full h-12 rounded-xl bg-emerald-600 text-white font-bold hover:bg-emerald-700 disabled:opacity-50 transition-colors"
            >
              {isPending ? "Guardando..." : "Guardar Equivalencia"}
            </button>
            <p className="text-xs text-center text-muted-foreground mt-2">
              Todas las cruzas aportadas quedan pendientes de validación para mantener la integridad del catálogo nacional.
            </p>
          </form>
        </div>
      )}
    </div>
  );
}
