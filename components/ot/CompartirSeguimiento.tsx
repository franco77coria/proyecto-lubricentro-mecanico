"use client";

import { Copy, Link2, Loader2, MessageCircle, RefreshCw, Check } from "lucide-react";
import { useState, useTransition } from "react";

import { useIsla } from "@/components/isla/IslaContext";
import { generarLinkSeguimiento } from "@/lib/actions/seguimiento";
import { normalizarTelefono, paraWhatsApp } from "@/lib/telefono";

/**
 * El link de seguimiento que se le manda al cliente.
 *
 * Áreas táctiles de mínimo 48px para operar cómodamente en el mostrador o fosa.
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
  const [copiado, setCopiado] = useState(false);
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
      .then(() => {
        setCopiado(true);
        setTimeout(() => setCopiado(false), 2000);
        notificar({ tipo: "exito", mensaje: "Link copiado al portapapeles" });
      })
      .catch(() => notificar({ tipo: "error", mensaje: "No se pudo copiar" }));
  }

  function porWhatsApp() {
    if (!url) return;
    const norm = telefonoCliente ? normalizarTelefono(telefonoCliente) : null;
    const tel = norm ? paraWhatsApp(norm) : null;
    const saludo = nombreCliente?.trim() ? `¡Hola ${nombreCliente.trim()}!` : "¡Hola!";
    const texto = `${saludo} Te escribimos de *${tallerNombre}*.
Podés seguir el estado de tu vehículo *${patente}* en vivo, ver fotos de la reparación y el presupuesto acá:
${url}`;
    const base = tel ? `https://wa.me/${tel}` : "https://wa.me/";
    window.open(`${base}?text=${encodeURIComponent(texto)}`, "_blank", "noopener");
  }

  return (
    <section className="space-y-3 rounded-3xl border border-border/80 bg-card p-5 shadow-sm">
      <div className="flex items-center justify-between">
        <h2 className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-foreground">
          <Link2 className="h-4 w-4 text-accent" aria-hidden />
          Seguimiento para el cliente
        </h2>
        {token && (
          <span className="text-[10px] font-mono font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
            Activo 90 días
          </span>
        )}
      </div>

      {!token ? (
        <>
          <p className="text-xs text-muted-foreground leading-relaxed">
            Generá un link protegido para que el cliente vea el avance paso a paso, fotos del trabajo y apruebe el presupuesto desde el celular.
          </p>
          <button
            type="button"
            onClick={() => generar(false)}
            disabled={pendiente}
            className="flex min-h-12 w-full items-center justify-center gap-2 rounded-2xl bg-accent text-xs font-black text-white shadow-md shadow-orange-500/20 active:scale-[0.98] disabled:opacity-60 hover:brightness-110 transition-all"
          >
            {pendiente ? (
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
            ) : (
              <Link2 className="h-4 w-4 stroke-[2.5]" aria-hidden />
            )}
            Generar link de seguimiento
          </button>
        </>
      ) : (
        <>
          <p className="break-all rounded-xl bg-muted/60 border border-border/60 px-3 py-2 text-xs font-mono text-muted-foreground">
            {url}
          </p>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={porWhatsApp}
              className="flex min-h-12 flex-1 items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 text-xs font-black text-white shadow-sm active:scale-95 hover:bg-emerald-500 transition-all"
            >
              <MessageCircle className="h-4.5 w-4.5 stroke-[2.5]" aria-hidden />
              Enviar por WhatsApp
            </button>
            <button
              type="button"
              onClick={copiar}
              aria-label="Copiar el link"
              className="grid min-h-12 min-w-12 place-items-center rounded-xl bg-muted border border-border/80 text-foreground active:scale-95 hover:bg-muted/80 transition-all"
            >
              {copiado ? <Check className="h-4.5 w-4.5 text-emerald-400" /> : <Copy className="h-4.5 w-4.5" aria-hidden />}
            </button>
            <button
              type="button"
              onClick={() => generar(true)}
              disabled={pendiente}
              aria-label="Generar un link nuevo e invalidar el anterior"
              className="grid min-h-12 min-w-12 place-items-center rounded-xl bg-muted border border-border/80 text-muted-foreground active:scale-95 disabled:opacity-50 hover:bg-muted/80 transition-all"
            >
              <RefreshCw className={`h-4.5 w-4.5 ${pendiente ? "animate-spin" : ""}`} aria-hidden />
            </button>
          </div>
        </>
      )}
    </section>
  );
}
