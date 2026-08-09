"use client";

import { Copy, Link2, Loader2, MessageCircle, RefreshCw } from "lucide-react";
import { useState, useTransition } from "react";

import { useIsla } from "@/components/isla/IslaContext";
import { generarLinkSeguimiento } from "@/lib/actions/seguimiento";
import { normalizarTelefono, paraWhatsApp } from "@/lib/telefono";

/**
 * El link de seguimiento que se le manda al cliente.
 *
 * El token se genera acá y no al crear la orden a propósito: una orden que
 * nunca se compartió no tiene por qué tener un link público vivo. Menos
 * superficie expuesta por defecto.
 *
 * Rotar sirve cuando el cliente reenvió el link a quien no debía: el anterior
 * deja de funcionar.
 */
export function CompartirSeguimiento({
  otId,
  patente,
  tokenExistente,
  telefonoCliente,
  nombreCliente,
  tallerNombre,
}: {
  otId: string;
  patente: string;
  tokenExistente: string | null;
  telefonoCliente: string | null;
  nombreCliente: string | null;
  tallerNombre: string;
}) {
  const { notificar } = useIsla();
  const [token, setToken] = useState(tokenExistente);
  const [pendiente, iniciar] = useTransition();

  const url = token
    ? `${typeof window === "undefined" ? "" : window.location.origin}/seguimiento/${token}`
    : null;

  function generar(rotando: boolean) {
    iniciar(async () => {
      const res = await generarLinkSeguimiento(otId);
      if (res.error || !res.token) {
        notificar({ tipo: "error", mensaje: res.error ?? "No se pudo generar el link" });
        return;
      }
      setToken(res.token);
      notificar({
        tipo: "exito",
        mensaje: rotando ? "Link nuevo — el anterior dejó de servir" : "Link de seguimiento listo",
      });
    });
  }

  function copiar() {
    if (!url) return;
    navigator.clipboard
      .writeText(url)
      .then(() => notificar({ tipo: "exito", mensaje: "Link copiado" }))
      .catch(() => notificar({ tipo: "error", mensaje: "No se pudo copiar" }));
  }

  function porWhatsApp() {
    if (!url) return;
    // `normalizarTelefono` devuelve null si el número no se puede interpretar;
    // sin teléfono el link se abre igual y el taller elige el contacto a mano.
    const norm = telefonoCliente ? normalizarTelefono(telefonoCliente) : null;
    const tel = norm ? paraWhatsApp(norm) : null;
    const saludo = nombreCliente?.trim() ? `Hola ${nombreCliente.trim()}!` : "Hola!";
    const texto = `${saludo} Te escribimos de *${tallerNombre}*.
Podés seguir el estado de tu vehículo *${patente}* y ver el detalle acá:
${url}`;
    const base = tel ? `https://wa.me/${tel}` : "https://wa.me/";
    window.open(`${base}?text=${encodeURIComponent(texto)}`, "_blank", "noopener");
  }

  return (
    <section className="space-y-2.5 rounded-2xl border border-border bg-card p-4">
      <h2 className="flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-foreground">
        <Link2 className="h-4 w-4 text-accent" aria-hidden />
        Seguimiento para el cliente
      </h2>

      {!token ? (
        <>
          <p className="text-caption text-muted-foreground">
            Generá un link para que el cliente vea el estado y apruebe el
            presupuesto desde su celular, sin instalar nada.
          </p>
          <button
            type="button"
            onClick={() => generar(false)}
            disabled={pendiente}
            className="flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-accent text-sm font-bold text-white active:scale-[0.98] disabled:opacity-60"
          >
            {pendiente ? (
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
            ) : (
              <Link2 className="h-4 w-4" aria-hidden />
            )}
            Generar link de seguimiento
          </button>
        </>
      ) : (
        <>
          <p className="break-all rounded-xl bg-muted px-3 py-2 text-caption text-muted-foreground">
            {url}
          </p>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={porWhatsApp}
              className="flex min-h-11 flex-1 items-center justify-center gap-2 rounded-xl bg-emerald-600 text-xs font-bold text-white active:scale-95"
            >
              <MessageCircle className="h-4 w-4" aria-hidden />
              Enviar por WhatsApp
            </button>
            <button
              type="button"
              onClick={copiar}
              aria-label="Copiar el link"
              className="grid min-h-11 w-11 place-items-center rounded-xl bg-muted text-foreground active:scale-95"
            >
              <Copy className="h-4 w-4" aria-hidden />
            </button>
            <button
              type="button"
              onClick={() => generar(true)}
              disabled={pendiente}
              aria-label="Generar un link nuevo e invalidar el anterior"
              className="grid min-h-11 w-11 place-items-center rounded-xl bg-muted text-muted-foreground active:scale-95 disabled:opacity-50"
            >
              <RefreshCw className="h-4 w-4" aria-hidden />
            </button>
          </div>
          <p className="text-caption text-muted-foreground">
            Vence en 90 días. El botón de refrescar genera uno nuevo y desactiva
            el anterior.
          </p>
        </>
      )}
    </section>
  );
}
