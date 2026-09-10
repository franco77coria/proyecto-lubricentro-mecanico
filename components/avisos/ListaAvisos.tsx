"use client";

import { BellRing, MessageCircle, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { useIsla } from "@/components/isla/IslaContext";
import { PlacaPatente } from "@/components/ui/PlacaPatente";
import {
  descartarRecordatorio,
  marcarContactado,
  type RecordatorioAContactar,
} from "@/lib/actions/recordatorios";
import { armarLinkRecordatorio } from "@/lib/whatsapp";
import { useFormato } from "@/lib/i18n/I18nContext";


/**
 * A quién contactar esta semana.
 *
 * Cada fila explica POR QUÉ está en la lista (km o fecha) porque de eso depende
 * lo que se le dice al cliente. Un listado que solo dice "avisar" obliga a
 * entrar a la ficha para saber qué contarle.
 *
 * El botón de WhatsApp abre el chat con el mensaje escrito y marca el aviso
 * como contactado en el mismo gesto: si fueran dos acciones separadas, la
 * segunda no se hace nunca y la lista deja de reflejar la realidad.
 */
export function ListaAvisos({
  avisos: iniciales,
  tallerNombre,
}: {
  avisos: RecordatorioAContactar[];
  tallerNombre: string;
}) {
  const { numero, fecha } = useFormato();

  // El mediodía evita que la fecha se corra un día: "YYYY-MM-DD" suelto se
  // parsea como medianoche UTC (lección #80).
  const fechaCorta = (iso: string | null) =>
    iso ? fecha(`${iso}T12:00:00`, { day: "2-digit", month: "short" }) : null;
  const router = useRouter();
  const { notificar } = useIsla();
  const [descartadosIds, setDescartadosIds] = useState<string[]>([]);
  const [pendiente, iniciar] = useTransition();

  const avisos = iniciales.filter((x) => !descartadosIds.includes(x.id));

  function contactar(a: RecordatorioAContactar) {
    const link = armarLinkRecordatorio({
      patente: a.patente,
      descripcion: a.descripcion,
      telefono: a.telefono,
      clienteNombre: a.clienteNombre,
      tallerNombre,
      vencePor: a.vencePor,
    });

    if (!link) {
      notificar({
        tipo: "alerta",
        mensaje: "Este auto no tiene teléfono cargado. Agregalo en la ficha del cliente.",
      });
      return;
    }

    // Se abre primero: si el navegador bloquea la ventana por no venir de un
    // click directo, el usuario ve el bloqueo y no un "listo" mentiroso.
    window.open(link, "_blank", "noopener");

    setDescartadosIds((curr) => [...curr, a.id]);
    iniciar(async () => {
      const res = await marcarContactado(a.id);
      if (res?.error) {
        setDescartadosIds((curr) => curr.filter((id) => id !== a.id));
        notificar({ tipo: "error", mensaje: res.error });
      }
      router.refresh();
    });
  }

  function descartar(a: RecordatorioAContactar) {
    setDescartadosIds((curr) => [...curr, a.id]);
    iniciar(async () => {
      const res = await descartarRecordatorio(a.id);
      if (res?.error) {
        setDescartadosIds((curr) => curr.filter((id) => id !== a.id));
        notificar({ tipo: "error", mensaje: res.error });
      }
      router.refresh();
    });
  }

  if (avisos.length === 0) {
    return (
      <div className="tarjeta entrar flex flex-col items-center gap-3 px-6 py-14 text-center">
        <span className="grid h-12 w-12 place-items-center rounded-full bg-accent-suave text-accent">
          <BellRing className="h-6 w-6" aria-hidden />
        </span>
        <p className="max-w-sm text-sm text-muted-foreground">
          Nadie por contactar todavía. Los avisos se agendan solos al entregar un
          auto con orden de lubricentro, para el próximo service por kilómetros o
          por fecha, lo que llegue primero.
        </p>
      </div>
    );
  }

  return (
    <ul className="grid gap-3 lg:grid-cols-2">
      {avisos.map((a, i) => (
        <li
          key={a.id}
          className="tarjeta entrar flex items-center justify-between gap-3 p-4"
          style={{ "--i": i + 2 } as React.CSSProperties}
        >
          <div className="flex items-start gap-3 min-w-0 flex-1">
            <PlacaPatente patente={a.patente} size="sm" />
            <div className="min-w-0 flex-1">
              <span className="block truncate text-sm font-bold text-foreground">
                {a.descripcion || "Vehículo sin modelo"}
              </span>
              <span className="block truncate text-caption text-muted-foreground">
                {a.clienteNombre ?? "Sin dueño cargado"}
                {a.telefono ? "" : " · sin teléfono"}
              </span>
              <span className="mt-1 inline-flex items-center gap-1.5 rounded-md bg-amber-500/10 px-2 py-0.5 text-[11px] font-semibold text-amber-400 border border-amber-500/20">
                {a.vencePor === "km"
                  ? `Pasó los ${numero(a.kmObjetivo ?? 0)} km${
                      a.kmActual ? ` (va en ${numero(a.kmActual)})` : ""
                    }`
                  : `Toca por fecha${a.fechaObjetivo ? `: ${fechaCorta(a.fechaObjetivo)}` : ""}`}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            <button
              type="button"
              onClick={() => contactar(a)}
              disabled={!a.telefono || pendiente}
              aria-label={`Avisar por WhatsApp a ${a.clienteNombre ?? a.patente}`}
              title="Abrir WhatsApp con aviso redactado"
              className="grid min-h-12 min-w-12 place-items-center rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/20 active:scale-95 transition-all disabled:opacity-30"
            >
              <MessageCircle className="h-5 w-5" aria-hidden />
            </button>
            <button
              type="button"
              onClick={() => descartar(a)}
              disabled={pendiente}
              aria-label={`Descartar el aviso de ${a.patente}`}
              title="Descartar aviso"
              className="grid min-h-12 min-w-12 place-items-center rounded-xl text-muted-foreground hover:bg-muted hover:text-foreground active:scale-95 transition-all disabled:opacity-30"
            >
              <X className="h-5 w-5" aria-hidden />
            </button>
          </div>
        </li>
      ))}
    </ul>
  );
}
