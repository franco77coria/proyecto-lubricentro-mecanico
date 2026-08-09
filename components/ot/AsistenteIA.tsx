"use client";

import { Copy, Lightbulb, Loader2, MessageCircle, Sparkles, Wrench } from "lucide-react";
import { useState, useTransition } from "react";

import { useIsla } from "@/components/isla/IslaContext";
import {
  sugerirDiagnostico,
  traducirDescargo,
  type HipotesisDiagnostico,
} from "@/lib/actions/ia";
import { normalizarTelefono, paraWhatsApp } from "@/lib/telefono";

/**
 * Los dos asistentes de la orden.
 *
 * Van juntos en una tarjeta porque son los dos extremos del mismo trabajo: uno
 * ayuda a entender qué revisar cuando el auto entra, el otro a contarle al
 * cliente qué se hizo cuando sale.
 *
 * NADA se envía ni se guarda solo. La traducción aparece en un textarea
 * editable y el envío es un segundo gesto explícito; el diagnóstico es una lista
 * de qué revisar con su advertencia. Un asistente que manda mensajes que el
 * taller no leyó es un accidente esperando a pasar.
 */
export function AsistenteIA({
  otId,
  patente,
  telefonoCliente,
  nombreCliente,
  tallerNombre,
}: {
  otId: string;
  patente: string;
  telefonoCliente: string | null;
  nombreCliente: string | null;
  tallerNombre: string;
}) {
  const { notificar } = useIsla();
  const [pendiente, iniciar] = useTransition();
  const [cual, setCual] = useState<"diagnostico" | "traduccion" | null>(null);

  const [hipotesis, setHipotesis] = useState<HipotesisDiagnostico[] | null>(null);
  const [antecedentes, setAntecedentes] = useState(0);
  const [mensaje, setMensaje] = useState<string | null>(null);

  function pedirDiagnostico() {
    setCual("diagnostico");
    iniciar(async () => {
      const res = await sugerirDiagnostico(otId);
      if (res.error) {
        notificar({ tipo: "error", mensaje: res.error });
        setCual(null);
        return;
      }
      setHipotesis(res.hipotesis ?? []);
      setAntecedentes(res.antecedentes ?? 0);
    });
  }

  function pedirTraduccion() {
    setCual("traduccion");
    iniciar(async () => {
      const res = await traducirDescargo(otId);
      if (res.error) {
        notificar({ tipo: "error", mensaje: res.error });
        setCual(null);
        return;
      }
      setMensaje(res.texto ?? "");
    });
  }

  function enviarPorWhatsApp() {
    if (!mensaje) return;
    const norm = telefonoCliente ? normalizarTelefono(telefonoCliente) : null;
    const tel = norm ? paraWhatsApp(norm) : null;
    const saludo = nombreCliente?.trim() ? `Hola ${nombreCliente.trim()}!` : "Hola!";
    const texto = `${saludo} Te escribimos de *${tallerNombre}* por tu ${patente}.

${mensaje}

Cualquier duda quedamos a disposición.`;
    const base = tel ? `https://wa.me/${tel}` : "https://wa.me/";
    window.open(`${base}?text=${encodeURIComponent(texto)}`, "_blank", "noopener");
  }

  function copiar() {
    if (!mensaje) return;
    navigator.clipboard
      .writeText(mensaje)
      .then(() => notificar({ tipo: "exito", mensaje: "Mensaje copiado" }))
      .catch(() => notificar({ tipo: "error", mensaje: "No se pudo copiar" }));
  }

  return (
    <section className="space-y-3 rounded-2xl border border-violet-200 bg-violet-50/40 p-4">
      <h2 className="flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-foreground">
        <Sparkles className="h-4 w-4 text-violet-600" aria-hidden />
        Asistente
      </h2>

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={pedirDiagnostico}
          disabled={pendiente}
          className="flex min-h-11 flex-1 items-center justify-center gap-2 rounded-xl bg-white text-xs font-bold text-violet-700 shadow-sm transition-transform active:scale-[0.98] disabled:opacity-60"
        >
          {pendiente && cual === "diagnostico" ? (
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
          ) : (
            <Wrench className="h-4 w-4" aria-hidden />
          )}
          Qué revisar
        </button>
        <button
          type="button"
          onClick={pedirTraduccion}
          disabled={pendiente}
          className="flex min-h-11 flex-1 items-center justify-center gap-2 rounded-xl bg-white text-xs font-bold text-violet-700 shadow-sm transition-transform active:scale-[0.98] disabled:opacity-60"
        >
          {pendiente && cual === "traduccion" ? (
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
          ) : (
            <MessageCircle className="h-4 w-4" aria-hidden />
          )}
          Explicarlo al cliente
        </button>
      </div>

      {/* Diagnóstico */}
      {hipotesis && (
        <div className="space-y-2">
          <p className="text-caption text-muted-foreground">
            {antecedentes > 0
              ? `Basado en ${antecedentes} caso${antecedentes === 1 ? "" : "s"} que este taller ya resolvió en el mismo modelo.`
              : "Todavía no hay casos previos de este modelo en el taller, así que va sin antecedentes propios."}
          </p>

          {hipotesis.length === 0 ? (
            <p className="text-caption text-muted-foreground">
              No se pudo armar una sugerencia con esos síntomas.
            </p>
          ) : (
            <ol className="space-y-2">
              {hipotesis.map((h, i) => (
                <li key={i} className="rounded-xl bg-white p-3 shadow-sm">
                  <div className="flex items-baseline justify-between gap-2">
                    <span className="text-sm font-bold text-foreground">{h.causa}</span>
                    <span className="tabular shrink-0 text-caption font-bold text-violet-700">
                      {h.probabilidad}%
                    </span>
                  </div>
                  <p className="mt-1 flex items-start gap-1.5 text-caption text-muted-foreground">
                    <Lightbulb className="mt-0.5 h-3 w-3 shrink-0 text-amber-500" aria-hidden />
                    {h.como_verificar}
                  </p>
                </li>
              ))}
            </ol>
          )}

          <p className="text-caption text-muted-foreground">
            Esto <strong>orienta la revisión</strong>, no la reemplaza. La conclusión
            la pone el mecánico.
          </p>
        </div>
      )}

      {/* Traducción del descargo */}
      {mensaje !== null && (
        <div className="space-y-2">
          <label htmlFor="mensaje-ia" className="text-caption text-muted-foreground">
            Mensaje para el cliente — revisalo y editalo antes de mandar
          </label>
          <textarea
            id="mensaje-ia"
            rows={6}
            value={mensaje}
            onChange={(e) => setMensaje(e.target.value)}
            className="w-full resize-y rounded-xl border border-border bg-white px-3 py-2 text-sm text-foreground outline-none focus:border-violet-500"
          />
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={enviarPorWhatsApp}
              className="flex min-h-11 flex-1 items-center justify-center gap-2 rounded-xl bg-emerald-600 text-xs font-bold text-white active:scale-95"
            >
              <MessageCircle className="h-4 w-4" aria-hidden />
              Enviar por WhatsApp
            </button>
            <button
              type="button"
              onClick={copiar}
              aria-label="Copiar el mensaje"
              className="grid min-h-11 w-11 place-items-center rounded-xl bg-white text-foreground shadow-sm active:scale-95"
            >
              <Copy className="h-4 w-4" aria-hidden />
            </button>
          </div>
          <p className="text-caption text-muted-foreground">
            Redactado a partir de tus notas técnicas. Revisalo: no agrega precios,
            plazos ni garantías, pero la responsabilidad de lo que se manda es del
            taller.
          </p>
        </div>
      )}
    </section>
  );
}
