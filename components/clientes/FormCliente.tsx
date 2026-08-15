"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Pencil, Plus } from "lucide-react";

import { useIsla } from "@/components/isla/IslaContext";
import { Sheet } from "@/components/sheet/Sheet";
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
            ? "grid h-10 w-10 place-items-center rounded-xl text-muted-foreground transition-colors hover:bg-muted hover:text-accent"
            : "flex min-h-11 items-center gap-2 rounded-xl bg-accent px-4 text-sm font-bold text-white shadow-sm transition-transform hover:brightness-110 active:scale-[0.98]"
        }
        aria-label={editando ? `Editar ${cliente?.nombre}` : undefined}
      >
        {editando ? (
          <Pencil className="h-4 w-4" aria-hidden />
        ) : (
          <>
            <Plus className="h-4 w-4" strokeWidth={2.5} aria-hidden />
            <span>Nuevo cliente</span>
          </>
        )}
      </button>

      <Sheet
        abierto={abierto}
        onCerrar={() => setAbierto(false)}
        titulo={editando ? "Editar cliente" : "Nuevo cliente"}
      >
        <form onSubmit={guardar} className="space-y-4 p-5">
          <div className="grid gap-3 sm:grid-cols-2">
            <Campo etiqueta="Nombre" value={f.nombre} onChange={set("nombre")} required autoFocus />
            <Campo etiqueta="Apellido" value={f.apellido} onChange={set("apellido")} />
          </div>

          <Campo
            etiqueta="Teléfono (WhatsApp)"
            type="tel"
            inputMode="tel"
            placeholder="11 5555-4444"
            value={f.telefono}
            onChange={set("telefono")}
          />
          <p className="text-caption text-muted-foreground -mt-2">
            El link de seguimiento se envía a este número por WhatsApp.
          </p>

          <div className="grid gap-3 sm:grid-cols-2">
            <Campo etiqueta="Email" type="email" value={f.email} onChange={set("email")} />
            <Campo etiqueta="DNI o CUIT" value={f.documento} onChange={set("documento")} />
          </div>

          <label className="block space-y-1.5">
            <span className="text-caption font-semibold text-muted-foreground">Notas</span>
            <textarea
              rows={2}
              value={f.notas}
              onChange={set("notas")}
              maxLength={500}
              placeholder="Ej. paga siempre por transferencia"
              className="w-full resize-none rounded-xl border border-border bg-card px-3.5 py-2.5 text-base text-foreground outline-none focus:border-accent"
            />
          </label>

          {error && (
            <p role="alert" className="text-caption text-destructive font-bold">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={pendiente}
            className="min-h-12 w-full rounded-2xl bg-accent text-base font-bold text-white shadow-md transition-transform active:scale-[0.98] disabled:opacity-60"
          >
            {pendiente ? "Guardando…" : editando ? "Guardar cambios" : "Agregar cliente"}
          </button>
        </form>
      </Sheet>
    </>
  );
}

function Campo({
  etiqueta,
  ...props
}: { etiqueta: string } & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <label className="block space-y-1.5">
      <span className="text-caption font-semibold text-muted-foreground">{etiqueta}</span>
      <input
        className="min-h-12 w-full rounded-xl border border-border bg-card px-3.5 text-base text-foreground outline-none focus:border-accent"
        {...props}
      />
    </label>
  );
}
