"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { MessageSquare, Plus, Stethoscope, Trash2, TrendingUp } from "lucide-react";

import { useIsla } from "@/components/isla/IslaContext";
import { agregarNota, quitarNota, type TipoNota } from "@/lib/actions/notas";

export interface Nota {
  id: string;
  tipo: string;
  texto: string;
  precio_estimado: number | null;
}

const money = (n: number) =>
  new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS", maximumFractionDigits: 0 }).format(n);

const CONFIG: Record<
  TipoNota,
  { titulo: string; ayuda: string; placeholder: string; icono: typeof MessageSquare; conPrecio: boolean }
> = {
  anomalia: {
    titulo: "Lo que dijo el cliente",
    ayuda: "En sus palabras, tal como lo contó.",
    placeholder: "Ej. hace un ruido al frenar en bajada",
    icono: MessageSquare,
    conPrecio: false,
  },
  descargo: {
    titulo: "Lo que encontró el taller",
    ayuda: "El diagnóstico. Sale en el comprobante del cliente.",
    placeholder: "Ej. bujes de cremallera con juego",
    icono: Stethoscope,
    conPrecio: false,
  },
  recomendado: {
    titulo: "Presupuesto sugerido",
    ayuda: "Lo que detectaste y el cliente no autorizó ahora. Va aparte del total.",
    placeholder: "Ej. cambiar amortiguadores traseros",
    icono: TrendingUp,
    conPrecio: true,
  },
};

/**
 * Los tres bloques de texto de una orden.
 *
 * El de recomendados lleva precio: es lo que convierte una anotación interna
 * en un presupuesto que el cliente se lleva y puede aprobar la próxima vez.
 * Para el taller es la herramienta de venta más directa que tiene.
 */
export function EditorNotas({
  otId,
  tipo,
  notas,
}: {
  otId: string;
  tipo: TipoNota;
  notas: Nota[];
}) {
  const router = useRouter();
  const { notificar } = useIsla();
  const [texto, setTexto] = useState("");
  const [precio, setPrecio] = useState("");
  const [pendiente, iniciar] = useTransition();

  const cfg = CONFIG[tipo];
  const Icono = cfg.icono;
  const propias = notas.filter((n) => n.tipo === tipo);
  const total = propias.reduce((s, n) => s + Number(n.precio_estimado ?? 0), 0);

  function agregar(e: React.FormEvent) {
    e.preventDefault();
    if (!texto.trim()) return;

    iniciar(async () => {
      const res = await agregarNota({
        otId,
        tipo,
        texto,
        precioEstimado: cfg.conPrecio && precio ? Number(precio) : undefined,
      });
      if (res.error) return notificar({ tipo: "error", mensaje: res.error });
      setTexto("");
      setPrecio("");
      router.refresh();
    });
  }

  function quitar(id: string) {
    iniciar(async () => {
      const res = await quitarNota(id, otId);
      if (res.error) return notificar({ tipo: "error", mensaje: res.error });
      router.refresh();
    });
  }

  return (
    <section className="tarjeta space-y-3 p-4">
      <div className="flex items-start gap-2">
        <Icono className="mt-0.5 h-4 w-4 shrink-0 text-accent" aria-hidden />
        <div className="min-w-0 flex-1">
          <h2 className="t-seccion">{cfg.titulo}</h2>
          <p className="mt-0.5 text-caption text-muted-foreground">{cfg.ayuda}</p>
        </div>
        {cfg.conPrecio && total > 0 && (
          <span className="tabular shrink-0 rounded-full bg-accent-suave px-2.5 py-1 text-caption font-semibold text-accent">
            {money(total)}
          </span>
        )}
      </div>

      {propias.length > 0 && (
        <ul className="divide-y divide-border">
          {propias.map((n) => (
            <li key={n.id} className="flex items-start gap-2 py-2.5">
              <span className="min-w-0 flex-1 text-sm text-foreground">{n.texto}</span>
              {n.precio_estimado != null && (
                <span className="tabular shrink-0 text-sm font-semibold text-foreground">
                  {money(Number(n.precio_estimado))}
                </span>
              )}
              <button
                type="button"
                onClick={() => quitar(n.id)}
                disabled={pendiente}
                aria-label="Quitar"
                className="grid h-8 w-8 shrink-0 place-items-center rounded-full text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive disabled:opacity-50"
              >
                <Trash2 className="h-3.5 w-3.5" aria-hidden />
              </button>
            </li>
          ))}
        </ul>
      )}

      <form onSubmit={agregar} className="space-y-2">
        <div className="flex gap-2">
          <input
            value={texto}
            onChange={(e) => setTexto(e.target.value)}
            placeholder={cfg.placeholder}
            maxLength={400}
            aria-label={cfg.titulo}
            className="min-h-11 flex-1 rounded-[var(--radius-sm)] border border-border bg-card px-3 text-base text-foreground outline-none focus:border-accent"
          />
          {cfg.conPrecio && (
            <input
              value={precio}
              onChange={(e) => setPrecio(e.target.value)}
              type="number"
              step="1"
              min="0"
              placeholder="$"
              aria-label="Precio estimado"
              className="tabular min-h-11 w-28 rounded-[var(--radius-sm)] border border-border bg-card px-3 text-base text-foreground outline-none focus:border-accent"
            />
          )}
          <button
            type="submit"
            disabled={pendiente || !texto.trim()}
            aria-label="Agregar"
            className="grid min-h-11 w-11 shrink-0 place-items-center rounded-[var(--radius-sm)] bg-accent text-accent-foreground transition-transform active:scale-95 disabled:opacity-50"
          >
            <Plus className="h-4.5 w-4.5" strokeWidth={2.5} aria-hidden />
          </button>
        </div>
      </form>
    </section>
  );
}
