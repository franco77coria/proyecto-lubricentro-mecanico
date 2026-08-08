"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Pencil, Plus, X } from "lucide-react";

import { useIsla } from "@/components/isla/IslaContext";
import { actualizarCliente, crearCliente } from "@/lib/actions/clientes";

export interface DatosCliente {
  id?: string;
  nombre: string;
  apellido?: string | null;
  telefono?: string | null;
  email?: string | null;
  documento?: string | null;
  notas?: string | null;
}

/**
 * Alta y edición de un cliente.
 *
 * El mismo formulario para las dos cosas: los campos son idénticos y tener dos
 * pantallas casi iguales garantiza que tarde o temprano queden distintas.
 */
export function FormCliente({ cliente }: { cliente?: DatosCliente }) {
  const router = useRouter();
  const { notificar } = useIsla();
  const [abierto, setAbierto] = useState(false);
  const [pendiente, iniciar] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const editando = Boolean(cliente?.id);

  const [f, setF] = useState({
    nombre: cliente?.nombre ?? "",
    apellido: cliente?.apellido ?? "",
    telefono: cliente?.telefono ?? "",
    email: cliente?.email ?? "",
    documento: cliente?.documento ?? "",
    notas: cliente?.notas ?? "",
  });

  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setF((prev) => ({ ...prev, [k]: e.target.value }));

  function guardar(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    iniciar(async () => {
      const res = editando ? await actualizarCliente(cliente!.id!, f) : await crearCliente(f);
      if (res.error) return setError(res.error);

      notificar({ tipo: "exito", mensaje: editando ? "Cliente actualizado" : "Cliente agregado" });
      setAbierto(false);
      router.refresh();
    });
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setAbierto(true)}
        className={
          editando
            ? "grid h-10 w-10 place-items-center rounded-[var(--radius-sm)] text-muted-foreground transition-colors hover:bg-muted hover:text-accent"
            : "flex min-h-11 items-center gap-2 rounded-[var(--radius-sm)] bg-accent px-4 text-sm font-semibold text-accent-foreground shadow-[var(--sombra-sutil)] transition-transform hover:brightness-110 active:scale-[0.98]"
        }
        aria-label={editando ? `Editar ${cliente?.nombre}` : undefined}
      >
        {editando ? (
          <Pencil className="h-4 w-4" aria-hidden />
        ) : (
          <>
            <Plus className="h-4 w-4" strokeWidth={2.5} aria-hidden />
            Nuevo cliente
          </>
        )}
      </button>

      {abierto && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-slate-900/50 sm:items-center sm:p-4"
          role="dialog"
          aria-modal="true"
          aria-label={editando ? "Editar cliente" : "Nuevo cliente"}
        >
          <div className="max-h-[88dvh] w-full overflow-y-auto rounded-t-[var(--radius-lg)] bg-card p-5 pb-[calc(var(--safe-bottom)+1.25rem)] shadow-[var(--sombra-alta)] sm:max-w-md sm:rounded-[var(--radius-lg)] sm:pb-5">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-base font-semibold text-foreground">
                {editando ? "Editar cliente" : "Nuevo cliente"}
              </h3>
              <button
                type="button"
                onClick={() => setAbierto(false)}
                aria-label="Cerrar"
                className="grid h-9 w-9 place-items-center rounded-full text-muted-foreground hover:bg-muted"
              >
                <X className="h-4.5 w-4.5" aria-hidden />
              </button>
            </div>

            <form onSubmit={guardar} className="space-y-3">
              <div className="grid gap-3 sm:grid-cols-2">
                <Campo etiqueta="Nombre" value={f.nombre} onChange={set("nombre")} required autoFocus />
                <Campo etiqueta="Apellido" value={f.apellido} onChange={set("apellido")} />
              </div>

              <Campo
                etiqueta="Teléfono"
                type="tel"
                inputMode="tel"
                placeholder="11 5555-4444"
                value={f.telefono}
                onChange={set("telefono")}
              />
              <p className="text-caption text-muted-foreground">
                Con el teléfono cargado se puede mandar el comprobante por WhatsApp.
              </p>

              <div className="grid gap-3 sm:grid-cols-2">
                <Campo etiqueta="Email" type="email" value={f.email} onChange={set("email")} />
                <Campo etiqueta="DNI o CUIT" value={f.documento} onChange={set("documento")} />
              </div>

              <label className="block space-y-1.5">
                <span className="text-caption font-medium text-muted-foreground">Notas</span>
                <textarea
                  rows={2}
                  value={f.notas}
                  onChange={set("notas")}
                  maxLength={500}
                  placeholder="Ej. paga siempre por transferencia"
                  className="w-full resize-none rounded-[var(--radius-sm)] border border-border bg-card px-3 py-2 text-base text-foreground outline-none focus:border-accent"
                />
              </label>

              {error && (
                <p role="alert" className="text-caption text-destructive">
                  {error}
                </p>
              )}

              <button
                type="submit"
                disabled={pendiente}
                className="min-h-11 w-full rounded-[var(--radius-sm)] bg-accent text-sm font-semibold text-accent-foreground transition-transform active:scale-[0.98] disabled:opacity-60"
              >
                {pendiente ? "Guardando…" : editando ? "Guardar cambios" : "Agregar cliente"}
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  );
}

function Campo({
  etiqueta,
  ...props
}: { etiqueta: string } & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <label className="block space-y-1.5">
      <span className="text-caption font-medium text-muted-foreground">{etiqueta}</span>
      <input
        className="min-h-11 w-full rounded-[var(--radius-sm)] border border-border bg-card px-3 text-base text-foreground outline-none focus:border-accent"
        {...props}
      />
    </label>
  );
}
