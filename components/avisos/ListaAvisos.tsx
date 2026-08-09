"use client";

import { BellRing, MessageCircle, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { useIsla } from "@/components/isla/IslaContext";
import {
  descartarRecordatorio,
  marcarContactado,
  type RecordatorioAContactar,
} from "@/lib/actions/recordatorios";
import { armarLinkRecordatorio } from "@/lib/whatsapp";

const fechaCorta = (iso: string | null) =>
  iso
    ? new Date(`${iso}T12:00:00`).toLocaleDateString("es-AR", { day: "2-digit", month: "short" })
    : null;

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
  const router = useRouter();
  const { notificar } = useIsla();
  const [avisos, setAvisos] = useState(iniciales);
  const [, iniciar] = useTransition();

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

    setAvisos((prev) => prev.filter((x) => x.id !== a.id));
    iniciar(async () => {
      const res = await marcarContactado(a.id);
      if (res.error) notificar({ tipo: "error", mensaje: res.error });
      router.refresh();
    });
  }

  function descartar(a: RecordatorioAContactar) {
    setAvisos((prev) => prev.filter((x) => x.id !== a.id));
    iniciar(async () => {
      const res = await descartarRecordatorio(a.id);
      if (res.error) notificar({ tipo: "error", mensaje: res.error });
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
    <ul className="grid gap-2.5 lg:grid-cols-2">
      {avisos.map((a, i) => (
        <li
          key={a.id}
          className="tarjeta entrar flex items-center gap-3 p-3.5"
          style={{ "--i": i + 2 } as React.CSSProperties}
        >
          <span className="min-w-0 flex-1">
            <span className="block truncate text-sm font-semibold text-foreground">
              {a.descripcion}
              <span className="ml-1.5 font-bold text-accent">{a.patente}</span>
            </span>
            <span className="block truncate text-caption text-muted-foreground">
              {a.clienteNombre ?? "Sin dueño cargado"}
              {a.telefono ? "" : " · sin teléfono"}
            </span>
            <span className="mt-0.5 block text-caption font-semibold text-amber-700">
              {a.vencePor === "km"
                ? `Pasó los ${a.kmObjetivo?.toLocaleString("es-AR")} km${
                    a.kmActual ? ` (va en ${a.kmActual.toLocaleString("es-AR")})` : ""
                  }`
                : `Toca por fecha${a.fechaObjetivo ? `: ${fechaCorta(a.fechaObjetivo)}` : ""}`}
            </span>
          </span>

          <button
            type="button"
            onClick={() => contactar(a)}
            disabled={!a.telefono}
            aria-label={`Avisar por WhatsApp a ${a.clienteNombre ?? a.patente}`}
            className="grid h-11 w-11 shrink-0 place-items-center rounded-[var(--radius-sm)] bg-emerald-600 text-white transition-transform active:scale-95 disabled:opacity-30"
          >
            <MessageCircle className="h-4.5 w-4.5" aria-hidden />
          </button>
          <button
            type="button"
            onClick={() => descartar(a)}
            aria-label={`Descartar el aviso de ${a.patente}`}
            className="grid h-11 w-11 shrink-0 place-items-center rounded-[var(--radius-sm)] text-muted-foreground hover:bg-muted"
          >
            <X className="h-4.5 w-4.5" aria-hidden />
          </button>
        </li>
      ))}
    </ul>
  );
}
