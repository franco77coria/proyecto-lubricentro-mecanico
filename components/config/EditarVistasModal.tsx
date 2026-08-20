"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Check } from "lucide-react";

import { useIsla } from "@/components/isla/IslaContext";
import { Sheet } from "@/components/sheet/Sheet";
import { actualizarVistasUsuario } from "@/lib/actions/equipo";
import { ITEMS_NAV } from "@/lib/navegacion";

export function EditarVistasModal({
  abierto,
  onCerrar,
  usuario,
}: {
  abierto: boolean;
  onCerrar: () => void;
  usuario: {
    userId: string;
    nombre: string | null;
    vistasPermitidas?: string[] | null;
  } | null;
}) {
  const router = useRouter();
  const { notificar } = useIsla();
  const [pendiente, iniciar] = useTransition();

  const [vistas, setVistas] = useState<string[]>(
    usuario?.vistasPermitidas || ["/tablero", "/kanban", "/vehiculos", "/stock/equivalencias", "/turnos"],
  );

  function toggleVista(href: string) {
    setVistas((prev) =>
      prev.includes(href) ? prev.filter((h) => h !== href) : [...prev, href],
    );
  }

  function handleGuardar() {
    if (!usuario) return;
    iniciar(async () => {
      const res = await actualizarVistasUsuario(usuario.userId, vistas);
      if (res.error) {
        notificar({ tipo: "error", mensaje: res.error });
      } else {
        notificar({ tipo: "exito", mensaje: "Pantallas autorizadas actualizadas" });
        onCerrar();
        router.refresh();
      }
    });
  }

  if (!usuario) return null;

  return (
    <Sheet
      abierto={abierto}
      onCerrar={onCerrar}
      titulo={`Pantallas de ${usuario.nombre || "Mecánico"}`}
    >
      <div className="space-y-5 p-5">
        <p className="text-xs text-muted-foreground font-medium">
          Seleccioná exactamente qué secciones y pantallas puede ver este usuario en el Sidebar y menú del celular.
        </p>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
          {/* Se ofrecen solo las pantallas que el rol puede abrir. Antes
              aparecían también las de `sinMecanico` (Compras, Avisos): el
              dueño las tildaba, el botón salía en el sidebar y la pantalla lo
              rebotaba igual. La lista de vistas achica, no amplía. */}
          {ITEMS_NAV.filter(
            (i) => !i.soloDueno && !i.sinMecanico && i.href !== "/config",
          ).map((item) => {
            const seleccionada = vistas.includes(item.href);
            const Icono = item.icono;
            return (
              <button
                key={item.href}
                type="button"
                onClick={() => toggleVista(item.href)}
                className={`flex items-center gap-2 p-3 rounded-2xl border text-xs font-bold transition-all text-left ${
                  seleccionada
                    ? "border-accent bg-accent/10 text-foreground shadow-sm"
                    : "border-border/80 bg-card text-muted-foreground hover:text-foreground"
                }`}
              >
                <Icono className={`h-4 w-4 shrink-0 ${seleccionada ? "text-accent" : "text-muted-foreground"}`} />
                <span className="truncate">{item.etiqueta}</span>
              </button>
            );
          })}
        </div>

        <button
          type="button"
          disabled={pendiente}
          onClick={handleGuardar}
          className="flex min-h-12 w-full items-center justify-center gap-2 rounded-2xl bg-accent text-sm font-black text-white shadow-lg transition-transform active:scale-[0.98] disabled:opacity-60"
        >
          <Check className="h-4 w-4" />
          <span>{pendiente ? "Guardando…" : "Guardar Permisos"}</span>
        </button>
      </div>
    </Sheet>
  );
}
