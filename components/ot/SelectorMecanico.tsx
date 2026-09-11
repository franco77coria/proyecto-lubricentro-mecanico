"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle, ChevronDown, Loader2, UserX, Wrench } from "lucide-react";
import { asignarMecanicoOT } from "@/lib/actions/ot";
import { useIsla } from "@/components/isla/IslaContext";
import { formatearRol } from "@/lib/ot-usuarios";

export interface MiembroEquipo {
  user_id: string;
  nombre: string | null;
  rol: string;
}

export function SelectorMecanico({
  otId,
  asignadoA,
  miembros,
}: {
  otId: string;
  asignadoA?: string | null;
  miembros: MiembroEquipo[];
}) {
  const router = useRouter();
  const [pendiente, iniciar] = useTransition();
  const { notificar } = useIsla();
  const [desplegado, setDesplegado] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const miembroActual = miembros.find((m) => m.user_id === asignadoA);

  // Cerrar al hacer clic afuera o presionar Escape
  useEffect(() => {
    if (!desplegado) return;
    const handleClickAfuera = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setDesplegado(false);
      }
    };
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") setDesplegado(false);
    };

    document.addEventListener("mousedown", handleClickAfuera);
    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("mousedown", handleClickAfuera);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [desplegado]);

  const handleCambio = (nuevoMecanicoId: string) => {
    setDesplegado(false);
    if (nuevoMecanicoId === (asignadoA || "")) return;

    iniciar(async () => {
      const res = await asignarMecanicoOT(otId, nuevoMecanicoId || null);
      if (res.error) {
        notificar({ tipo: "error", mensaje: res.error });
      } else {
        const nuevoNombre = miembros.find((m) => m.user_id === nuevoMecanicoId)?.nombre;
        notificar({
          tipo: "exito",
          mensaje: nuevoMecanicoId
            ? `Mecánico asignado: ${nuevoNombre || "Mecánico"}`
            : "Mecánico desasignado",
        });
        router.refresh();
      }
    });
  };

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => setDesplegado(!desplegado)}
        disabled={pendiente}
        className="inline-flex min-h-12 items-center gap-2.5 rounded-2xl bg-card border border-border/80 px-4 text-xs font-black text-foreground shadow-sm transition-all hover:border-accent hover:bg-card-elevada active:scale-95 disabled:opacity-50"
      >
        {pendiente ? (
          <Loader2 className="h-4 w-4 animate-spin text-accent shrink-0" aria-hidden />
        ) : (
          <Wrench className="h-4 w-4 text-accent shrink-0" aria-hidden />
        )}

        <div className="flex items-center gap-1.5 min-w-0">
          {miembroActual ? (
            <>
              <span className="truncate max-w-[130px] sm:max-w-[180px]">
                {miembroActual.nombre || "Mecánico"}
              </span>
              <span className="rounded-md bg-accent/15 px-1.5 py-0.5 text-[10px] font-bold text-accent uppercase tracking-wider hidden sm:inline-block">
                {formatearRol(miembroActual.rol)}
              </span>
            </>
          ) : (
            <span className="text-muted-foreground font-bold">Sin mecánico asignado</span>
          )}
        </div>

        <ChevronDown
          className={`h-4 w-4 transition-transform duration-200 text-muted-foreground shrink-0 ${
            desplegado ? "rotate-180" : ""
          }`}
          aria-hidden
        />
      </button>

      {desplegado && (
        <div className="absolute left-0 sm:right-0 sm:left-auto top-14 z-50 w-72 rounded-2xl border border-border bg-card p-1.5 shadow-2xl backdrop-blur-2xl animate-in fade-in zoom-in-95 duration-150">
          <div className="flex items-center justify-between px-3 py-2 text-[10px] font-mono font-bold uppercase tracking-wider text-muted-foreground border-b border-border/60 mb-1">
            <span>Asignar a la orden:</span>
            <span className="text-[10px] font-semibold text-accent">{miembros.length} en equipo</span>
          </div>

          <button
            type="button"
            onClick={() => handleCambio("")}
            className={`flex w-full min-h-11 items-center justify-between rounded-xl px-3 py-2 text-left text-xs transition-colors ${
              !asignadoA
                ? "bg-accent/15 text-accent font-black"
                : "text-foreground hover:bg-muted font-bold"
            }`}
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
                <UserX className="h-4 w-4" />
              </div>
              <div className="flex flex-col min-w-0">
                <span className="truncate">Sin mecánico asignado</span>
                <span className="text-[10px] text-muted-foreground font-normal">
                  Queda libre en la cola general
                </span>
              </div>
            </div>
            {!asignadoA && <CheckCircle className="h-4 w-4 text-accent shrink-0 ml-2" />}
          </button>

          {miembros.length > 0 && <div className="my-1 border-t border-border/60" />}

          <div className="max-h-60 overflow-y-auto space-y-0.5">
            {miembros.map((m) => {
              const esSeleccionado = asignadoA === m.user_id;
              const inicial = (m.nombre || "M")[0].toUpperCase();
              return (
                <button
                  key={m.user_id}
                  type="button"
                  onClick={() => handleCambio(m.user_id)}
                  className={`flex w-full min-h-11 items-center justify-between rounded-xl px-3 py-2 text-left text-xs transition-colors ${
                    esSeleccionado
                      ? "bg-accent/15 text-accent font-black"
                      : "text-foreground hover:bg-muted font-bold"
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div
                      className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg font-black text-xs ${
                        esSeleccionado ? "bg-accent text-white" : "bg-accent/15 text-accent"
                      }`}
                    >
                      {inicial}
                    </div>
                    <div className="flex flex-col min-w-0 text-left">
                      <span className="truncate font-bold text-foreground">
                        {m.nombre || "Mecánico"}
                      </span>
                      <span className="text-[10px] text-muted-foreground font-normal">
                        {formatearRol(m.rol)}
                      </span>
                    </div>
                  </div>
                  {esSeleccionado && <CheckCircle className="h-4 w-4 text-accent shrink-0 ml-2" />}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
