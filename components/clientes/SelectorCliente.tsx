"use client";

import { useState, useEffect, useTransition } from "react";
import { Search, UserCheck, UserPlus, Phone, Car, X, Loader2 } from "lucide-react";
import { buscarClientesOmni, type ClienteOmniResultado } from "@/lib/actions/clientes";
import { PlacaPatente } from "@/components/ui/PlacaPatente";
import { FormCliente } from "./FormCliente";

export interface SelectorClienteProps {
  clienteNombre: string;
  clienteApellido: string;
  clienteTelefono: string;
  clienteDocumento?: string;
  onCambioNombre: (val: string) => void;
  onCambioApellido: (val: string) => void;
  onCambioTelefono: (val: string) => void;
  onCambioDocumento?: (val: string) => void;
  onSeleccionarVehiculo?: (vehiculo: {
    id: string;
    patente: string;
    anio?: number | null;
    marca?: string | null;
    modelo?: string | null;
  }) => void;
}

export function SelectorCliente({
  clienteNombre,
  clienteApellido,
  clienteTelefono,
  clienteDocumento = "",
  onCambioNombre,
  onCambioApellido,
  onCambioTelefono,
  onCambioDocumento,
  onSeleccionarVehiculo,
}: SelectorClienteProps) {
  const [termino, setTermino] = useState("");
  const [resultados, setResultados] = useState<ClienteOmniResultado[]>([]);
  const [cargando, setCargando] = useState(false);
  const [clienteSeleccionado, setClienteSeleccionado] = useState<ClienteOmniResultado | null>(null);
  const [, startTransition] = useTransition();

  function handleCambioTermino(val: string) {
    setTermino(val);
    if (val.trim().length < 2) {
      setResultados([]);
      setCargando(false);
    }
  }

  // Debounce de búsqueda
  useEffect(() => {
    if (clienteSeleccionado) return;
    const q = termino.trim();
    if (q.length < 2) return;

    const timer = setTimeout(() => {
      setCargando(true);
      startTransition(async () => {
        try {
          const res = await buscarClientesOmni(q);
          setResultados(res);
        } catch (err) {
          console.error("[SelectorCliente]", err);
        } finally {
          setCargando(false);
        }
      });
    }, 280);

    return () => clearTimeout(timer);
  }, [termino, clienteSeleccionado]);

  function handleSeleccionar(c: ClienteOmniResultado) {
    setClienteSeleccionado(c);
    onCambioNombre(c.nombre);
    onCambioApellido(c.apellido || "");
    onCambioTelefono(c.telefono || "");
    if (c.documento) onCambioDocumento?.(c.documento);
    setResultados([]);
    setTermino("");
  }

  function handleLimpiarSeleccion() {
    setClienteSeleccionado(null);
    onCambioNombre("");
    onCambioApellido("");
    onCambioTelefono("");
    onCambioDocumento?.("");
    setTermino("");
    setResultados([]);
  }

  return (
    <div className="space-y-3">
      {/* 1. Buscador Rápido de Clientes Registrados */}
      {!clienteSeleccionado && (
        <div className="relative">
          <div className="flex items-center justify-between mb-1">
            <label htmlFor="buscar-cliente" className="block text-caption font-semibold text-muted-foreground">
              Buscar cliente existente (por Nombre, Teléfono o Patente)
            </label>
            <FormCliente
              onClienteCreado={(c) => {
                onCambioNombre(c.nombre);
                onCambioApellido(c.apellido);
                if (c.telefono) onCambioTelefono(c.telefono);
                if (c.documento) onCambioDocumento?.(c.documento);
              }}
              botonTrigger={
                <button
                  type="button"
                  className="inline-flex items-center gap-1 text-[11px] font-bold text-accent hover:underline active:scale-95"
                >
                  <UserPlus className="h-3 w-3" />
                  <span>+ Crear nuevo</span>
                </button>
              }
            />
          </div>
          <div className="relative flex items-center">
            <Search className="absolute left-3.5 h-4 w-4 text-muted-foreground" aria-hidden />
            <input
              id="buscar-cliente"
              type="text"
              value={termino}
              onChange={(e) => handleCambioTermino(e.target.value)}
              placeholder="Ej: Juan Pérez, 114455, o AF123..."
              className="min-h-12 w-full rounded-xl border border-border bg-muted/60 pl-10 pr-10 text-xs font-medium text-foreground placeholder:text-muted-foreground focus:border-accent focus:bg-card focus:outline-none transition-all"
            />
            <div className="absolute right-3">
              {cargando ? (
                <Loader2 className="h-4 w-4 animate-spin text-accent" />
              ) : termino ? (
                <button
                  type="button"
                  onClick={() => {
                    setTermino("");
                    setResultados([]);
                  }}
                  className="p-1 text-muted-foreground hover:text-foreground"
                >
                  <X className="h-4 w-4" />
                </button>
              ) : null}
            </div>
          </div>

          {/* Resultados flotantes */}
          {resultados.length > 0 && (
            <div className="absolute left-0 right-0 top-full z-30 mt-1 max-h-64 overflow-y-auto rounded-2xl border border-border bg-card p-2 shadow-xl space-y-1.5 animate-in fade-in zoom-in-95">
              <p className="px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                Clientes encontrados ({resultados.length})
              </p>
              {resultados.map((c) => (
                <div
                  key={c.id}
                  className="rounded-xl border border-border/50 bg-muted/20 p-2.5 transition-all hover:border-accent/40 hover:bg-accent/5 cursor-pointer"
                  onClick={() => handleSeleccionar(c)}
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="min-w-0">
                      <p className="text-xs font-black text-foreground truncate">
                        {c.nombre} {c.apellido || ""}
                      </p>
                      {c.telefono && (
                        <p className="flex items-center gap-1 text-[11px] text-emerald-600 font-semibold mt-0.5">
                          <Phone className="h-3 w-3" />
                          <span>{c.telefono}</span>
                        </p>
                      )}
                    </div>
                    <button
                      type="button"
                      className="shrink-0 rounded-lg bg-accent px-2.5 py-1 text-[11px] font-bold text-white shadow-xs hover:brightness-105 active:scale-95 transition-all"
                    >
                      Elegir
                    </button>
                  </div>

                  {/* Vehículos del cliente */}
                  {c.vehiculos.length > 0 && (
                    <div className="mt-2 flex flex-wrap items-center gap-1.5 pt-1.5 border-t border-border/40">
                      <span className="text-[10px] font-medium text-muted-foreground flex items-center gap-1">
                        <Car className="h-3 w-3" /> Autos:
                      </span>
                      {c.vehiculos.map((v) => (
                        <button
                          key={v.id}
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleSeleccionar(c);
                            onSeleccionarVehiculo?.(v);
                          }}
                          className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-card px-2 py-0.5 text-[11px] font-bold text-foreground hover:border-accent hover:text-accent transition-colors"
                          title="Seleccionar cliente y este auto"
                        >
                          <PlacaPatente patente={v.patente} size="sm" />
                          <span>{[v.marca, v.modelo].filter(Boolean).join(" ")}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* 2. Tarjeta de Cliente Seleccionado */}
      {clienteSeleccionado ? (
        <div className="flex items-center justify-between rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3 shadow-xs animate-in fade-in">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-emerald-600 text-white">
              <UserCheck className="h-4 w-4" />
            </div>
            <div className="min-w-0">
              <span className="block text-[10px] font-bold uppercase tracking-wider text-emerald-600">
                Cliente Frecuente
              </span>
              <p className="text-xs font-black text-foreground truncate">
                {clienteNombre} {clienteApellido}
              </p>
              {clienteTelefono && (
                <p className="text-[11px] font-semibold text-muted-foreground">{clienteTelefono}</p>
              )}
            </div>
          </div>

          <button
            type="button"
            onClick={handleLimpiarSeleccion}
            className="rounded-lg border border-border bg-card px-2.5 py-1 text-xs font-bold text-muted-foreground hover:bg-muted hover:text-foreground active:scale-95 transition-all"
          >
            Cambiar
          </button>
        </div>
      ) : (
        /* 3. Formulario Manual (cuando es cliente nuevo) */
        <div className="space-y-3 pt-1">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-1.5 text-[11px] font-semibold text-muted-foreground">
              <UserPlus className="h-3.5 w-3.5 text-accent" />
              <span>O cargá los datos manualmente si es nuevo:</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label htmlFor="cliente-nombre-in" className="text-caption text-muted-foreground">
                Nombre
              </label>
              <input
                id="cliente-nombre-in"
                type="text"
                placeholder="Ej: Juan"
                value={clienteNombre}
                onChange={(e) => onCambioNombre(e.target.value)}
                className="mt-1 min-h-11 w-full rounded-xl border border-border bg-muted px-3 text-xs font-medium text-foreground focus:border-accent focus:outline-none"
              />
            </div>
            <div>
              <label htmlFor="cliente-apellido-in" className="text-caption text-muted-foreground">
                Apellido
              </label>
              <input
                id="cliente-apellido-in"
                type="text"
                placeholder="Ej: Pérez"
                value={clienteApellido}
                onChange={(e) => onCambioApellido(e.target.value)}
                className="mt-1 min-h-11 w-full rounded-xl border border-border bg-muted px-3 text-xs font-medium text-foreground focus:border-accent focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label htmlFor="cliente-tel-in" className="text-caption text-muted-foreground">
                Teléfono (WhatsApp)
              </label>
              <input
                id="cliente-tel-in"
                type="tel"
                placeholder="Ej: 11 4455 6677"
                value={clienteTelefono}
                onChange={(e) => onCambioTelefono(e.target.value)}
                className="mt-1 min-h-11 w-full rounded-xl border border-border bg-muted px-3 text-xs font-medium text-foreground focus:border-accent focus:outline-none"
              />
            </div>
            <div>
              <label htmlFor="cliente-doc-in" className="text-caption text-muted-foreground">
                DNI o CUIT (opcional)
              </label>
              <input
                id="cliente-doc-in"
                type="text"
                placeholder="Ej: 38123456"
                value={clienteDocumento}
                onChange={(e) => onCambioDocumento?.(e.target.value)}
                className="mt-1 min-h-11 w-full rounded-xl border border-border bg-muted px-3 text-xs font-medium text-foreground focus:border-accent focus:outline-none"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

