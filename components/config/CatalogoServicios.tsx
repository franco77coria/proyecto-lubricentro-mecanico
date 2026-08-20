"use client";

import { Check, Plus, Trash2, Wrench, X } from "lucide-react";
import { useState, useTransition } from "react";

import { useIsla } from "@/components/isla/IslaContext";
import {
  actualizarPrecioServicio,
  archivarServicio,
  crearServicio,
  type ServicioListado,
} from "@/lib/actions/servicios";
import { useFormato } from "@/lib/i18n/I18nContext";

/* El formato de plata sale del taller (idioma + moneda), no de
   "es-AR"/"ARS" escritos a mano. */

/**
 * Precios de la mano de obra del taller.
 *
 * Existe para que el mostrador deje de tipear "Cambio de aceite y filtro" y su
 * precio en cada orden. Además de la lentitud, tipearlo cada vez hace que el
 * mismo trabajo termine con tres precios distintos según quién lo cargó.
 *
 * El precio se edita en la misma fila y no en un modal aparte: con la inflación
 * de acá, actualizar la lista es algo que se hace seguido y sobre varias filas
 * de una sentada.
 */
export function CatalogoServicios({
  servicios: iniciales,
  editable,
}: {
  servicios: ServicioListado[];
  editable: boolean;
}) {
  const { money } = useFormato();
  const { notificar } = useIsla();
  const [servicios, setServicios] = useState(iniciales);
  const [agregando, setAgregando] = useState(false);
  const [pendiente, iniciar] = useTransition();

  const [nombre, setNombre] = useState("");
  const [precio, setPrecio] = useState("");
  const [minutos, setMinutos] = useState("");
  const [editandoId, setEditandoId] = useState<string | null>(null);
  const [precioEdit, setPrecioEdit] = useState("");

  function guardarNuevo(e: React.FormEvent) {
    e.preventDefault();
    iniciar(async () => {
      const res = await crearServicio({
        nombre,
        precioManoObra: Number(precio || 0),
        minutosEstimados: minutos ? Number(minutos) : "",
      });
      if (res.error || !res.id) {
        notificar({ tipo: "error", mensaje: res.error ?? "No se pudo guardar" });
        return;
      }
      setServicios((prev) =>
        [
          ...prev,
          {
            id: res.id!,
            nombre: nombre.trim(),
            precioManoObra: Number(precio || 0),
            minutosEstimados: minutos ? Number(minutos) : null,
          },
        ].sort((a, b) => a.nombre.localeCompare(b.nombre, "es")),
      );
      setNombre("");
      setPrecio("");
      setMinutos("");
      setAgregando(false);
      notificar({ tipo: "exito", mensaje: "Trabajo agregado al catálogo" });
    });
  }

  function guardarPrecio(id: string) {
    const valor = Number(precioEdit);
    if (!Number.isFinite(valor) || valor < 0) {
      notificar({ tipo: "error", mensaje: "Precio inválido" });
      return;
    }
    iniciar(async () => {
      const res = await actualizarPrecioServicio(id, valor);
      if (res.error) {
        notificar({ tipo: "error", mensaje: res.error });
        return;
      }
      setServicios((prev) =>
        prev.map((s) => (s.id === id ? { ...s, precioManoObra: valor } : s)),
      );
      setEditandoId(null);
      notificar({ tipo: "exito", mensaje: "Precio actualizado" });
    });
  }

  function archivar(id: string, nombreServicio: string) {
    // Optimista: la fila se va al toque y si falla se avisa. Archivar es
    // reversible desde la base, así que el riesgo de mostrarlo antes es bajo.
    setServicios((prev) => prev.filter((s) => s.id !== id));
    iniciar(async () => {
      const res = await archivarServicio(id);
      if (res.error) {
        notificar({ tipo: "error", mensaje: res.error });
        return;
      }
      notificar({ tipo: "exito", mensaje: `${nombreServicio} salió del catálogo` });
    });
  }

  return (
    <section className="tarjeta space-y-3 p-4">
      <div className="flex items-center justify-between gap-2">
        <h2 className="t-seccion flex items-center gap-1.5">
          <Wrench className="h-3.5 w-3.5 text-accent" aria-hidden />
          Precios de mano de obra
        </h2>
        {editable && !agregando && (
          <button
            type="button"
            onClick={() => setAgregando(true)}
            className="inline-flex min-h-9 items-center gap-1.5 rounded-[var(--radius-sm)] bg-muted px-3 text-caption font-semibold text-foreground active:scale-95"
          >
            <Plus className="h-3.5 w-3.5" aria-hidden />
            Agregar
          </button>
        )}
      </div>

      {servicios.length === 0 && !agregando && (
        <p className="text-caption text-muted-foreground">
          Todavía no hay trabajos cargados. Al cargarlos, aparecen para elegir en
          la orden y dejás de tipear el precio cada vez.
        </p>
      )}

      {servicios.length > 0 && (
        <ul className="divide-y divide-border">
          {servicios.map((s) => (
            <li key={s.id} className="flex items-center gap-2 py-2">
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-medium text-foreground">{s.nombre}</span>
                {s.minutosEstimados ? (
                  <span className="block text-caption text-muted-foreground">
                    {s.minutosEstimados} min estimados
                  </span>
                ) : null}
              </span>

              {editandoId === s.id ? (
                <>
                  <input
                    type="number"
                    min="0"
                    autoFocus
                    value={precioEdit}
                    onChange={(e) => setPrecioEdit(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") guardarPrecio(s.id);
                      if (e.key === "Escape") setEditandoId(null);
                    }}
                    aria-label={`Precio de ${s.nombre}`}
                    className="min-h-9 w-28 rounded-[var(--radius-sm)] border border-accent bg-card px-2 text-sm text-foreground outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => guardarPrecio(s.id)}
                    disabled={pendiente}
                    aria-label="Guardar precio"
                    className="grid h-9 w-9 shrink-0 place-items-center rounded-[var(--radius-sm)] bg-accent text-white active:scale-95"
                  >
                    <Check className="h-4 w-4" aria-hidden />
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditandoId(null)}
                    aria-label="Cancelar"
                    className="grid h-9 w-9 shrink-0 place-items-center rounded-[var(--radius-sm)] bg-muted text-muted-foreground active:scale-95"
                  >
                    <X className="h-4 w-4" aria-hidden />
                  </button>
                </>
              ) : (
                <>
                  <span className="tabular shrink-0 text-sm font-semibold text-foreground">
                    {money(s.precioManoObra)}
                  </span>
                  {editable && (
                    <>
                      <button
                        type="button"
                        onClick={() => {
                          setEditandoId(s.id);
                          setPrecioEdit(String(s.precioManoObra));
                        }}
                        className="shrink-0 rounded-[var(--radius-sm)] px-2 py-1 text-caption font-semibold text-accent hover:bg-accent/10"
                      >
                        Cambiar
                      </button>
                      <button
                        type="button"
                        onClick={() => archivar(s.id, s.nombre)}
                        aria-label={`Sacar ${s.nombre} del catálogo`}
                        className="grid h-9 w-9 shrink-0 place-items-center rounded-[var(--radius-sm)] text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" aria-hidden />
                      </button>
                    </>
                  )}
                </>
              )}
            </li>
          ))}
        </ul>
      )}

      {agregando && (
        <form onSubmit={guardarNuevo} className="space-y-2 rounded-[var(--radius-sm)] bg-muted/50 p-3">
          <input
            autoFocus
            required
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            placeholder="Ej: Cambio de aceite y filtro"
            maxLength={80}
            aria-label="Nombre del trabajo"
            className="min-h-10 w-full rounded-[var(--radius-sm)] border border-border bg-card px-3 text-sm text-foreground outline-none focus:border-accent"
          />
          <div className="grid grid-cols-2 gap-2">
            <input
              type="number"
              min="0"
              required
              value={precio}
              onChange={(e) => setPrecio(e.target.value)}
              placeholder="Precio $"
              aria-label="Precio de mano de obra"
              className="min-h-10 w-full rounded-[var(--radius-sm)] border border-border bg-card px-3 text-sm text-foreground outline-none focus:border-accent"
            />
            <input
              type="number"
              min="0"
              value={minutos}
              onChange={(e) => setMinutos(e.target.value)}
              placeholder="Minutos (opcional)"
              aria-label="Minutos estimados"
              className="min-h-10 w-full rounded-[var(--radius-sm)] border border-border bg-card px-3 text-sm text-foreground outline-none focus:border-accent"
            />
          </div>
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setAgregando(false)}
              className="min-h-10 rounded-[var(--radius-sm)] px-3 text-caption font-semibold text-muted-foreground hover:bg-muted"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={pendiente}
              className="min-h-10 rounded-[var(--radius-sm)] bg-accent px-4 text-caption font-bold text-white active:scale-95 disabled:opacity-60"
            >
              {pendiente ? "Guardando…" : "Guardar trabajo"}
            </button>
          </div>
        </form>
      )}

      {!editable && servicios.length > 0 && (
        <p className="text-caption text-muted-foreground">Los precios los edita el dueño.</p>
      )}
    </section>
  );
}
