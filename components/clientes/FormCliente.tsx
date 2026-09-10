"use client";

import { useState, useRef, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Pencil, Plus, Camera, Loader2, Sparkles, AlertCircle } from "lucide-react";

import { useIsla } from "@/components/isla/IslaContext";
import { Sheet } from "@/components/sheet/Sheet";
import { actualizarCliente, crearCliente } from "@/lib/actions/clientes";
import { escanearCedulaVerdeAction } from "@/lib/actions/cedula-verde";
import { desglosarTitular } from "@/lib/cedula";

export interface DatosCliente {
  id?: string;
  nombre: string;
  apellido?: string | null;
  telefono?: string | null;
  email?: string | null;
  documento?: string | null;
  notas?: string | null;
}

export function FormCliente({
  cliente,
  botonTrigger,
  onClienteCreado,
}: {
  cliente?: DatosCliente;
  botonTrigger?: React.ReactNode;
  onClienteCreado?: (cliente: { id: string; nombre: string; apellido: string; telefono?: string; documento?: string }) => void;
}) {
  const router = useRouter();
  const { notificar } = useIsla();
  const [abierto, setAbierto] = useState(false);
  const [pendiente, iniciar] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [escaneandoCedula, setEscaneandoCedula] = useState(false);
  const inputFotoRef = useRef<HTMLInputElement>(null);

  const editando = Boolean(cliente?.id);

  const [f, setF] = useState({
    nombre: cliente?.nombre ?? "",
    apellido: cliente?.apellido ?? "",
    telefono: cliente?.telefono ?? "",
    email: cliente?.email ?? "",
    documento: cliente?.documento ?? "",
    notas: cliente?.notas ?? "",
  });

  const abrir = () => {
    setError(null);
    if (!editando) {
      setF({
        nombre: "",
        apellido: "",
        telefono: "",
        email: "",
        documento: "",
        notas: "",
      });
    } else {
      setF({
        nombre: cliente?.nombre ?? "",
        apellido: cliente?.apellido ?? "",
        telefono: cliente?.telefono ?? "",
        email: cliente?.email ?? "",
        documento: cliente?.documento ?? "",
        notas: cliente?.notas ?? "",
      });
    }
    setAbierto(true);
  };

  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setF((prev) => ({ ...prev, [k]: e.target.value }));

  async function procesarFotoCedula(file: File) {
    setEscaneandoCedula(true);
    setError(null);
    try {
      const reader = new FileReader();
      const base64Promise = new Promise<string>((resolve, reject) => {
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });
      const dataUri = await base64Promise;

      const res = await escanearCedulaVerdeAction(dataUri);
      if (res.error) {
        setError(res.error);
        return;
      }

      if (res.datos) {
        const titularLimpio = desglosarTitular(res.datos.titularNombre);
        setF((prev) => ({
          ...prev,
          nombre: titularLimpio.nombre || prev.nombre,
          apellido: titularLimpio.apellido || prev.apellido,
          documento: res.datos?.titularDocumento || prev.documento,
        }));

        notificar({
          tipo: "exito",
          mensaje: `✨ Cédula leída: ${[titularLimpio.nombre, titularLimpio.apellido].filter(Boolean).join(" ")}${res.datos.titularDocumento ? ` (DNI: ${res.datos.titularDocumento})` : ""}`,
        });
      }
    } catch (err) {
      console.warn("[FormCliente/OCR]", err);
      setError("No se pudo procesar la imagen de la cédula.");
    } finally {
      setEscaneandoCedula(false);
    }
  }

  function guardar(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    iniciar(async () => {
      const res = editando ? await actualizarCliente(cliente!.id!, f) : await crearCliente(f);
      if (res.error) return setError(res.error);

      notificar({ tipo: "exito", mensaje: editando ? "Cliente actualizado" : "Cliente agregado" });
      if (!editando && res.id) {
        onClienteCreado?.({
          id: res.id,
          nombre: f.nombre,
          apellido: f.apellido,
          telefono: f.telefono,
          documento: f.documento,
        });
      }
      setAbierto(false);
      router.refresh();
    });
  }

  return (
    <>
      {botonTrigger ? (
        <div
          onClick={(e) => {
            e.stopPropagation();
            abrir();
          }}
          className="inline-block cursor-pointer"
        >
          {botonTrigger}
        </div>
      ) : (
        <button
          type="button"
          onClick={abrir}
          className={
            editando
              ? "grid h-10 w-10 place-items-center rounded-xl text-muted-foreground transition-colors hover:bg-muted hover:text-accent active:scale-95"
              : "flex min-h-11 items-center gap-2 rounded-xl bg-accent px-4 text-sm font-bold text-white shadow-sm transition-all hover:brightness-110 active:scale-[0.98]"
          }
          aria-label={editando ? `Editar ${cliente?.nombre}` : "Nuevo cliente"}
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
      )}

      <Sheet
        abierto={abierto}
        onCerrar={() => setAbierto(false)}
        titulo={editando ? "Editar cliente" : "Nuevo cliente"}
      >
        {/* Input oculto para subir foto de cédula */}
        <input
          ref={inputFotoRef}
          type="file"
          accept="image/*"
          capture="environment"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) procesarFotoCedula(file);
            e.target.value = "";
          }}
        />

        <form onSubmit={guardar} className="space-y-4 pt-1">
          {/* Botón rápido de escanear cédula */}
          {!editando && (
            <div className="rounded-2xl border border-dashed border-accent/40 bg-accent/5 p-3 flex items-center justify-between gap-2">
              <div className="min-w-0">
                <span className="flex items-center gap-1.5 text-xs font-black text-accent">
                  <Sparkles className="h-3.5 w-3.5" />
                  ¿Tenés la Cédula Verde a mano?
                </span>
                <p className="text-[11px] text-muted-foreground">
                  Escaneá la cédula y la IA completa nombre, apellido y DNI en 2 segundos.
                </p>
              </div>

              <button
                type="button"
                onClick={() => inputFotoRef.current?.click()}
                disabled={escaneandoCedula}
                className="shrink-0 flex items-center gap-1.5 rounded-xl bg-accent px-3 py-2 text-xs font-bold text-white shadow-sm hover:brightness-110 active:scale-95 disabled:opacity-60 transition-all"
              >
                {escaneandoCedula ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    <span>Leyendo...</span>
                  </>
                ) : (
                  <>
                    <Camera className="h-3.5 w-3.5" />
                    <span>Escanear Cédula</span>
                  </>
                )}
              </button>
            </div>
          )}

          <div className="grid gap-3 sm:grid-cols-2">
            <Campo etiqueta="Nombre" value={f.nombre} onChange={set("nombre")} required placeholder="Ej: Juan" />
            <Campo etiqueta="Apellido" value={f.apellido} onChange={set("apellido")} placeholder="Ej: Pérez" />
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
            <Campo etiqueta="DNI o CUIT" value={f.documento} onChange={set("documento")} placeholder="Ej: 38123456" />
            <Campo etiqueta="Email" type="email" value={f.email} onChange={set("email")} placeholder="ejemplo@correo.com" />
          </div>

          <label className="block space-y-1.5">
            <span className="text-caption font-semibold text-muted-foreground">Notas internas</span>
            <textarea
              rows={2}
              value={f.notas}
              onChange={set("notas")}
              maxLength={500}
              placeholder="Ej: paga por transferencia, cliente de flota..."
              className="w-full resize-none rounded-xl border border-border bg-card px-3.5 py-2 text-sm text-foreground outline-none focus:border-accent transition-colors"
            />
          </label>

          {error && (
            <div role="alert" className="flex items-center gap-2 rounded-xl bg-destructive/10 border border-destructive/25 p-3 text-xs font-bold text-destructive animate-in fade-in">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div className="pt-2 flex items-center gap-2">
            <button
              type="button"
              onClick={() => setAbierto(false)}
              className="min-h-12 flex-1 rounded-xl border border-border bg-card text-sm font-bold text-muted-foreground hover:bg-muted active:scale-[0.98] transition-all"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={pendiente || escaneandoCedula}
              className="min-h-12 flex-2 rounded-xl bg-accent text-sm font-bold text-white shadow-md transition-all hover:brightness-105 active:scale-[0.98] disabled:opacity-60"
            >
              {pendiente ? "Guardando…" : editando ? "Guardar cambios" : "Registrar cliente"}
            </button>
          </div>
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
        className="min-h-11 w-full rounded-xl border border-border bg-card px-3.5 text-sm text-foreground outline-none focus:border-accent transition-colors"
        {...props}
      />
    </label>
  );
}

